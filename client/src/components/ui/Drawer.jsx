import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export const Drawer = ({ open, onClose, title, children, side = "right" }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.aside
          initial={{ x: side === "right" ? "100%" : "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: side === "right" ? "100%" : "-100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className={`absolute top-0 flex h-dvh w-full max-w-xl flex-col bg-cream shadow-premium dark:bg-anthracite sm:w-[92vw] md:w-full ${side === "right" ? "right-0" : "left-0"}`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 bg-cream/95 p-4 backdrop-blur dark:border-white/10 dark:bg-anthracite/95 sm:p-5">
            <h2 className="min-w-0 truncate text-lg font-extrabold text-ink dark:text-cream sm:text-xl">{title}</h2>
            <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-elegant hover:bg-black/5 dark:hover:bg-white/10"><X size={19} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">{children}</div>
        </motion.aside>
      </motion.div>
    )}
  </AnimatePresence>
);
