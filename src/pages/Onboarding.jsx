import { useState } from 'react';
import { Building2, LogOut, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import { Button, Card } from '../components/ui.jsx';
import CompanyForm from '../components/CompanyForm.jsx';

/** مستخدم بلا شركة: ينشئ شركته (يصبح مديرها) أو ينتظر أن يضيفه مدير شركته */
export default function Onboarding() {
  const { refresh, logout } = useAuth();
  const [mode, setMode] = useState(null);

  const create = async (payload) => {
    try {
      await api.post('/confirmation/companies', payload);
      toast.success('تم إنشاء الشركة — بانتظار موافقة إدارة المنصة');
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-xl mx-auto space-y-5 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold">مرحباً بك في MD Confirm</h1>
          <button onClick={logout} className="flex items-center gap-1 text-sm font-bold text-slate-500"><LogOut size={16} />خروج</button>
        </div>

        {!mode && (
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => setMode('create')} className="text-start p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 space-y-2">
              <Building2 className="text-indigo-600" />
              <p className="font-extrabold">أنشئ شركة تأكيد</p>
              <p className="text-xs text-slate-500">لمدير شركة أو لمؤكّد يعمل وحده. تظهر للتجار بعد موافقة الإدارة.</p>
            </button>
            <button onClick={() => setMode('join')} className="text-start p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 space-y-2">
              <UserPlus className="text-indigo-600" />
              <p className="font-extrabold">أنا موظف في شركة</p>
              <p className="text-xs text-slate-500">مدير شركتك يضيفك من صفحة الفريق.</p>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <Card title="بيانات شركة التأكيد" icon={Building2}>
            <CompanyForm submitLabel="إنشاء الشركة" onSubmit={create} />
          </Card>
        )}

        {mode === 'join' && (
          <Card title="الانضمام إلى شركة" icon={UserPlus}>
            <p className="text-sm text-slate-600 leading-relaxed">
              أعطِ مدير شركتك <b>البريد الإلكتروني</b> الذي سجّلت به هذا الحساب، ليضيفك من صفحة <b>الفريق</b> في تطبيقه.
              بعدها اضغط الزر في الأسفل.
            </p>
            <Button variant="outline" className="mt-4" onClick={refresh}>تحقّق مرة أخرى</Button>
          </Card>
        )}

        {mode && <button onClick={() => setMode(null)} className="text-sm font-bold text-indigo-600">رجوع</button>}
      </div>
    </div>
  );
}
