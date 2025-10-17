import type { ReactNode } from "react";
interface EmptyStateProps {
  title: string;
  message: string;
  cta?: ReactNode;
}

export function EmptyState({ title, message, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/20 p-12 text-center text-white/70">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="max-w-content-readable text-base leading-relaxed">{message}</p>
      {cta ? <div>{cta}</div> : null}
    </div>
  );
}
