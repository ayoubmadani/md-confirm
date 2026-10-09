import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Phone, PhoneForwarded, RefreshCw, Search, Store, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { money, STATUS, timeAgo } from '../lib/format';
import { Badge, Button } from '../components/ui.jsx';

const TABS = [
  ['new', 'جديدة'],
  ['attempts', 'محاولات'],
  ['postponed', 'مؤجلة'],
  ['confirmed', 'مؤكدة'],
  ['cancelled', 'ملغاة'],
  ['all', 'الكل'],
];
const QUEUE = ['pending', 'appl1', 'appl2', 'appl3', 'postponed'];

const readyLabel = (sec) => {
  if (sec == null) return null;
  if (sec < 3600) return `بعد ${Math.ceil(sec / 60)} دقيقة`;
  if (sec < 86400) return `بعد ${Math.round(sec / 3600)} ساعة`;
  return `بعد ${Math.round(sec / 86400)} يوم`;
};

export default function QueuePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'new';
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [nexting, setNexting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/confirmation/orders', { params: { tab, search: query || undefined, page } });
      setData(res);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, query, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(load, 10000); // كل 10 ثوانٍ: طلبات جديدة، وما يعمل عليه الزملاء الآن
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const setTab = (key) => { setParams({ tab: key }); setPage(1); };

  /** فتح الطلب فقط — البدء في تأكيده يكون بزر "أنا أؤكد الطلبية" داخله */
  const open = (o) => navigate(`/orders/${o.id}`);

  const next = async () => {
    setNexting(true);
    try {
      const { data: order } = await api.post('/confirmation/queue/next');
      if (order?.id) navigate(`/orders/${order.id}`);
      else toast.info('لا توجد طلبات جاهزة الآن');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setNexting(false);
    }
  };

  const counts = data?.counts ?? {};

  return (
    <div className="space-y-4">
      {/* ── الأعلى: الطلب التالي + البحث ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="sm:w-auto py-3" loading={nexting} onClick={next}>
          <PhoneForwarded size={18} />الطلب التالي
        </Button>
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..."
            className="w-full ps-10 pe-3 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500" />
        </div>
        <button onClick={load} className="hidden sm:flex items-center justify-center w-12 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── التبويبات ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors ${
              tab === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {label}
            {counts[key] != null && (
              <span className={`px-1.5 rounded-md text-[11px] tabular-nums ${tab === key ? 'bg-white/20' : 'bg-slate-100'}`}>{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── القائمة ── */}
      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : data.orders.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-16">لا توجد طلبات هنا</p>
      ) : (
        <div className="space-y-2">
          {data.orders.map((o) => {
            // طلب بيد زميل الآن: حالته المعروضة "قيد التأكيد" بدل حالته العادية
            const inProgress = !!o.lockedBy && QUEUE.includes(o.status);
            const mine = o.lockedByMe && QUEUE.includes(o.status);
            const st = mine
              ? { label: 'قيد التأكيد — أنت', cls: 'bg-indigo-600 text-white' }
              : inProgress
                ? { label: `قيد التأكيد — ${o.lockedBy.username ?? 'زميل'}`, cls: 'bg-orange-100 text-orange-800' }
                : STATUS[o.status] ?? STATUS.pending;
            const scheduled = readyLabel(o.readyIn);
            const first = o.products[0];
            return (
              <button key={o.id} onClick={() => open(o)} disabled={busyId === o.id}
                className={`w-full text-start rounded-2xl border p-4 transition-colors hover:border-indigo-300 disabled:opacity-60 ${
                  o.lockedByMe ? 'bg-white border-indigo-400 ring-2 ring-indigo-100'
                    : inProgress ? 'bg-orange-50/40 border-orange-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-1.5 font-extrabold truncate"><UserRound size={15} className="text-slate-400 shrink-0" />{o.customerName}</p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-600"><Phone size={13} className="text-slate-400" /><span className="ltr">{o.customerPhone}</span></p>
                    {(o.wilaya || o.commune) && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} className="text-slate-400" />{[o.wilaya, o.commune].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {busyId === o.id ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Badge className={st.cls}>{st.label}</Badge>}
                    <span className="text-sm font-extrabold text-emerald-600">{money(o.total)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 truncate max-w-full">
                    {first ? `${first.quantity}× ${first.name}` : '—'}
                    {o.products.length > 1 && <span className="text-indigo-600 font-bold"> +{o.products.length - 1}</span>}
                  </span>
                  <span className="flex items-center gap-3 text-slate-400">
                    {o.store && <span className="flex items-center gap-1"><Store size={12} />{o.store}</span>}
                    <span>{timeAgo(o.createdAt)}</span>
                  </span>
                </div>

                {scheduled && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUEUE.includes(o.status) && !inProgress && !mine && <Badge className="bg-amber-50 text-amber-700"><Clock size={11} />يُعاد الاتصال {scheduled}</Badge>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── الصفحات ── */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronRight size={16} /></button>
          <span className="text-sm font-bold tabular-nums">{page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft size={16} /></button>
        </div>
      )}
    </div>
  );
}
