import { forwardRef } from "react";

export const Input = forwardRef(({ label, icon: Icon, error, className = "", ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>}
    <span className="relative block">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />}
      <input
        ref={ref}
        className={`min-h-11 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-2 text-base text-ink outline-none transition placeholder:text-zinc-400 focus:border-gold focus:ring-4 focus:ring-gold/15 dark:border-white/10 dark:bg-white/10 dark:text-cream sm:text-sm ${Icon ? "pl-10" : ""} ${className}`}
        {...props}
      />
    </span>
    {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
  </label>
));

Input.displayName = "Input";
