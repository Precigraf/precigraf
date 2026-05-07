import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const NotificationBell: React.FC = () => {
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">Notificações</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()}>
              <Check className="w-3 h-3 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Sem notificações</div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'p-3 flex gap-2 hover:bg-muted/50 cursor-pointer transition-colors',
                    !n.read_at && 'bg-primary/5'
                  )}
                  onClick={() => {
                    if (!n.read_at) markRead.mutate(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {!n.read_at && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove.mutate(n.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
