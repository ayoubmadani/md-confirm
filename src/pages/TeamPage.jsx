import { useCallback, useEffect, useState } from 'react';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '../lib/api';
import { Badge, Button, Card, Input, Spinner } from '../components/ui.jsx';

export default function TeamPage() {
  const [members, setMembers] = useState(null);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/confirmation/team');
      setMembers(data);
    } catch (err) {
      toast.error(errorMessage(err));
      setMembers([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/confirmation/team', { email: email.trim() });
      toast.success('أُضيف الموظف');
      setEmail('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`حذف ${m.user.username} من الفريق؟`)) return;
    try {
      await api.delete(`/confirmation/team/${m.id}`);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!members) return <Spinner />;

  return (
    <div className="space-y-4 max-w-2xl">
      <Card title="إضافة موظف" icon={UserPlus}>
        <p className="text-xs text-slate-500 mb-3">
          الموظف ينشئ حساباً في هذا التطبيق أولاً، ثم أضفه هنا بالبريد الذي سجّل به.
        </p>
        <form onSubmit={add} className="flex gap-2">
          <Input type="email" dir="ltr" required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={adding}>إضافة</Button>
        </form>
      </Card>

      <Card title={`الفريق (${members.length})`} icon={Users}>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{m.user.username}</p>
                <p className="text-xs text-slate-500 ltr truncate">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={m.role === 'owner' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}>
                  {m.role === 'owner' ? 'المدير' : 'موظف'}
                </Badge>
                {m.role !== 'owner' && (
                  <button onClick={() => remove(m)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
