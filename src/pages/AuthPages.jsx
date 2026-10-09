import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Info, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input } from '../components/ui.jsx';

const GOOGLE_URL = `${import.meta.env.VITE_API_URL}/auth/confirm/google`;

function GoogleButton() {
  return (
    <>
      <a href={GOOGLE_URL}
        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        المتابعة عبر Google
      </a>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex-1 h-px bg-slate-200" />أو<span className="flex-1 h-px bg-slate-200" />
      </div>
    </>
  );
}

/** رجوع من Google: /auth/callback?token=... */
export function GoogleCallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  useEffect(() => {
    const token = new URLSearchParams(search).get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=google_auth_error', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">جاري تسجيل الدخول...</div>;
}

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-indigo-50 to-slate-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-indigo-200">
            <PhoneCall size={26} />
          </div>
          <h1 className="text-xl font-extrabold">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">{children}</div>
        {footer && <div className="text-center text-sm text-slate-500 mt-4">{footer}</div>}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? '');
  const [password, setPassword] = useState('');
  const { search } = useLocation();
  useEffect(() => {
    if (new URLSearchParams(search).get('error')) toast.error('فشل الدخول عبر Google، حاول مرة أخرى');
  }, [search]);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      if (data.message === 'ACCOUNT_NOT_VERIFIED') {
        toast.info('أرسلنا رمز التفعيل إلى بريدك');
        navigate('/verify', { state: { email: email.trim(), password } });
        return;
      }
      login(data.access_token);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="MD Confirm"
      subtitle="تطبيق تأكيد الطلبيات"
      footer={<>ليس لديك حساب؟ <Link to="/register" className="font-bold text-indigo-600">أنشئ حساباً</Link></>}
    >
      <div className="flex gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 leading-relaxed">
        <Info size={16} className="shrink-0 text-sky-600" />
        <span>لديك حساب في منصة <b>MD Store</b>؟ استعمله مباشرة هنا — <b>لا تنشئ حساباً جديداً</b>. بعد الدخول اطلب صلاحية مؤكّد الطلبيات، ويوافق عليها الأدمن.</span>
      </div>
      <GoogleButton />
      <form onSubmit={submit} className="space-y-4">
        <Field label="البريد الإلكتروني">
          <Input type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="كلمة المرور">
          <Input type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="text-start -mt-2">
          <Link to="/forgot" className="text-xs font-bold text-indigo-600">نسيت كلمة المرور؟</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">دخول</Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  // البريد مسجّل في منصة MD Store — نفس الحساب يعمل هنا، فقط يسجّل الدخول
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('كلمة المرور 6 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, email: form.email.trim() });
      toast.success('أرسلنا رمز التفعيل إلى بريدك');
      navigate('/verify', { state: { email: form.email.trim(), password: form.password } });
    } catch (err) {
      if (err?.response?.data?.message === 'User already exists') setExists(true);
      else toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="حساب جديد"
      subtitle="لمدير شركة تأكيد أو لموظف"
      footer={<>لديك حساب؟ <Link to="/login" className="font-bold text-indigo-600">سجّل الدخول</Link></>}
    >
      <div className="flex gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 leading-relaxed">
        <Info size={16} className="shrink-0 text-sky-600" />
        <span>لديك حساب في منصة <b>MD Store</b>؟ استعمله مباشرة هنا — <b>لا تنشئ حساباً جديداً</b>. بعد الدخول اطلب صلاحية مؤكّد الطلبيات، ويوافق عليها الأدمن.</span>
      </div>
      <GoogleButton />
      {exists && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm space-y-2">
          <p className="font-bold text-indigo-900">لديك حساب في منصة MD Store بهذا البريد</p>
          <p className="text-indigo-800 text-xs">نفس الحساب يعمل في تطبيق التأكيد — سجّل الدخول بنفس البريد وكلمة المرور.</p>
          <Button type="button" className="w-full" onClick={() => navigate('/login', { state: { email: form.email.trim() } })}>
            تسجيل الدخول بهذا الحساب
          </Button>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="الاسم"><Input required value={form.username} onChange={set('username')} /></Field>
        <Field label="البريد الإلكتروني"><Input type="email" dir="ltr" required value={form.email} onChange={(e) => { setExists(false); set('email')(e); }} /></Field>
        <Field label="رقم الهاتف"><Input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="كلمة المرور"><Input type="password" dir="ltr" required value={form.password} onChange={set('password')} /></Field>
        <Button type="submit" loading={loading} className="w-full">إنشاء الحساب</Button>
      </form>
    </AuthShell>
  );
}

