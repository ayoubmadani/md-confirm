import { useCallback, useEffect, useState } from 'react';
import { Building2, Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { dateTime } from '../lib/format';
import { Badge, Card } from '../components/ui.jsx';

const ACCESS = {
  requested: ['طلب جديد', 'bg-amber-100 text-amber-800'],
  granted: ['مفعّلة', 'bg-emerald-100 text-emerald-800'],
  revoked: ['مسحوبة', 'bg-red-100 text-red-800'],
};
const COMPANY = {
  pending: ['بانتظار الموافقة', 'bg-amber-100 text-amber-800'],
  approved: ['مفعّلة', 'bg-emerald-100 text-emerald-800'],
  suspended: ['موقوفة', 'bg-red-100 text-red-800'],
};

const Filter = ({ options, value, onChange }) => (
  <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
    {options.map(([key, label]) => (
      <button key={key} onClick={() => onChange(key)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${value === key ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>
        {label}
      </button>
    ))}
  </div>
);

/** شاشة الأدمن: صلاحيات المؤكّدين + الموافقة على شركات التأكيد */
export default function AdminPage() {
  const [accessFilter, setAccessFilter] = useState('requested');
  const [users, setUsers] = useState(null);
  const [companyFilter, setCompanyFilter] = useState('pending');
  const [companies, setCompanies] = useState(null);
  const [busy, setBusy] = useState(null);

  const loadUsers = useCallback(async () => {
    setUsers(null);
    try {
      const { data } = await api.get('/confirmation/admin/access', { params: { access: accessFilter || undefined } });
      setUsers(data);
    } catch (err) { toast.error(errorMessage(err)); setUsers([]); }
  }, [accessFilter]);

  const loadCompanies = useCallback(async () => {
    setCompanies(null);
    try {
      const { data } = await api.get('/confirmation/admin/companies', { params: { status: companyFilter || undefined } });
      setCompanies(data);
    } catch (err) { toast.error(errorMessage(err)); setCompanies([]); }
  }, [companyFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const setAccess = async (u, access) => {
    setBusy(u.id);
    try {
      await api.patch(`/confirmation/admin/access/${u.id}`, { access });
      toast.success(access === 'granted' ? `مُنحت الصلاحية لـ ${u.username}` : `سُحبت الصلاحية من ${u.username}`);
      loadUsers();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  };

  const setStatus = async (c, status) => {
    setBusy(c.id);
    try {
      await api.patch(`/confirmation/admin/companies/${c.id}/status`, { status });
      toast.success('تم');
      loadCompanies();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  };

  const ActionBtn = ({ onClick, ok, children, id }) => (
    <button onClick={onClick} disabled={busy === id}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
        ok ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
      {busy === id ? <Loader2 size={13} className="animate-spin" /> : ok ? <Check size={13} /> : <X size={13} />}{children}
    </button>
  );

  return (
    <div className="space-y-5">
      <Card title="صلاحيات مؤكّدي الطلبيات" icon={ShieldCheck}
        action={<Filter value={accessFilter} onChange={setAccessFilter}
          options={[['requested', 'طلبات'], ['granted', 'مفعّلة'], ['revoked', 'مسحوبة'], ['', 'الكل']]} />}>
        {users === null ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">لا يوجد</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => {
              const [label, cls] = ACCESS[u.access] ?? ['—', 'bg-slate-100'];
              return (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{u.username} <Badge className={cls}>{label}</Badge></p>
                    <p className="text-xs text-slate-500 ltr text-start truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                    {u.company && <p className="text-xs text-indigo-600">{u.company.role === 'owner' ? 'مدير' : 'موظف'} في {u.company.name}</p>}
                  </div>
                  <div className="flex gap-2">
                    {u.access !== 'granted' && <ActionBtn id={u.id} ok onClick={() => setAccess(u, 'granted')}>منح الصلاحية</ActionBtn>}
                    {u.access !== 'revoked' && <ActionBtn id={u.id} onClick={() => setAccess(u, 'revoked')}>{u.access === 'requested' ? 'رفض' : 'سحب'}</ActionBtn>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="شركات التأكيد" icon={Building2}
        action={<Filter value={companyFilter} onChange={setCompanyFilter}
          options={[['pending', 'بانتظار'], ['approved', 'مفعّلة'], ['suspended', 'موقوفة'], ['', 'الكل']]} />}>
        {companies === null ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : companies.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">لا يوجد</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {companies.map((c) => {
              const [label, cls] = COMPANY[c.status] ?? ['—', 'bg-slate-100'];
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{c.name} <Badge className={cls}>{label}</Badge></p>
                    <p className="text-xs text-slate-500">
                      {c.commissionPerDelivered} د.ج / طلب مسلَّم · <span className="ltr">{c.phone}</span>
                      {c.wilaya ? ` · ${c.wilaya.ar_name}` : ''} · {dateTime(c.createdAt)}
                    </p>
                    <p className="text-xs text-slate-400 ltr text-start">{c.owner?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {c.status !== 'approved' && <ActionBtn id={c.id} ok onClick={() => setStatus(c, 'approved')}>موافقة</ActionBtn>}
                    {c.status !== 'suspended' && <ActionBtn id={c.id} onClick={() => setStatus(c, 'suspended')}>إيقاف</ActionBtn>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
