"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const pageSizes = [5, 10, 20, 50, 100];

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4)
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages] as const;
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ] as const;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);
  const pageItems = getPageItems(currentPage, safeTotalPages);

  return (
    <nav
      aria-label="Table pagination"
      className="flex flex-col gap-4 border-t border-slate-200 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600">
        <span>
          Showing {start} to {end} of {totalItems} entries
        </span>
        <label className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            aria-label="Rows per page"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Page controls"
      >
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {pageItems.map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              aria-current={currentPage === item ? "page" : undefined}
              aria-label={`Go to page ${item}`}
              onClick={() => onPageChange(item)}
              className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${currentPage === item ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              {item}
            </button>
          ) : (
            <span key={item} aria-hidden="true" className="px-1 text-slate-400">
              …
            </span>
          ),
        )}
        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
