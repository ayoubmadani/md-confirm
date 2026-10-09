export const money = (n) => `${new Intl.NumberFormat('fr-DZ').format(Math.round(Number(n || 0)))} د.ج`;

export const dateTime = (d) => (d
  ? new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  : '');

export const timeAgo = (d) => {
  if (!d) return '';
  const sec = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(sec) >= size) return rtf.format(Math.trunc(sec / size), unit);
  }
  return 'الآن';
};

export const STATUS = {
  pending: { label: 'قيد الانتظار', cls: 'bg-amber-100 text-amber-800' },
  appl1: { label: 'محاولة 1', cls: 'bg-violet-100 text-violet-800' },
  appl2: { label: 'محاولة 2', cls: 'bg-indigo-100 text-indigo-800' },
  appl3: { label: 'محاولة 3', cls: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'مؤكد', cls: 'bg-emerald-100 text-emerald-800' },
  shipping: { label: 'قيد الشحن', cls: 'bg-cyan-100 text-cyan-800' },
  delivered: { label: 'مسلّم', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'ملغى', cls: 'bg-red-100 text-red-800' },
  returned: { label: 'مرتجع', cls: 'bg-orange-100 text-orange-800' },
  postponed: { label: 'مؤجل', cls: 'bg-purple-100 text-purple-800' },
};

export const ACTION_LABEL = {
  sent: 'أرسله التاجر',
  recalled: 'سحبه التاجر',
  claimed: 'أخذه من القائمة',
  edited: 'عدّل الطلب',
  status: 'غيّر الحالة',
  released: 'أعاده للقائمة',
  uploaded: 'رُفع لشركة التوصيل',
  upload_failed: 'فشل الرفع لشركة التوصيل',
  paid: 'دُفعت العمولة',
};
