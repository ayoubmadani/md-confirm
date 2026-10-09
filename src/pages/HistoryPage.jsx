import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { ACTION_LABEL, STATUS, dateTime } from '../lib/format';
import { Badge, Card, Spinner } from '../components/ui.jsx';

export default function HistoryPage() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    api.get('/confirmation/history')
      .then(({ data }) => setLogs(data))
      .catch((err) => { toast.error(errorMessage(err)); setLogs([]); });
  }, []);

  if (!logs) return <Spinner />;

  // ملخص اليوم: كم أكّد/ألغى/أجّل هذا الموظف اليوم
  const today = new Date().toDateString();
  const todayStatus = logs.filter((l) => l.action === 'status' && new Date(l.createdAt).toDateString() === today);
  const count = (s) => todayStatus.filter((l) => l.toStatus === s).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[['confirmed', 'أكّدت اليوم', 'text-emerald-600'], ['cancelled', 'ألغيت اليوم', 'text-red-600'],
          ['postponed', 'أجّلت اليوم', 'text-purple-600']].map(([s, label, cls]) => (
          <div key={s} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className={`text-2xl font-extrabold ${cls}`}>{count(s)}</p>
            <p className="text-xs text-slate-500 font-bold">{label}</p>
          </div>
        ))}
      </div>

      <Card title="آخر ما قمت به" icon={History}>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">لا يوجد نشاط بعد</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((l) => (
              <li key={l.id}>
                <Link to={`/orders/${l.orderId}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{l.order?.customerName ?? '—'} <span className="ltr text-slate-400 font-normal">{l.order?.customerPhone}</span></p>
                    <p className="text-xs text-slate-500">
                      {ACTION_LABEL[l.action] ?? l.action}
                      {l.toStatus && <> → {STATUS[l.toStatus]?.label ?? l.toStatus}</>}
                      {' · '}{dateTime(l.createdAt)}
                    </p>
                  </div>
                  {l.order?.status && <Badge className={STATUS[l.order.status]?.cls}>{STATUS[l.order.status]?.label}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
