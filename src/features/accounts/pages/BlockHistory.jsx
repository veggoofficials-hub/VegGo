import { useEffect, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import EmptyState from '../../../components/common/EmptyState';
import { getApiErrorMessage } from '../../../utils/apiError';
import AccountFilterPills from '../components/AccountFilterPills';
import AccountPagination from '../components/AccountPagination';
import { getBlockHistory } from '../services/accountModerationService';
import { ROLE_LABELS, formatDateTime } from '../utils/accountFlags';
import useDebouncedValue from '../utils/useDebouncedValue';
import {
  AlertCircle,
  History as HistoryIcon,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
  { id: 'ALL', label: 'All roles' },
  { id: 'CUSTOMER', label: 'Customers' },
  { id: 'VENDOR', label: 'Vendors' },
  { id: 'DELIVERY', label: 'Delivery' },
];

const ACTION_OPTIONS = [
  { id: 'ALL', label: 'All actions' },
  { id: 'BLOCK', label: 'Blocks' },
  { id: 'UNBLOCK', label: 'Unblocks' },
];

function ActionBadge({ action }) {
  const isBlock = action === 'BLOCK';
  const Icon = isBlock ? ShieldAlert : ShieldCheck;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
        isBlock
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
    >
      <Icon size={11} />
      {isBlock ? 'Blocked' : 'Unblocked'}
    </span>
  );
}

// For an UNBLOCK row, `reason` holds the admin's note (guide §6.3).
function ReasonText({ row }) {
  const text = row.reason;
  const label = row.action === 'UNBLOCK' ? 'Note' : 'Reason';

  if (!text) {
    return <span className="text-slate-400">No {label.toLowerCase()} recorded</span>;
  }

  return (
    <>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{label}</span>
      <span className="text-slate-700 font-medium break-words">{text}</span>
    </>
  );
}

function PayoutsHeld({ row }) {
  if (row.action !== 'BLOCK' || !row.payoutsHeld) return null;

  return (
    <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
      <Wallet size={10} />
      Payouts held
    </span>
  );
}

export default function BlockHistory() {
  const [role, setRole] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [currentOnly, setCurrentOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), 400);

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const params = { page, size: PAGE_SIZE };
        if (role !== 'ALL') params.role = role;
        if (action !== 'ALL') params.action = action;
        if (currentOnly) params.currentOnly = true;
        if (search) params.search = search;

        const response = await getBlockHistory(params);
        if (cancelled) return;

        const payload = response?.data ?? response;
        const content = Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload)
            ? payload
            : [];

        setRows(content);
        setTotalPages(payload?.totalPages || 1);
        setTotalElements(payload?.totalElements ?? content.length);
      } catch (err) {
        if (cancelled) return;
        console.error('Block history error:', err);
        setRows([]);
        setError(getApiErrorMessage(err, 'Unable to load block history.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [role, action, currentOnly, search, page, reloadKey]);

  const changeRole = (next) => {
    setRole(next);
    setPage(0);
  };
  const changeAction = (next) => {
    setAction(next);
    setPage(0);
  };
  const toggleCurrentOnly = () => {
    setCurrentOnly((prev) => !prev);
    setPage(0);
  };
  const changeSearch = (value) => {
    setSearchInput(value);
    setPage(0);
  };

  const hasFilters = role !== 'ALL' || action !== 'ALL' || currentOnly || search;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        icon={HistoryIcon}
        title="Block History"
        subtitle="Every block and unblock across customers, vendors and delivery partners. Rows are never deleted."
        stats={[{ label: 'Events', value: totalElements }]}
        onRefresh={() => setReloadKey((k) => k + 1)}
        isRefreshing={loading}
      />

      <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <AccountFilterPills label="Role" options={ROLE_OPTIONS} value={role} onChange={changeRole} />
        <AccountFilterPills label="Action" options={ACTION_OPTIONS} value={action} onChange={changeAction} />
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={currentOnly}
            onChange={toggleCurrentOnly}
            className="h-4 w-4 accent-emerald-600"
          />
          Only blocks still in force
        </label>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by phone, name or reason..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 flex flex-col items-center gap-3 text-xs font-semibold text-slate-500">
          <RefreshCw size={22} className="animate-spin text-emerald-600" />
          Loading block history...
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No block events found"
          description={
            hasFilters
              ? 'No events match the selected filters. Try clearing the search or filters.'
              : 'No account has been blocked or unblocked yet.'
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-2xs overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50/60">
                  <th className="py-3.5 px-5">When</th>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Name / Phone</th>
                  <th className="py-3.5 px-5">Reason / Note</th>
                  <th className="py-3.5 px-5">By admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-xs font-semibold text-slate-800 hover:bg-emerald-50/40 align-top">
                    <td className="py-4 px-5 whitespace-nowrap text-slate-600 font-medium">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="py-4 px-5">
                      <ActionBadge action={row.action} />
                      <div><PayoutsHeld row={row} /></div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {ROLE_LABELS[row.role] || row.role}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-900 block">{row.fullName || '-'}</span>
                      <span className="font-mono text-[11px] text-slate-600 block mt-0.5">{row.phone || '-'}</span>
                    </td>
                    <td className="py-4 px-5 max-w-[320px]">
                      <ReasonText row={row} />
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-medium">
                      <span className="block truncate max-w-[200px]" title={row.adminLabel}>
                        {row.adminLabel || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="lg:hidden p-4 space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{row.fullName || '-'}</h4>
                    <p className="font-mono text-[11px] text-slate-600">{row.phone || '-'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ActionBadge action={row.action} />
                    <PayoutsHeld row={row} />
                  </div>
                </div>

                <div className="text-xs">
                  <ReasonText row={row} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">{ROLE_LABELS[row.role] || row.role}</span>
                  <span>{formatDateTime(row.createdAt)}</span>
                  <span className="truncate max-w-[180px]">{row.adminLabel || '-'}</span>
                </div>
              </div>
            ))}
          </div>

          <AccountPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            loading={loading}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