export function VerifyPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  // البريد الذي أُرسل له الرمز؛ يُكتب يدوياً فقط إذا فُتحت الصفحة مباشرة
  const fixedEmail = state?.email ?? '';
  const [email, setEmail] = useState(fixedEmail);
  // تصحيح البريد إذا أخطأ المستخدم في كتابته عند التسجيل
  const [changing, setChanging] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState(state?.password ?? '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, otp: Number(otp) });
      if (state?.password) {
        const { data } = await api.post('/auth/login', { email, password: state.password });
        login(data.access_token);
        navigate('/', { replace: true });
      } else {
        toast.success('تم تفعيل الحساب، سجّل الدخول');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async () => {
    if (!newEmail.trim() || !password) return;
    setSavingEmail(true);
    try {
      await api.post('/auth/change-email', { email, password, newEmail: newEmail.trim() });
      setEmail(newEmail.trim());
      setChanging(false);
      setNewEmail('');
      setOtp('');
      toast.success('تم تغيير البريد وأرسلنا رمزاً جديداً إليه');
    } catch (err) {
      const msg = err?.response?.data?.message;
      toast.error(msg === 'Email already in use' ? 'هذا البريد مستعمل في حساب آخر'
        : msg === 'Account already verified' ? 'هذا الحساب مفعّل مسبقاً، سجّل الدخول'
          : errorMessage(err));
    } finally {
      setSavingEmail(false);
    }
  };

  const resend = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('أُرسل رمز جديد');
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <AuthShell title="تفعيل الحساب" subtitle="أدخل الرمز الذي وصلك على البريد">
      <form onSubmit={submit} className="space-y-4">
        {fixedEmail ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-2">
            <div>
              <p className="text-slate-500 text-xs">أرسلنا الرمز إلى</p>
              <p className="font-bold ltr text-start break-all">{email}</p>
            </div>
            {!changing ? (
              <button type="button" onClick={() => setChanging(true)} className="text-xs font-bold text-indigo-600">
                البريد خاطئ؟ غيّره
              </button>
            ) : (
              <div className="space-y-2 pt-1">
                <Input type="email" dir="ltr" placeholder="البريد الصحيح" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input type="password" dir="ltr" placeholder="كلمة مرور هذا الحساب" value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="flex gap-2">
                  <Button type="button" className="flex-1" loading={savingEmail} disabled={!newEmail.trim() || !password} onClick={changeEmail}>
                    تغيير وإرسال رمز جديد
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setChanging(false)}>إلغاء</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Field label="البريد الإلكتروني"><Input type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        )}
        <Field label="رمز التفعيل">
          <Input inputMode="numeric" dir="ltr" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="tracking-widest" />
        </Field>
        <Button type="submit" loading={loading} className="w-full">تفعيل</Button>
        <button type="button" onClick={resend} className="w-full text-sm font-bold text-indigo-600">إعادة إرسال الرمز</button>
      </form>
    </AuthShell>
  );
}

/** نسيت كلمة المرور: رمز على البريد ← كلمة مرور جديدة ← دخول مباشر */
export function ForgotPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('أرسلنا رمزاً إلى بريدك');
      setStep('reset');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('كلمة المرور 6 أحرف على الأقل'); return; }
    if (password !== confirm) { toast.error('كلمتا المرور غير متطابقتين'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: Number(otp), password });
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      if (data.access_token) {
        login(data.access_token);
        toast.success('تم تغيير كلمة المرور');
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="نسيت كلمة المرور"
      subtitle={step === 'email' ? 'نرسل لك رمزاً على بريدك' : 'أدخل الرمز وكلمة المرور الجديدة'}
      footer={<Link to="/login" className="font-bold text-indigo-600">رجوع لتسجيل الدخول</Link>}
    >
      {step === 'email' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="البريد الإلكتروني">
            <Input type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Button type="submit" loading={loading} className="w-full">إرسال الرمز</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
            <p className="text-slate-500 text-xs">أرسلنا الرمز إلى</p>
            <p className="font-bold ltr text-start break-all">{email}</p>
            <button type="button" onClick={() => setStep('email')} className="text-xs font-bold text-indigo-600">تغيير البريد</button>
          </div>
          <Field label="الرمز">
            <Input inputMode="numeric" dir="ltr" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="tracking-widest" />
          </Field>
          <Field label="كلمة المرور الجديدة">
            <Input type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <Input type="password" dir="ltr" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" loading={loading} className="w-full">حفظ والدخول</Button>
          <button type="button" onClick={sendCode} className="w-full text-sm font-bold text-indigo-600">إعادة إرسال الرمز</button>
        </form>
      )}
    </AuthShell>
  );
}
