import { existsSync } from "node:fs";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import type { CaptionGroup } from "./types";

/**
 * This ffmpeg build ships without libass or drawtext, so captions are rendered
 * here as transparent PNGs and composited with `overlay`. It also gives finer
 * control over the look than subtitle formats do.
 */

const FONT_CANDIDATES: [path: string, family: string][] = [
  ["/System/Library/Fonts/Supplemental/Arial Black.ttf", "CaptionFont"],
  ["/System/Library/Fonts/Supplemental/Impact.ttf", "CaptionFont"],
  ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "CaptionFont"],
  ["/System/Library/Fonts/Helvetica.ttc", "CaptionFont"],
];

let fontFamily: string | null = null;

function ensureFont(): string {
  if (fontFamily) return fontFamily;
  for (const [file, family] of FONT_CANDIDATES) {
    if (existsSync(file) && GlobalFonts.registerFromPath(file, family)) {
      fontFamily = family;
      return family;
    }
  }
  fontFamily = "sans-serif";
  return fontFamily;
}

export type CaptionStyle = {
  fontSize: number;
  lineHeight: number;
  /** Text is wrapped to this fraction of the frame width. */
  maxWidthRatio: number;
  /** Distance from the frame bottom to the bottom of the text block. */
  marginBottom: number;
  fill: string;
  strokeWidth: number;
  stroke: string;
  /** Optional solid plate behind the text. Null renders outlined text only. */
  plate: string | null;
  platePadX: number;
  platePadY: number;
  plateRadius: number;
};

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontSize: 92,
  lineHeight: 1.12,
  maxWidthRatio: 0.84,
  marginBottom: 430,
  fill: "#FFFFFF",
  strokeWidth: 14,
  stroke: "#0A0A0A",
  plate: null,
  platePadX: 34,
  platePadY: 18,
  plateRadius: 22,
};

function wrap(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let line = words[0];
  for (const w of words.slice(1)) {
    const candidate = `${line} ${w}`;
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = w;
    }
  }
  lines.push(line);
  return lines;
}

function roundedRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fill();
}

export function renderCaptionPng(
  text: string,
  width: number,
  height: number,
  style: Partial<CaptionStyle> = {},
): Buffer {
  const s = { ...DEFAULT_CAPTION_STYLE, ...style };
  const family = ensureFont();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.font = `${s.fontSize}px "${family}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const lines = wrap(ctx, text, width * s.maxWidthRatio);
  const lineStep = s.fontSize * s.lineHeight;
  const blockHeight = lines.length * lineStep;
  const centerX = width / 2;
  // Baseline of the first line, so the block's bottom lands on marginBottom.
  const firstBaseline = height - s.marginBottom - blockHeight + s.fontSize;

  if (s.plate) {
    ctx.fillStyle = s.plate;
    lines.forEach((line, i) => {
      const w = ctx.measureText(line).width;
      const baseline = firstBaseline + i * lineStep;
      roundedRect(
        ctx,
        centerX - w / 2 - s.platePadX,
        baseline - s.fontSize + s.platePadY * 0.25,
        w + s.platePadX * 2,
        s.fontSize + s.platePadY * 1.5,
        s.plateRadius,
      );
    });
  }

  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = s.stroke;
  ctx.lineWidth = s.strokeWidth;
  ctx.fillStyle = s.fill;

  lines.forEach((line, i) => {
    const baseline = firstBaseline + i * lineStep;
    if (!s.plate && s.strokeWidth > 0) ctx.strokeText(line, centerX, baseline);
    ctx.fillText(line, centerX, baseline);
  });

  return canvas.toBuffer("image/png");
}

function captionSlug(index: number): string {
  return `cap-${String(index).padStart(3, "0")}.png`;
}

export function renderCaptionSet(
  captions: CaptionGroup[],
  width: number,
  height: number,
  style: Partial<CaptionStyle> = {},
): { group: CaptionGroup; name: string; png: Buffer }[] {
  return captions.map((group, i) => ({
    group,
    name: captionSlug(i),
    png: renderCaptionPng(group.text, width, height, style),
  }));
}
