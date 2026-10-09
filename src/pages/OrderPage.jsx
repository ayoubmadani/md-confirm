import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, Ban, CalendarClock, CheckCircle2, Clock, History, MapPin, MessageCircle, Minus, Package, Phone,
  PhoneCall, PhoneMissed, Plus, Save, Store, Truck, Undo2, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { ACTION_LABEL, dateTime, money, STATUS, timeAgo } from '../lib/format';
import { attrKey, attributeGroups, findVariant } from '../lib/variants';
import { Badge, Button, Card, Field, Input, Select, Spinner, Textarea } from '../components/ui.jsx';
import { useWilayas } from '../components/CompanyForm.jsx';

const NEXT_ATTEMPT = { pending: 'appl1', appl1: 'appl2', appl2: 'appl3', postponed: 'appl1' };

const toDraft = (o) => ({
  customerName: o.customer.name,
  customerPhone: o.customer.phone,
  customerWilayaId: o.customer.wilaya?.id ?? '',
  customerCommuneId: o.customer.commune?.id ?? '',
  typeShip: o.typeShip,
  items: o.items.map((i) => ({
    productId: i.productId, quantity: i.quantity, offerId: i.offerId ?? '', variantDetailId: i.variantDetailId ?? '',
  })),
});

// رقم جزائري 0XXXXXXXXX → 213XXXXXXXXX لرابط واتساب
const waNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `213${digits.slice(1)}` : digits;
};

