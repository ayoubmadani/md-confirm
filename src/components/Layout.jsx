import { NavLink, Outlet } from 'react-router-dom';
import { History, Inbox, LogOut, PhoneCall, Settings, Users, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

export default function Layout() {
  const { membership, logout } = useAuth();
  const isOwner = membership?.member?.role === 'owner';
  const company = membership?.company;

  const isMember = !!membership?.member;
  const tabs = [
    ...(isMember ? [
      { to: '/', label: 'الطلبات', icon: Inbox, end: true },
      { to: '/history', label: 'سجلي', icon: History },
    ] : []),
    ...(isOwner ? [
      { to: '/earnings', label: 'الأرباح', icon: Wallet },
      { to: '/team', label: 'الفريق', icon: Users },
      { to: '/company', label: 'الشركة', icon: Settings },
    ] : []),
    ...(membership?.isAdmin ? [{ to: '/admin', label: 'الإدارة', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <PhoneCall size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold truncate">{company?.name ?? 'MD Confirm'}</p>
              <p className="text-[11px] text-slate-400">{isOwner ? 'مدير الشركة' : isMember ? 'موظف تأكيد' : 'إدارة المنصة'}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                <t.icon size={16} />{t.label}
              </NavLink>
            ))}
          </nav>

          <button onClick={logout} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-red-600">
            <LogOut size={16} /><span className="hidden sm:inline">خروج</span>
          </button>
        </div>
        {company?.status === 'pending' && (
          <div className="bg-amber-50 border-t border-amber-200 text-amber-800 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2">
            <Clock size={14} />شركتك بانتظار موافقة إدارة المنصة — لن تظهر للتجار قبل الموافقة
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        <Outlet />
      </main>

      {/* شريط سفلي للهاتف */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 flex">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <t.icon size={20} />{t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
