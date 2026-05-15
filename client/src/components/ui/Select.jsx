import { forwardRef } from "react";

export const Select = forwardRef(({ label, options = [], className = "", ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>}
    <select
      ref={ref}
      className={`min-h-11 w-full rounded-2xl border border-black/10 bg-white/85 px-4 py-2 text-base font-semibold text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15 dark:border-white/10 dark:bg-white/10 dark:text-cream sm:text-sm ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value || option} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  </label>
));

Select.displayName = "Select";
