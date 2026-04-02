import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (isLoading) return <LoadingSpinner text="Loading notifications..." />;

  const notifications = notificationsData?.data || [];
  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'delivery':
        return <Bell className="w-4 h-4 text-green-600" />;
      case 'prescription':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
            All
          </Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>
            Unread
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No notifications</p>
            ) : (
              filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded border ${
                    notification.read ? 'bg-muted/30' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <p className={notification.read ? 'text-muted-foreground' : 'font-medium'}>{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
