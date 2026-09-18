import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/10 backdrop-blur-xl transition duration-200 ease-out hover:border-white/20 hover:bg-white/[0.08] ${className}`}
      {...props}
    />
  );
}
