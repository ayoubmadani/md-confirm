import { useState } from 'react';
import { Clock, LogOut, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import { Button } from '../components/ui.jsx';

/** حساب بدون صلاحية مؤكّد: يطلبها، ثم ينتظر موافقة الأدمن */
export default function AccessGate() {
  const { membership, refresh, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const access = membership?.access ?? 'none';

  const request = async () => {
    setSending(true);
    try {
      await api.post('/confirmation/access/request');
      toast.success('أُرسل طلبك إلى الإدارة');
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const content = {
    none: {
      icon: ShieldAlert, cls: 'text-indigo-600 bg-indigo-50',
      title: 'تحتاج صلاحية مؤكّد طلبيات',
      text: 'العمل في تطبيق التأكيد يتطلب موافقة إدارة المنصة. اطلب الصلاحية، وستصلك الموافقة على هذا الحساب نفسه.',
    },
    requested: {
      icon: Clock, cls: 'text-amber-600 bg-amber-50',
      title: 'طلبك قيد المراجعة',
      text: 'أرسلنا طلبك إلى الإدارة. عند الموافقة اضغط "تحقّق مرة أخرى" أو أعد فتح التطبيق.',
    },
    revoked: {
      icon: ShieldX, cls: 'text-red-600 bg-red-50',
      title: 'تم سحب صلاحيتك',
      text: 'سحبت الإدارة صلاحية مؤكّد الطلبيات من هذا الحساب. يمكنك طلبها من جديد.',
    },
  }[access] ?? null;

  const Icon = content?.icon ?? ShieldCheck;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4">
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${content?.cls}`}><Icon size={26} /></div>
        <h1 className="text-lg font-extrabold">{content?.title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{content?.text}</p>
        <div className="flex flex-col gap-2">
          {access !== 'requested' && <Button loading={sending} onClick={request}>طلب صلاحية مؤكّد</Button>}
          <Button variant="outline" onClick={refresh}>تحقّق مرة أخرى</Button>
          <button onClick={logout} className="flex items-center justify-center gap-1 text-sm font-bold text-slate-500 mt-2"><LogOut size={15} />خروج</button>
        </div>
      </div>
    </div>
  );
}
