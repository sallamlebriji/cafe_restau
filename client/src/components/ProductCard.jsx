import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export const ProductCard = ({ product, onAdd }) => (
  <motion.article whileHover={{ y: -4 }} className="overflow-hidden rounded-lg bg-white shadow-soft">
    <img
      src={product.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"}
      alt={product.name}
      className="h-44 w-full object-cover"
    />
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-cream px-3 py-1 text-sm font-bold text-copper">{Number(product.price).toFixed(2)} DH</span>
      </div>
      <button
        onClick={() => onAdd(product)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-cream transition hover:bg-graphite"
      >
        <Plus size={17} />
        Ajouter
      </button>
    </div>
  </motion.article>
);
