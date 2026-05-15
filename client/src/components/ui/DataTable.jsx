import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export const DataTable = ({ data = [], columns = [], searchPlaceholder = "Recherche globale", pageSize = 8, onRowClick, onRowDoubleClick }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const memoColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data,
    columns: memoColumns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } }
  });
  const visibleRows = table.getRowModel().rows;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-soft dark:border-white/10 dark:bg-white/[0.06]">
      <div className="flex flex-col gap-3 border-b border-black/5 p-3 dark:border-white/10 sm:p-4 md:flex-row md:items-center md:justify-between">
        <Input icon={Search} value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder={searchPlaceholder} className="md:w-80" />
        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-elegant">
          {table.getFilteredRowModel().rows.length} resultats
        </div>
      </div>
      {visibleRows.length ? (
        <>
          <div className="grid gap-3 p-3 md:hidden">
            {visibleRows.map((row) => (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                onDoubleClick={() => onRowDoubleClick?.(row.original)}
                className="w-full rounded-2xl border border-black/5 bg-white/85 p-4 text-left shadow-sm transition active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="space-y-3">
                  {row.getVisibleCells().map((cell, index) => {
                    const header = cell.column.columnDef.header;
                    return (
                      <div key={cell.id} className={index === 0 ? "" : "border-t border-black/5 pt-3 dark:border-white/10"}>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-elegant">
                          {typeof header === "string" ? header : cell.column.id}
                        </p>
                        <div className="min-w-0 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-black/[0.025] text-xs uppercase tracking-[0.14em] text-elegant dark:bg-white/[0.04]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 font-bold">
                        <button className="inline-flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ChevronDown className="opacity-40" size={14} />
                        </button>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    onDoubleClick={() => onRowDoubleClick?.(row.original)}
                    className="cursor-pointer transition hover:bg-gold/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 text-zinc-700 dark:text-zinc-200">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-black/5 p-3 dark:border-white/10 sm:p-4">
            <span className="text-xs font-semibold text-elegant">
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} />
              <Button variant="secondary" size="sm" icon={ChevronRight} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} />
            </div>
          </div>
        </>
      ) : (
        <div className="p-5"><EmptyState /></div>
      )}
    </div>
  );
};
