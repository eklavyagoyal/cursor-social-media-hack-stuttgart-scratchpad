"use client";

import { useRef, useState } from "react";
import { Label } from "./ui";

export function Studio({
  brand,
  busy,
  note,
  onTopic,
  onVideo,
}: {
  brand: string;
  busy: boolean;
  note: string | null;
  onTopic: (topic: string) => void;
  onVideo: (file: File) => void;
}) {
  const [topic, setTopic] = useState("");
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="animate-rise">
      <Label className="mb-6">now make something · as {brand}</Label>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim() && !busy) onTopic(topic.trim());
          }}
          className="flex flex-col justify-between bg-ash-800 p-8"
        >
          <div>
            <h3 className="font-serif text-3xl text-ash-100">Give it a topic</h3>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={busy}
              placeholder="capturing expert knowledge before retirement"
              className="mt-6 w-full border-b border-white/15 bg-transparent pb-3 text-[17px] text-ash-100 outline-none transition-colors placeholder:text-ash-500 focus:border-brand disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !topic.trim()}
            className="mt-8 self-start bg-ash-100 px-7 py-3 text-[15px] font-medium text-background transition-opacity duration-200 hover:opacity-90 disabled:opacity-30"
          >
            Write the drop
          </button>
        </form>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f && !busy) onVideo(f);
          }}
          onClick={() => !busy && fileRef.current?.click()}
          className={`flex cursor-pointer flex-col justify-between p-8 transition-colors duration-200 ${
            over ? "bg-brand/15" : "bg-ash-800 hover:bg-ash-700"
          }`}
        >
          <div>
            <h3 className="font-serif text-3xl text-ash-100">Or drop a video</h3>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-ash-300">
              Record 30 seconds on your phone. We transcribe it, find the strongest idea, and write
              the whole drop in their voice.
            </p>
          </div>
          <div className="mt-8 font-mono text-[13px] text-ash-400">
            {over ? "release to upload" : "drag a file here, or click to choose"}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onVideo(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {note && <p className="mt-6 font-mono text-[15px] text-ash-300">{note}</p>}
    </div>
  );
}
