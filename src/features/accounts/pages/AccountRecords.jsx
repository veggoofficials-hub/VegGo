import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../layouts/Sidebar';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import { ROUTES } from '../../../constants/routes.constants';
import { UserX, History as HistoryIcon } from 'lucide-react';

const DeletedAccounts = lazy(() => import('./DeletedAccounts'));
const BlockHistory = lazy(() => import('./BlockHistory'));

const TAB_ROUTES = {
  deleted: ROUTES.DELETED_ACCOUNTS,
  blocks: ROUTES.BLOCK_HISTORY,
};

const accountTabs = [
  { id: 'deleted', label: 'Deleted Accounts', icon: UserX },
  { id: 'blocks', label: 'Block History', icon: HistoryIcon },
];

const Loading = ({ label }) => (
  <div className="py-16 text-center text-slate-400 font-semibold text-xs">{label}</div>
);

export default function AccountRecords({ defaultTab = 'deleted' }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#f6f9f7] flex flex-col lg:flex-row font-sans antialiased text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-20 sm:pt-22 lg:pt-22 overflow-y-auto max-h-dvh w-full space-y-5 sm:space-y-6">
        <div className="bg-white p-2 rounded-2xl border border-emerald-100/80 shadow-2xs">
          <SegmentedTabs
            tabs={accountTabs}
            activeTab={defaultTab}
            onTabChange={(tabId) => navigate(TAB_ROUTES[tabId] || ROUTES.DELETED_ACCOUNTS)}
          />
        </div>

        {defaultTab === 'deleted' && (
          <Suspense fallback={<Loading label="Loading deleted accounts..." />}>
            <DeletedAccounts />
          </Suspense>
        )}
        {defaultTab === 'blocks' && (
          <Suspense fallback={<Loading label="Loading block history..." />}>
            <BlockHistory />
          </Suspense>
        )}
      </main>
    </div>
  );
}
