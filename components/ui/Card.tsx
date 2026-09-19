import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-surface/80 shadow-xl shadow-black/10 backdrop-blur-xl transition duration-200 ease-out hover:border-white/20 hover:bg-surface-raised/80 ${className}`}
      {...props}
    />
  );
}
