"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PredictionsPoller() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - startRef.current > 180_000) {
        clearInterval(id);
        return;
      }
      startTransition(() => router.refresh());
    }, 2000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
