"use client";

import { useState } from "react";

/** Rendered like the real thing so judges read it as output, not as a text blob. */
export function LinkedInPost({
  text,
  brand,
  accent,
}: {
  text: string;
  brand: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const long = text.length > 620;
  const shown = open || !long ? text : `${text.slice(0, 620).trimEnd()}…`;

  return (
    <article className="bg-white text-[#1b1f23]">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center font-serif text-xl text-white"
          style={{ background: accent }}
        >
          {brand.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold leading-tight">{brand}</div>
          <div className="truncate text-[12px] text-[#5e6668]">Company · 4,182 followers</div>
          <div className="text-[12px] text-[#5e6668]">now</div>
        </div>
      </div>

      <p className="whitespace-pre-wrap px-5 pb-4 pt-4 text-[14.5px] leading-[1.55]">
        {shown}
        {long && !open && (
          <button
            onClick={() => setOpen(true)}
            className="ml-1 text-[#5e6668] hover:text-[#0a66c2] hover:underline"
          >
            see more
          </button>
        )}
      </p>

      <div className="mx-5 flex items-center justify-between border-t border-black/10 py-2 text-[13px] font-medium text-[#5e6668]">
        {["Like", "Comment", "Repost", "Send"].map((a) => (
          <span key={a} className="px-2 py-1">
            {a}
          </span>
        ))}
      </div>
    </article>
  );
}
