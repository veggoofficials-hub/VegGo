import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import EmptyState from '../../../components/common/EmptyState';
import { ROUTES } from '../../../constants/routes.constants';
import { getApiErrorCode, getApiErrorMessage } from '../../../utils/apiError';
import AccountFilterPills from '../components/AccountFilterPills';
import AccountPagination from '../components/AccountPagination';
import {
  getDeletedAccounts,
  getDeletedAccountById,
} from '../services/accountModerationService';
import { ROLE_LABELS, formatDateOnly, formatDateTime } from '../utils/accountFlags';
import useDebouncedValue from '../utils/useDebouncedValue';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  RotateCcw,
  Search,
  UserX,
  X,
} from 'lucide-react';

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
  { id: 'ALL', label: 'All roles' },
  { id: 'CUSTOMER', label: 'Customers' },
  { id: 'VENDOR', label: 'Vendors' },
  { id: 'DELIVERY', label: 'Delivery' },
];

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'All statuses' },
  { id: 'IN_WINDOW', label: 'In window' },
  { id: 'REACTIVATED', label: 'Reactivated' },
  { id: 'PURGED', label: 'Purged' },
  { id: 'RETURNED_AS_NEW', label: 'Returned as new' },
];

const STATUS_META = {
  IN_WINDOW: {
    label: 'In window',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Clock,
    hint: 'Can still come back by logging in until the purge date.',
  },
  REACTIVATED: {
    label: 'Reactivated',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: CheckCircle2,
    hint: 'Came back inside the window (same account, same user id).',
  },
  PURGED: {
    label: 'Purged',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    Icon: UserX,
    hint: 'Window ended and the account was scrubbed.',
  },
  RETURNED_AS_NEW: {
    label: 'Returned as new',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    Icon: RotateCcw,
    hint: 'Window ended and the same phone + role now has a new account.',
  },
};

const ROLE_LIST_ROUTE = {
  CUSTOMER: ROUTES.CUSTOMERS,
  VENDOR: ROUTES.VENDORS,
  DELIVERY: ROUTES.DELIVERY,
};

