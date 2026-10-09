import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import { Badge, Card } from '../components/ui.jsx';
import CompanyForm from '../components/CompanyForm.jsx';

const STATUS = {
  pending: ['بانتظار الموافقة', 'bg-amber-100 text-amber-800'],
  approved: ['مفعّلة — تظهر للتجار', 'bg-emerald-100 text-emerald-800'],
  suspended: ['موقوفة', 'bg-red-100 text-red-800'],
};

export default function CompanyPage() {
  const { membership, refresh } = useAuth();
  const company = membership.company;
  const rate = membership.platformRate ?? 0.1;
  const [label, cls] = STATUS[company.status] ?? STATUS.pending;
  const net = Math.round(Number(company.commissionPerDelivered) * (1 - rate));

  const save = async (payload) => {
    try {
      await api.patch('/confirmation/company', payload);
      toast.success('تم الحفظ');
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card title="الشركة" icon={Building2} action={<Badge className={cls}>{label}</Badge>}>
        <p className="text-sm text-slate-600 mb-4">
          عن كل طلب مسلَّم: يدفع التاجر <b>{company.commissionPerDelivered} د.ج</b>، تأخذ المنصة <b>{Math.round(rate * 100)}%</b>،
          ويصل إلى محفظتك <b>{net} د.ج</b>.
        </p>
        <CompanyForm initial={company} submitLabel="حفظ" onSubmit={save} />
      </Card>
    </div>
  );
}
