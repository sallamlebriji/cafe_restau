import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

export const DataTable = ({ columns, rows, actions }) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(lower));
  }, [query, rows]);

  return (
    <div className="premium-surface overflow-hidden rounded-lg">
      <div className="flex flex-col gap-3 border-b border-zinc-200/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gold"
            placeholder="Rechercher"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-gold">
          <SlidersHorizontal size={16} />
          Filtres
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((row) => (
              <tr key={row.id} className="bg-white/60">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-zinc-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {actions && <td className="px-4 py-3">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
