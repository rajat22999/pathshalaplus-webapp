import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}
