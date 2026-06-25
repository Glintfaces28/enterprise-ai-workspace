import { useEffect, useState } from 'react';
import {
  FileText, Users, BarChart3, HardDrive,
  TrendingUp, Loader2,
} from 'lucide-react';
import api from '../api/client';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/documents/by-user'),
    ])
      .then(([s, u]) => {
        setSummary(s.data);
        setUserStats(u.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const maxCount = Math.max(...userStats.map((u) => u.document_count), 1);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Workspace usage and activity overview.</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={FileText}
          label="Total Documents"
          value={summary?.total_documents}
          color="bg-indigo-500"
        />
        <MetricCard
          icon={Users}
          label="Total Users"
          value={summary?.total_users}
          color="bg-emerald-500"
        />
        <MetricCard
          icon={BarChart3}
          label="Total Teams"
          value={summary?.total_teams}
          color="bg-amber-500"
        />
        <MetricCard
          icon={HardDrive}
          label="Storage Used"
          value={formatBytes(summary?.total_storage_bytes)}
          color="bg-rose-500"
        />
      </div>

      {/* Recent uploads highlight */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-center gap-3">
        <TrendingUp size={20} className="text-indigo-500 shrink-0" />
        <p className="text-indigo-800 text-sm">
          <span className="font-bold">{summary?.recent_uploads_7_days ?? 0}</span>
          {' '}document{summary?.recent_uploads_7_days !== 1 ? 's' : ''} uploaded in the last 7 days
        </p>
      </div>

      {/* Per-user table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Documents by user</h2>
        </div>
        {userStats.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No data yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {userStats.map((row, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                  {row.username?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="flex-1 text-sm text-gray-800 font-medium">{row.username}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(row.document_count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-6 text-right">
                    {row.document_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
