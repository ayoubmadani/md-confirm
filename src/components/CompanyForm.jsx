import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button, Field, Input, Select, Textarea } from './ui.jsx';

export function useWilayas() {
  const [wilayas, setWilayas] = useState([]);
  useEffect(() => {
    api.get('/shipping/wilayas').then(({ data }) => setWilayas(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);
  return wilayas;
}

/** نموذج بيانات الشركة — للإنشاء (Onboarding) والتعديل (صفحة الشركة) */
export default function CompanyForm({ initial, submitLabel, onSubmit }) {
  const wilayas = useWilayas();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    wilayaId: initial?.wilaya?.id ?? '',
    commissionPerDelivered: initial?.commissionPerDelivered ?? '',
    description: initial?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim(),
        wilayaId: form.wilayaId ? Number(form.wilayaId) : undefined,
        commissionPerDelivered: Number(form.commissionPerDelivered),
        description: form.description.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="اسم الشركة"><Input required maxLength={120} value={form.name} onChange={set('name')} /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="هاتف الشركة"><Input type="tel" dir="ltr" required value={form.phone} onChange={set('phone')} /></Field>
        <Field label="الولاية">
          <Select value={form.wilayaId} onChange={set('wilayaId')}>
            <option value="">—</option>
            {wilayas.map((w) => <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="عمولتك عن كل طلب مسلَّم (د.ج)" hint="يدفعها التاجر عند تسليم الطلب فقط. التعديل يطبَّق على الطلبات المرسلة بعده.">
        <Input type="number" min={0} step="1" required dir="ltr" value={form.commissionPerDelivered} onChange={set('commissionPerDelivered')} />
      </Field>
      <Field label="وصف الشركة" hint="يراه التاجر عند البحث: عدد الموظفين، أوقات العمل، الولايات التي تغطونها...">
        <Textarea maxLength={2000} value={form.description} onChange={set('description')} />
      </Field>
      <Button type="submit" loading={saving} className="w-full sm:w-auto">{submitLabel}</Button>
    </form>
  );
}
