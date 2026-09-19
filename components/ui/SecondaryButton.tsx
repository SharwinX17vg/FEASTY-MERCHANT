import type { ButtonHTMLAttributes } from "react";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SecondaryButton({
  className = "",
  type = "button",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm shadow-black/10 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
