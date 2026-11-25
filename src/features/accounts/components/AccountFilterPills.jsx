/**
 * Small pill group used for the role / status / action filters on the
 * account-record screens.
 */
export default function AccountFilterPills({ label, options, value, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
          {label}
        </span>
      )}
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border disabled:opacity-50 ${
              active
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
