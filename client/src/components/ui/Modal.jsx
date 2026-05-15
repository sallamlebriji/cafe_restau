import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export const Modal = ({ open, onClose, title, children, footer }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          initial={{ scale: 0.96, y: 18 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 18 }}
          className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-cream shadow-premium dark:bg-anthracite"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 p-4 dark:border-white/10 sm:p-5">
            <h2 className="min-w-0 truncate text-lg font-extrabold text-ink dark:text-cream sm:text-xl">{title}</h2>
            <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-elegant hover:bg-black/5 dark:hover:bg-white/10"><X size={19} /></button>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
          {footer && <div className="shrink-0 border-t border-black/10 p-4 dark:border-white/10 sm:p-5">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
