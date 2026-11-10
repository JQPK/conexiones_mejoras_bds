import { useEffect, useState, type ReactNode } from "react";
import { Pagination } from "./Pagination";
export interface DataColumn<T> {
  key: string;
  header: string;
  value: (row: T) => ReactNode;
  searchable?: (row: T) => string;
}
export function DataTable<T>({
  rows,
  columns,
  emptyMessage = "No hay registros para mostrar.",
  rowKey,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    setPage(1);
  }, [rows]);
  const visibleRows = rows.slice(
    (Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize))) - 1) *
      pageSize,
    Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize))) *
      pageSize,
  );
  const changePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-page text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {visibleRows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-surface-hover">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.value(row)}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
}
