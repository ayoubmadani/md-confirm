import axios from 'axios';

const TOKEN_KEY = 'confirm_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (token) => {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* وضع خاص */ }
};

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// انتهت الجلسة → رجوع لصفحة الدخول
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      setToken(null);
      window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);

/** رسالة خطأ مقروءة من رد الـ API */
export const errorMessage = (err, fallback = 'حدث خطأ، حاول مرة أخرى') => {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  if (typeof msg === 'string') return translate(msg);
  if (msg?.message) return msg.message;
  if (err?.code === 'ERR_NETWORK') return 'لا يوجد اتصال بالخادم';
  return fallback;
};

// رسائل الـ API الإنجليزية الأكثر شيوعاً
const MESSAGES = {
  'User not found': 'لا يوجد حساب بهذا البريد',
  'Password does not match': 'كلمة المرور غير صحيحة',
  'Please login with Google': 'هذا الحساب يدخل عبر Google',
  'Invalid OTP code': 'الرمز غير صحيح',
  'OTP has expired': 'انتهت صلاحية الرمز، اطلب رمزاً جديداً',
  'User already exists': 'هذا البريد مسجّل مسبقاً — سجّل الدخول به',
};
const translate = (m) => MESSAGES[m] ?? m;
