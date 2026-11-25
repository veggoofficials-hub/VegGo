import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AccountPagination({ page, totalPages, totalElements, loading, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
      <span>
        Showing page <strong className="text-slate-800">{page + 1}</strong> of{' '}
        <strong className="text-slate-800">{totalPages}</strong>
        {typeof totalElements === 'number' ? ` (${totalElements} total)` : ''}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => onChange(page - 1)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <button
          type="button"
          disabled={page >= totalPages - 1 || loading}
          onClick={() => onChange(page + 1)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