const ORDERS_LABEL = {
  CUSTOMER: { count: 'orders placed', amount: 'total spent' },
  VENDOR: { count: 'orders accepted', amount: 'total order value' },
  DELIVERY: { count: 'deliveries completed', amount: null },
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const retentionText = (row) => {
  const days = Number(row?.requestedRetentionDays);
  if (!Number.isFinite(days)) return '-';
  if (days === 0) return 'No retention';
  return `${days} day${days === 1 ? '' : 's'}`;
};

function StatusBadge({ status, size = 11 }) {
  const meta = STATUS_META[status] || {
    label: status || 'Unknown',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    Icon: Clock,
  };
  const { Icon } = meta;

  return (
    <span
      title={meta.hint}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${meta.badge}`}
    >
      <Icon size={size} />
      {meta.label}
    </span>
  );
}

function ReturnedNote({ row }) {
  if (!row?.returned) return null;

  const listRoute = ROLE_LIST_ROUTE[row.role];
  const target = listRoute
    ? `${listRoute}?search=${encodeURIComponent(row.phone || '')}`
    : null;

  return (
    <div className="mt-1.5 text-[11px] font-medium text-sky-700 leading-snug">
      Came back on {formatDateOnly(row.returnedAt)} as a new account
      {target && (
        <>
          {' • '}
          <Link to={target} className="font-bold underline underline-offset-2 hover:text-sky-900">
            View new account
          </Link>
        </>
      )}
    </div>
  );
}

function OrdersCell({ row }) {
  const labels = ORDERS_LABEL[row.role] || ORDERS_LABEL.CUSTOMER;
  const amount = labels.amount ? formatMoney(row.totalAmount) : null;

  return (
    <div className="leading-tight">
      <span className="font-bold text-slate-900">{row.totalOrders ?? 0}</span>
      <span className="text-[11px] text-slate-500 font-medium"> {labels.count}</span>
      {amount && (
        <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
          {amount} {labels.amount}
        </span>
      )}
    </div>
  );
}

function DetailField({ label, children }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
        {label}
      </span>
      <div className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 break-words">
        {children || '-'}
      </div>
    </div>
  );
}

function DetailModal({ row, loading, error, onClose }) {
  const labels = ORDERS_LABEL[row?.role] || ORDERS_LABEL.CUSTOMER;
  const amount = labels.amount ? formatMoney(row?.totalAmount) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
              {row?.fullName || 'Deleted account'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {ROLE_LABELS[row?.role] || row?.role} • deleted {formatDateTime(row?.deletedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {loading && (
            <div className="py-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <RefreshCw size={14} className="animate-spin text-emerald-600" />
              Loading full record...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={row?.status} />
            {row?.previousDeletions > 1 && (
              <span className="text-[11px] font-bold text-slate-500">
                {row.previousDeletions} deletions for this phone + role
              </span>
            )}
          </div>

          <ReturnedNote row={row} />

          <p className="text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed">
            Phone, e-mail and name below are the real values captured at deletion
            (they are scrubbed from the live account). This record is read-only.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField label="Name">{row?.fullName}</DetailField>
            <DetailField label="Phone">
              <span className="font-mono">{row?.phone}</span>
            </DetailField>
            <DetailField label="E-mail">{row?.email}</DetailField>
            <DetailField label="Initiated by">{row?.initiatedBy}</DetailField>
            <DetailField label="Account created">{formatDateTime(row?.accountCreatedAt)}</DetailField>
            <DetailField label="Deleted at">{formatDateTime(row?.deletedAt)}</DetailField>
            <DetailField label="Retention requested">{retentionText(row)}</DetailField>
            <DetailField label="Scheduled purge">{formatDateTime(row?.scheduledPurgeAt)}</DetailField>
            {row?.reactivatedAt && (
              <DetailField label="Reactivated at">{formatDateTime(row.reactivatedAt)}</DetailField>
            )}
            {row?.purgedAt && (
              <DetailField label="Purged at">{formatDateTime(row.purgedAt)}</DetailField>
            )}
            <DetailField label={`Activity (${labels.count})`}>{String(row?.totalOrders ?? 0)}</DetailField>
            {amount && <DetailField label={labels.amount}>{amount}</DetailField>}
          </div>

          <DetailField label="Reason given">{row?.reason}</DetailField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-3 border-t border-slate-100">
            <DetailField label="Archive id">
              <span className="font-mono text-[11px] select-all">{row?.id}</span>
            </DetailField>
            <DetailField label="Old user id">
              <span className="font-mono text-[11px] select-all">{row?.userId}</span>
            </DetailField>
            {row?.returned && (
              <>
                <DetailField label="New user id">
                  <span className="font-mono text-[11px] select-all">{row?.newUserId}</span>
                </DetailField>
                <DetailField label="Returned at">{formatDateTime(row?.returnedAt)}</DetailField>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeletedAccounts() {
  const [searchParams] = useSearchParams();

  // Initial filters can come from the "Returning user" badge link:
  //   /accounts/deleted?search=<phone>&role=<ROLE>
  const [role, setRole] = useState(() => {
    const value = (searchParams.get('role') || '').toUpperCase();
    return ROLE_OPTIONS.some((o) => o.id === value) ? value : 'ALL';
  });
  const [status, setStatus] = useState(() => {
    const value = (searchParams.get('status') || '').toUpperCase();
    return STATUS_OPTIONS.some((o) => o.id === value) ? value : 'ALL';
  });
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const search = useDebouncedValue(searchInput.trim(), 400);

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [detail, setDetail] = useState(null); // { row, loading, error }

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const params = { page, size: PAGE_SIZE };
        if (role !== 'ALL') params.role = role;
        if (status !== 'ALL') params.status = status;
        if (search) params.search = search;

        const response = await getDeletedAccounts(params);
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
        console.error('Deleted accounts error:', err);
        setRows([]);
        setError(getApiErrorMessage(err, 'Unable to load deleted accounts.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [role, status, search, page, reloadKey]);

  const changeRole = (next) => {
    setRole(next);
    setPage(0);
  };
  const changeStatus = (next) => {
    setStatus(next);
    setPage(0);
  };
  const changeSearch = (value) => {
    setSearchInput(value);
    setPage(0);
  };

  const openDetail = async (row) => {
    setDetail({ row, loading: true, error: '' });
    try {
      const response = await getDeletedAccountById(row.id);
      const data = response?.data ?? response;
      setDetail({ row: { ...row, ...data }, loading: false, error: '' });
    } catch (err) {
      if (getApiErrorCode(err) === 'DELETED_ACCOUNT_NOT_FOUND') {
        // "Back to list"
        setDetail(null);
        setReloadKey((k) => k + 1);
        return;
      }
      // Fall back to the list row we already have.
      setDetail({
        row,
        loading: false,
        error: getApiErrorMessage(err, 'Could not load the full record. Showing list data.'),
      });
    }
  };

  const hasFilters = role !== 'ALL' || status !== 'ALL' || search;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        icon={UserX}
        title="Deleted Accounts"
        subtitle="Accounts their owners deleted themselves: who, when, why, and what became of them. Read-only."
        stats={[{ label: 'Records', value: totalElements }]}
        onRefresh={() => setReloadKey((k) => k + 1)}
        isRefreshing={loading}
      />

      <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <AccountFilterPills label="Role" options={ROLE_OPTIONS} value={role} onChange={changeRole} />
        <AccountFilterPills label="Status" options={STATUS_OPTIONS} value={status} onChange={changeStatus} />
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by phone, name or e-mail..."
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
          Loading deleted accounts...
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No deleted accounts found"
          description={
            hasFilters
              ? 'No records match the selected filters. Try clearing the search or filters.'
              : 'No one has deleted their account yet.'
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-2xs overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase font-bold tracking-wider text-slate-500 bg-slate-50/60">
                  <th className="py-3.5 px-5">Deleted at</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Name / Phone</th>
                  <th className="py-3.5 px-5">Reason</th>
                  <th className="py-3.5 px-5">Window</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Orders</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-xs font-semibold text-slate-800 hover:bg-emerald-50/40 align-top">
                    <td className="py-4 px-5 whitespace-nowrap text-slate-600 font-medium">
                      {formatDateTime(row.deletedAt)}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {ROLE_LABELS[row.role] || row.role}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-900 block">{row.fullName || '-'}</span>
                      <span className="font-mono text-[11px] text-slate-600 block mt-0.5">{row.phone || '-'}</span>
                      {row.email && (
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]" title={row.email}>
                          {row.email}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className="block max-w-[220px] text-slate-700 font-medium break-words">
                        {row.reason || <span className="text-slate-400">No reason given</span>}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-medium whitespace-nowrap">
                      <span className="block">{retentionText(row)}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        Purge {formatDateOnly(row.scheduledPurgeAt)}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={row.status} />
                      <ReturnedNote row={row} />
                    </td>
                    <td className="py-4 px-5">
                      <OrdersCell row={row} />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-xs font-bold cursor-pointer transition-all"
                      >
                        View
                      </button>
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
                  <StatusBadge status={row.status} size={10} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">{ROLE_LABELS[row.role] || row.role}</span>
                  <span>Deleted {formatDateOnly(row.deletedAt)}</span>
                  <span>{retentionText(row)}</span>
                </div>

                <p className="text-xs text-slate-700 font-medium break-words">
                  {row.reason || <span className="text-slate-400">No reason given</span>}
                </p>

                <ReturnedNote row={row} />

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <OrdersCell row={row} />
                  <button
                    type="button"
                    onClick={() => openDetail(row)}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer"
                  >
                    View
                  </button>
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

      {detail && (
        <DetailModal
          row={detail.row}
          loading={detail.loading}
          error={detail.error}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
