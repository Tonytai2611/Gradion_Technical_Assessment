import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Button({ children, className = "", ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={`gd-focus inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-grad-orange px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
