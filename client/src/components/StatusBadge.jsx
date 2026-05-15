const colors = {
  NEW: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-indigo-50 text-indigo-700",
  PREPARING: "bg-amber-50 text-amber-700",
  READY: "bg-emerald-50 text-emerald-700",
  SERVED: "bg-zinc-100 text-zinc-700",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  FREE: "bg-emerald-50 text-emerald-700",
  OCCUPIED: "bg-red-50 text-red-700",
  RESERVED: "bg-amber-50 text-amber-700",
  CLEANING: "bg-sky-50 text-sky-700"
};

export const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[value] || "bg-zinc-100 text-zinc-700"}`}>
    {value}
  </span>
);
