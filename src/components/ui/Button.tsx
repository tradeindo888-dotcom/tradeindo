import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

const styles: Record<Variant, string> = {
  primary: "bg-forest-700 text-white hover:bg-forest-500",
  secondary: "border border-forest-700 text-forest-700 hover:bg-forest-700/5 dark:text-forest-500 dark:border-forest-500",
  accent: "bg-lime-400 text-neutral-900 hover:bg-lime-300",
  ghost: "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
};
const sizes: Record<Size, string> = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-base" };

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${styles[variant]} ${sizes[size]} ${className}`}
    />
  );
}