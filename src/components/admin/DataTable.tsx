import type { ReactNode } from "react";
import { TableBody, TablePager } from "@/components/admin/TableNav";

export type Column<T> = {
  /** Stable key for the column (used as React key). */
  key: string;
  header: ReactNode;
  /** Cell renderer for a row. */
  render: (row: T) => ReactNode;
  /** Extra classes applied to both the header and body cells of this column. */
  className?: string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  /** Unique key per row. */
  rowKey: (row: T) => string;
  /** Optional per-row classes (e.g. highlight the newest row). */
  rowClassName?: (row: T, index: number) => string;
  emptyLabel: string;
  /** Minimum table width so columns stay readable while the wrapper scrolls. */
  minWidthClass?: string;
  /** Extra classes applied to every body cell (e.g. "align-top" for tall rows). */
  bodyCellClassName?: string;

  // --- Pagination (server-side). Omit `total` to render without a footer. ---
  page?: number;
  pageSize?: number;
  total?: number;
  /** Path the page links point at, e.g. "/admin/tips". */
  basePath?: string;
  /** Query param name for the page number (override so two tables can coexist). */
  pageParam?: string;
  /** Query params to preserve across page links (filters, other table's page). */
  query?: Record<string, string | undefined>;
};

function pageHref(
  basePath: string,
  query: Record<string, string | undefined> | undefined,
  page: number,
  pageParam: string,
) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v) params.set(k, v);
  }
  // Keep page 1 clean (no ?page=1) so the canonical URL stays tidy.
  if (page > 1) params.set(pageParam, String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  emptyLabel,
  minWidthClass = "min-w-[640px]",
  bodyCellClassName = "",
  page,
  pageSize,
  total,
  basePath,
  pageParam = "page",
  query,
}: DataTableProps<T>) {
  const hasPagination =
    typeof total === "number" &&
    typeof page === "number" &&
    typeof pageSize === "number" &&
    typeof basePath === "string";

  return (
    <div className="flex flex-col gap-3">
      {/* Header + pagination stay visible during a page change; TableBody swaps
          the rows for a spinner while the next page streams in. */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className={`w-full ${minWidthClass} text-left text-sm`}>
          <thead className="border-b border-neutral-100 text-xs text-neutral-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <TableBody colSpan={columns.length}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={rowKey(row)} className={`border-b border-neutral-50 ${rowClassName?.(row, index) ?? ""}`}>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${bodyCellClassName} ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </TableBody>
        </table>
      </div>

      {hasPagination ? (
        <Pagination page={page!} pageSize={pageSize!} total={total!} basePath={basePath!} pageParam={pageParam} query={query} />
      ) : null}
    </div>
  );
}

/**
 * Standalone pagination footer — reusable for non-table lists (e.g. a card
 * feed) that paginate server-side. Renders nothing when everything fits on one
 * page. Pass the same page/pageSize/total/basePath the data was fetched with.
 */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  pageParam = "page",
  query,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  pageParam?: string;
  query?: Record<string, string | undefined>;
}) {
  if (total <= pageSize) return null;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const firstRow = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-neutral-500">
        {firstRow}–{lastRow} / {total} 件
      </p>
      <div className="flex items-center gap-2">
        <TablePager
          href={pageHref(basePath, query, currentPage - 1, pageParam)}
          disabled={currentPage <= 1}
          label="前へ"
        />
        <span className="text-neutral-500">
          {currentPage} / {pageCount}
        </span>
        <TablePager
          href={pageHref(basePath, query, currentPage + 1, pageParam)}
          disabled={currentPage >= pageCount}
          label="次へ"
        />
      </div>
    </div>
  );
}
