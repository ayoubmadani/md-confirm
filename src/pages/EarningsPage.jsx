import { useEffect, useState } from 'react';
import { Award, CalendarDays, Hourglass, Receipt, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { dateTime, money } from '../lib/format';
import { Card, Spinner } from '../components/ui.jsx';

const Stat = ({ icon: Icon, label, value, hint, cls }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4">
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${cls}`}><Icon size={16} /></span>{label}
    </div>
    <p className="text-2xl font-extrabold mt-2 tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
  </div>
);

/** أرباح الشركة — لمدير الشركة فقط */
export default function EarningsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/confirmation/earnings')
      .then(({ data: res }) => setData(res))
      .catch((err) => { toast.error(errorMessage(err)); setData(false); });
  }, []);

  if (data === null) return <Spinner />;
  if (!data) return <p className="text-center text-sm text-slate-400 py-16">تعذر تحميل الأرباح</p>;

  const rate = Math.round(data.platformRate * 100);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Wallet} cls="bg-emerald-50 text-emerald-600" label="رصيد المحفظة" value={money(data.walletBalance)}
          hint="محفظتك في منصة MD Store" />
        <Stat icon={Receipt} cls="bg-indigo-50 text-indigo-600" label="إجمالي الأرباح" value={money(data.earned)}
          hint={`${data.paidCount} طلبية مسلّمة`} />
        <Stat icon={CalendarDays} cls="bg-sky-50 text-sky-600" label="أرباح هذا الشهر" value={money(data.earnedThisMonth)}
          hint={`${data.paidThisMonth} طلبية مسلّمة`} />
        <Stat icon={Hourglass} cls="bg-amber-50 text-amber-600" label="أرباح منتظرة" value={money(data.pendingEarnings)}
          hint={`${data.pendingCount} مؤكدة لم تُسلَّم بعد`} />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        عن كل طلبية <b>مسلّمة</b> يدفع التاجر عمولتك، وتأخذ المنصة <b>{rate}%</b>، والباقي يُضاف إلى محفظتك تلقائياً.
        الطلبيات الملغاة أو المرتجعة ({data.returnedCount} مرتجعة) بدون عمولة.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="أداء الموظفين" icon={Award}>
          {data.agents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">لا يوجد نشاط بعد</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="text-start font-bold pb-2">الموظف</th>
                  <th className="font-bold pb-2">أكّد</th>
                  <th className="font-bold pb-2">سُلّم</th>
                  <th className="font-bold pb-2">ألغى</th>
                  <th className="font-bold pb-2">نسبة التسليم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.agents.map((a) => (
                  <tr key={a.id} className="text-center">
                    <td className="text-start py-2 font-bold">{a.username}</td>
                    <td className="tabular-nums">{a.confirmed}</td>
                    <td className="tabular-nums text-emerald-600 font-bold">{a.delivered}</td>
                    <td className="tabular-nums text-red-600">{a.cancelled}</td>
                    <td className="tabular-nums">{a.confirmed ? `${Math.round((a.delivered / a.confirmed) * 100)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="آخر الأرباح" icon={Receipt}>
          {data.recent.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">لم تُسلَّم أي طلبية بعد</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{r.customerName} <span className="ltr text-slate-400 font-normal">{r.customerPhone}</span></p>
                    <p className="text-xs text-slate-500">{r.store} · {dateTime(r.paidAt)}</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600 shrink-0">+{money(r.earning)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
