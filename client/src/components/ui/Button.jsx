import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-ink text-cream hover:bg-anthracite dark:bg-gold dark:text-ink dark:hover:bg-[#d7bb7c]",
  secondary: "border border-black/10 bg-white text-ink hover:border-gold dark:border-white/10 dark:bg-white/10 dark:text-cream",
  ghost: "text-elegant hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
  danger: "bg-danger text-white hover:bg-red-700",
  gold: "bg-gold text-ink hover:bg-[#d6bb7d]"
};

const sizes = {
  sm: "min-h-10 px-3 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-6 py-2.5 text-base"
};

export const Button = ({ children, variant = "primary", size = "md", icon: Icon, loading, className = "", ...props }) => (
  <button
    className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl font-semibold shadow-sm transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? <Loader2 className="animate-spin" size={17} /> : Icon ? <Icon size={17} /> : null}
    {children}
  </button>
);
