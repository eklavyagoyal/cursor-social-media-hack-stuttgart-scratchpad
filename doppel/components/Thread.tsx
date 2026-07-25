"use client";

const handleOf = (name: string) => `@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

export function Thread({ posts, brand, accent }: { posts: string[]; brand: string; accent: string }) {
  return (
    <div className="relative">
      {posts.map((p, i) => (
        <div key={i} className="relative flex gap-4 pb-6">
          {/* connector */}
          {i < posts.length - 1 && (
            <div className="absolute left-[17px] top-11 bottom-0 w-px bg-white/12" />
          )}
          <div
            className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm text-white"
            style={{ background: accent }}
          >
            {brand.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 text-[13px]">
              <span className="font-semibold text-ash-100">{brand}</span>
              <span className="text-ash-400">{handleOf(brand)}</span>
              <span className="ml-auto font-mono text-[11px] text-ash-400">
                {i + 1}/{posts.length}
              </span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-[1.5] text-ash-100">{p}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
