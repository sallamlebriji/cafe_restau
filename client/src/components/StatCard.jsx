import { motion } from "framer-motion";

export const StatCard = ({ icon: Icon, label, value, hint, tone = "gold" }) => {
  const tones = {
    gold: "bg-gold/15 text-gold",
    copper: "bg-copper/15 text-copper",
    green: "bg-emerald-500/15 text-emerald-700",
    dark: "bg-ink text-cream"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-surface rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        </div>
        <div className={`rounded-lg p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
};
