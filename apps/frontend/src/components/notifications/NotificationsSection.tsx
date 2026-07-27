import { useState, useEffect, useCallback } from 'react';
import { Loader2, Bell, CheckCheck, Trash2, Building, MessageSquare, ShieldCheck, Megaphone, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api, { Notification } from '@/services/api';

const ICON_MAP: Record<string, typeof Bell> = {
  transaction: Building,
  message: MessageSquare,
  kyc: ShieldCheck,
  system: Megaphone,
  property: Building,
  review: Star,
};

const TYPE_LABELS: Record<string, string> = {
  transaction: 'Transaccion',
  message: 'Mensaje',
  kyc: 'Verificacion',
  system: 'Sistema',
  property: 'Propiedad',
  review: 'Resena',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const LIMIT = 15;

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.getNotifications(p, LIMIT);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setTotalPages(res.data.pagination.pages);
        setTotal(res.data.pagination.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const notif = (e as CustomEvent).detail as Notification;
      setNotifications(prev => {
        const next = [notif, ...prev];
        return next.length > LIMIT ? next.slice(0, LIMIT) : next;
      });
      setTotal(prev => prev + 1);
    };

    window.addEventListener('notif_new', handleNewNotification);
    return () => window.removeEventListener('notif_new', handleNewNotification);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await api.markNotificationAsRead(id);
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    }
  };

  const handleMarkAllRead = async () => {
    const prev = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsAsRead();
    } catch {
      setNotifications(prev);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
          <p className="text-sm text-gray-500">{total} notificaciones</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5 text-xs h-8">
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todo leido
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No hay notificaciones</p>
            <p className="text-xs text-gray-400 mt-1">Las notificaciones importantes apareceran aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {notifications.map(n => {
            const Icon = ICON_MAP[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`group flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                  n.isRead
                    ? 'bg-white border-gray-100 hover:border-gray-200'
                    : 'bg-primary/[0.03] border-primary/10 hover:border-primary/20'
                }`}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 mt-0.5 ${
                  n.isRead ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm leading-tight ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${
                      n.isRead ? 'text-gray-400' : 'text-primary/70'
                    }`}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      disabled={deleting === n.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="gap-1 text-xs h-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Anterior
          </Button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="gap-1 text-xs h-8">
            Siguiente <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}