function useCountdown(initial) {
  const [left, setLeft] = useState(initial);
  useEffect(() => { setLeft(initial); }, [initial]);
  useEffect(() => {
    if (left <= 0) return undefined;
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [left > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  return left;
}

export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wilayas = useWilayas();
  const [order, setOrder] = useState(null);
  const [draft, setDraft] = useState(null);
  const [communes, setCommunes] = useState([]);
  const [busy, setBusy] = useState(null); // 'save' | status name
  const [dialog, setDialog] = useState(null); // 'postpone' | 'cancel'
  const [postponeAt, setPostponeAt] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/confirmation/orders/${id}`);
      setOrder(data);
      setDraft(toDraft(data));
    } catch (err) {
      toast.error(errorMessage(err));
      navigate('/', { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  // طلب بيد زميل: نحدّث كل 10 ثوانٍ لنعرف متى ينتهي (أو تتغير حالته)
  const lockedByOther = !!order?.lock?.lockedBy;
  useEffect(() => {
    if (!lockedByOther) return undefined;
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [lockedByOther, load]);

  useEffect(() => {
    if (!draft?.customerWilayaId) { setCommunes([]); return; }
    api.get(`/shipping/get-communes/${draft.customerWilayaId}`)
      .then(({ data }) => setCommunes(Array.isArray(data) ? data : []))
      .catch(() => setCommunes([]));
  }, [draft?.customerWilayaId]);

  const secondsLeft = useCountdown(order?.lock?.secondsLeft ?? 0);
  const dirty = useMemo(() => order && draft && JSON.stringify(draft) !== JSON.stringify(toDraft(order)), [order, draft]);

  if (!order || !draft) return <Spinner />;

  const editable = order.lock.lockedByMe && secondsLeft > 0;
  const status = STATUS[order.status] ?? STATUS.pending;
  const productOf = (pid) => order.products.find((p) => p.id === pid);
  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setItem = (idx, patch) => setDraft((d) => ({ ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  const saveEdits = async () => {
    const payload = {
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      typeShip: draft.typeShip,
      items: draft.items.map((it) => ({
        productId: it.productId, quantity: Number(it.quantity) || 1,
        offerId: it.offerId || undefined, variantDetailId: it.variantDetailId || undefined,
      })),
    };
    if (!order.isDigital) {
      payload.customerWilayaId = draft.customerWilayaId ? Number(draft.customerWilayaId) : undefined;
      payload.customerCommuneId = draft.customerCommuneId ? Number(draft.customerCommuneId) : undefined;
    }
    const { data } = await api.patch(`/confirmation/orders/${id}`, payload);
    setOrder(data);
    setDraft(toDraft(data));
    return data;
  };

  const onSave = async () => {
    setBusy('save');
    try { await saveEdits(); toast.success('تم حفظ التعديلات'); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  };

  /** يحفظ التعديلات أولاً إن وُجدت، ثم يغيّر الحالة، ثم ينتقل للطلب التالي مباشرة */
  const setStatus = async (newStatus, extra = {}) => {
    if (!order.isDigital && newStatus === 'confirmed' && (!draft.customerWilayaId || !draft.customerCommuneId)) {
      toast.error('اختر الولاية والبلدية قبل التأكيد');
      return;
    }
    setBusy(newStatus);
    try {
      if (dirty) await saveEdits();
      const { data } = await api.post(`/confirmation/orders/${id}/status`, { status: newStatus, ...extra });
      if (newStatus === 'confirmed') {
        if (data.upload?.uploaded) toast.success(`تم التأكيد ورُفع لشركة التوصيل${data.upload.tracking ? ` — ${data.upload.tracking}` : ''}`);
        else if (data.upload) toast.warning(`تم التأكيد، لكن الرفع لشركة التوصيل فشل: ${data.upload.error}`);
        else toast.success('تم التأكيد');
      } else {
        toast.success(`تم: ${STATUS[newStatus]?.label ?? newStatus}`);
      }
      setDialog(null);
      navigate(-1);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const claim = async () => {
    setBusy('claim');
    try {
      const { data } = await api.post(`/confirmation/orders/${id}/claim`);
      setOrder(data);
      setDraft(toDraft(data));
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  };

  /** "إلغاء تأكيد الطلبية": يتركها للزملاء ويبقى في الصفحة للعرض */
  const release = async () => {
    if (dirty && !window.confirm('لديك تعديلات غير محفوظة ستضيع. متابعة؟')) return;
    setBusy('release');
    try {
      await api.post(`/confirmation/orders/${id}/release`);
      toast.success('تركت الطلبية — صارت متاحة لزملائك');
      await load();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
  };

  const lockedBy = order.lock.lockedBy; // زميل يعمل على الطلب الآن
  const canClaim = !order.lock.lockedByMe && !lockedBy && ['pending', 'appl1', 'appl2', 'appl3', 'postponed'].includes(order.status);

  const nextAttempt = NEXT_ATTEMPT[order.status];
  const ch = order.customerHistory;

  return (
    <div className="space-y-4 pb-28">
      {/* ── الرأس ── */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-slate-500">
          <ArrowRight size={16} />الطلبات
        </button>
        <div className="flex items-center gap-2">
          {editable
            ? <Badge className="bg-indigo-600 text-white">قيد التأكيد — أنت</Badge>
            : <Badge className={status.cls}>{status.label}</Badge>}
          {order.lock.lockedByMe && (
            <Badge className={secondsLeft > 120 ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}>
              <Clock size={12} />
              <span className="ltr tabular-nums">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</span>
            </Badge>
          )}
        </div>
      </div>

      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-bold">
          <span className="flex items-center gap-2">
            <PhoneCall size={16} className="shrink-0" />
            أنت تؤكد هذه الطلبية الآن — زملاؤك يرونها "قيد التأكيد".
          </span>
          <Button variant="outline" loading={busy === 'release'} onClick={release}>
            <Undo2 size={16} />إلغاء تأكيد الطلبية
          </Button>
        </div>
      )}

      {lockedBy && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm font-bold">
          <Clock size={16} className="shrink-0" />
          هذا الطلب قيد التأكيد من طرف {lockedBy.username ?? 'زميل'} — لا تتصل بالزبون حتى ينتهي.
        </div>
      )}

      {!editable && !lockedBy && (canClaim || (order.lock.lockedByMe && secondsLeft <= 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
          <span>{order.lock.lockedByMe ? 'انتهى وقت تأكيدك لهذه الطلبية.' : 'هذه الطلبية متاحة — اضغط لتبدأ تأكيدها.'}</span>
          <Button variant="success" className="py-3 px-6" loading={busy === 'claim'} onClick={claim}>
            <PhoneCall size={18} />أنا أؤكد الطلبية
          </Button>
        </div>
      )}

      {!editable && !lockedBy && !canClaim && !(order.lock.lockedByMe && secondsLeft <= 0) && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold">هذه الطلبية للعرض فقط.</div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* ── الزبون ── */}
          <Card title="الزبون" icon={UserRound}
            action={<span className="flex items-center gap-1 text-xs text-slate-500"><Store size={13} />{order.store.name}</span>}>
            <div className="flex flex-wrap gap-2 mb-4">
              <a href={`tel:${order.customer.phone}`}
                className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-lg">
                <Phone size={20} /><span className="ltr">{order.customer.phone}</span>
              </a>
              <a href={`https://wa.me/${waNumber(order.customer.whatsapp || order.customer.phone)}`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-50 text-green-700 font-bold border border-green-200">
                <MessageCircle size={18} />واتساب
              </a>
            </div>

            {ch.total > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                <span className="text-slate-500 font-bold">طلباته السابقة ({ch.total}):</span>
                <Badge className="bg-green-100 text-green-800">مسلّم {ch.delivered}</Badge>
                <Badge className={ch.returned ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}>مرتجع {ch.returned}</Badge>
                <Badge className="bg-red-50 text-red-700">ملغى {ch.cancelled}</Badge>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="الاسم"><Input disabled={!editable} value={draft.customerName} onChange={(e) => setField('customerName', e.target.value)} /></Field>
              <Field label="الهاتف"><Input disabled={!editable} dir="ltr" value={draft.customerPhone} onChange={(e) => setField('customerPhone', e.target.value)} /></Field>
            </div>
          </Card>

          {/* ── العنوان ── */}
          {!order.isDigital && (
            <Card title="العنوان والتوصيل" icon={MapPin}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="الولاية">
                  <Select disabled={!editable} value={draft.customerWilayaId}
                    onChange={(e) => setDraft((d) => ({ ...d, customerWilayaId: e.target.value, customerCommuneId: '' }))}>
                    <option value="">اختر الولاية</option>
                    {wilayas.map((w) => <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>)}
                  </Select>
                </Field>
                <Field label="البلدية">
                  <Select disabled={!editable || !communes.length} value={draft.customerCommuneId}
                    onChange={(e) => setField('customerCommuneId', e.target.value)}>
                    <option value="">اختر البلدية</option>
                    {communes.map((c) => <option key={c.id} value={c.id}>{c.ar_name}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[['home', 'للمنزل'], ['office', 'للمكتب']].map(([k, label]) => (
                  <button key={k} disabled={!editable} onClick={() => setField('typeShip', k)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-bold ${draft.typeShip === k ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ── المنتجات ── */}
          <Card title="المنتجات" icon={Package}>
            <div className="space-y-4">
              {draft.items.map((it, idx) => {
                const product = productOf(it.productId);
                const serverItem = order.items[idx];
                const variants = product?.variants ?? [];
                const groups = attributeGroups(variants);
                const current = variants.find((v) => v.id === it.variantDetailId);
                const currentAttrs = current?.name ?? serverItem?.variant ?? [];
                return (
                  <div key={idx} className="rounded-xl border border-slate-200 p-3 space-y-3">
                    <div className="flex gap-3">
                      {product?.image && <img src={product.image} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm line-clamp-2">{product?.name ?? serverItem?.productName}</p>
                        {serverItem && <p className="text-xs text-slate-500 mt-1">{money(serverItem.totalPrice)}</p>}
                      </div>
                      <div className="flex items-center gap-1 self-start">
                        <button disabled={!editable || it.quantity <= 1} onClick={() => setItem(idx, { quantity: Number(it.quantity) - 1 })}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"><Minus size={14} /></button>
                        <span className="w-8 text-center font-extrabold tabular-nums">{it.quantity}</span>
                        <button disabled={!editable} onClick={() => setItem(idx, { quantity: Number(it.quantity) + 1 })}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"><Plus size={14} /></button>
                      </div>
                    </div>

                    {product?.offers?.length > 0 && (
                      <Field label="العرض">
                        <Select disabled={!editable} value={it.offerId} onChange={(e) => setItem(idx, { offerId: e.target.value })}>
                          <option value="">بدون عرض</option>
                          {product.offers.map((o) => <option key={o.id} value={o.id}>{o.name} — {money(o.price)}</option>)}
                        </Select>
                      </Field>
                    )}

                    {groups.map((g) => {
                      const selected = currentAttrs.find((a) => attrKey(a) === g.key)?.value ?? '';
                      return (
                        <div key={g.key} className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-600">{g.attrName}</span>
                          <div className="flex flex-wrap justify-end gap-2">
                            {g.options.map((o) => {
                              const isSel = selected === o.value;
                              const pick = () => {
                                const match = findVariant(variants, currentAttrs, g.key, o.value);
                                if (match) setItem(idx, { variantDetailId: match.id });
                              };
                              if (g.displayMode === 'color' || g.displayMode === 'image') {
                                return (
                                  <button key={o.value} disabled={!editable} onClick={pick}
                                    className={`w-8 h-8 rounded-full overflow-hidden ring-2 ring-offset-2 ${isSel ? 'ring-indigo-500' : 'ring-slate-200'}`}>
                                    {g.displayMode === 'color'
                                      ? <span className="block w-full h-full" style={{ background: o.value }} />
                                      : <img src={o.value} alt="" className="w-full h-full object-cover" />}
                                  </button>
                                );
                              }
                              return (
                                <button key={o.value} disabled={!editable} onClick={pick}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${isSel ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>
                                  {o.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* ── المجموع ── */}
          <Card title="المجموع" icon={Truck}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">المنتجات</span><span className="font-bold">{money(order.itemsTotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">التوصيل</span><span className="font-bold">{money(order.priceShip)}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100"><span className="font-bold">المجموع</span><span className="text-lg font-extrabold text-emerald-600">{money(order.total)}</span></div>
            </div>
            {dirty && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-amber-700 font-bold">تعديلات غير محفوظة — الأسعار والتوصيل تُحسب عند الحفظ</p>
                <Button variant="outline" className="w-full" loading={busy === 'save'} onClick={onSave}><Save size={16} />حفظ التعديلات</Button>
              </div>
            )}
          </Card>

          {/* ── السجل ── */}
          <Card title="سجل الطلب" icon={History}>
            <p className="text-xs text-slate-500 mb-2">وصل {timeAgo(order.createdAt)} · {dateTime(order.createdAt)}</p>
            <ul className="space-y-2 max-h-64 overflow-auto">
              {order.history.map((h) => (
                <li key={h.id} className="text-xs border-s-2 border-slate-200 ps-2">
                  <p className="font-bold text-slate-700">
                    {ACTION_LABEL[h.action] ?? h.action}
                    {h.toStatus && <> → {STATUS[h.toStatus]?.label ?? h.toStatus}</>}
                  </p>
                  <p className="text-slate-400">{h.agent?.username ?? 'النظام'} · {timeAgo(h.createdAt)}</p>
                  {h.note && h.action !== 'edited' && <p className="text-slate-500 mt-0.5">{h.note}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── الأزرار الثابتة ── */}
      {editable && (
        <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-10 bg-white border-t border-slate-200 p-3">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="success" className="col-span-2 sm:col-span-1 py-3" loading={busy === 'confirmed'} onClick={() => setStatus('confirmed')}>
              <CheckCircle2 size={18} />تأكيد
            </Button>
            {nextAttempt && (
              <Button variant="warning" loading={busy === nextAttempt} onClick={() => setStatus(nextAttempt)}>
                <PhoneMissed size={16} />لم يرد ({STATUS[nextAttempt].label})
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialog('postpone')}><CalendarClock size={16} />تأجيل</Button>
            <Button variant="danger" onClick={() => setDialog('cancel')}><Ban size={16} />إلغاء</Button>
          </div>
        </div>
      )}

      {/* ── نافذة التأجيل / الإلغاء ── */}
      {dialog && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setDialog(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold">{dialog === 'postpone' ? 'تأجيل الطلب' : 'إلغاء الطلب'}</h3>
            {dialog === 'postpone' && (
              <Field label="متى يُعاد الاتصال؟">
                <Input type="datetime-local" dir="ltr" value={postponeAt} onChange={(e) => setPostponeAt(e.target.value)} />
              </Field>
            )}
            <Field label={dialog === 'cancel' ? 'سبب الإلغاء' : 'ملاحظة (اختياري)'}>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              {dialog === 'postpone' ? (
                <Button className="flex-1" loading={busy === 'postponed'} disabled={!postponeAt}
                  onClick={() => setStatus('postponed', { postponedUntil: new Date(postponeAt).toISOString(), note: note || undefined })}>
                  تأجيل
                </Button>
              ) : (
                <Button variant="danger" className="flex-1" loading={busy === 'cancelled'}
                  onClick={() => setStatus('cancelled', { note: note || undefined })}>
                  تأكيد الإلغاء
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialog(null)}>رجوع</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
