"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
};

export default function TeamLogo({ src, alt, className = "w-8 h-8" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${className} rounded-full bg-wc-subtle border border-wc-border flex items-center justify-center shrink-0`}
        aria-label={alt}
      >
        <span className="text-xs font-bold text-wc-muted leading-none">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain shrink-0`}
      onError={() => setFailed(true)}
    />
  );
}
