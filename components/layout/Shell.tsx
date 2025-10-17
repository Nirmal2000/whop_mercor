import type { PropsWithChildren, ReactNode } from "react";
import clsx from "clsx";

type ShellProps = PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "narrow";
}>;

/**
 * Shell provides a consistent layout wrapper for Whop-embedded screens.
 * It centers the main content area and handles width constraints.
 */
export function Shell({
  header,
  footer,
  variant = "default",
  children
}: ShellProps) {
  const containerClass = clsx(
    "mx-auto flex w-full flex-1 flex-col",
    variant === "narrow" ? "max-w-content-readable" : "max-w-6xl",
    "px-4 pb-12 pt-6 md:px-8"
  );

  return (
    <div className="flex min-h-screen flex-col bg-whopSurface">
      {header ? <header className="border-b border-white/10">{header}</header> : null}
      <main className={containerClass}>{children}</main>
      {footer ? (
        <footer className="border-t border-white/10 bg-black/20">{footer}</footer>
      ) : null}
    </div>
  );
}

