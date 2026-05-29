import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/api/notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/i18n';

const ForcedNotificationModal = () => {
  const t = useT();
  const [queue, setQueue] = useState<api.InboxItemResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const confirmingRef = useRef(false);

  const checkForced = useCallback(async () => {
    const result = await api.getUnreadCount();
    if (!result.hasForced) return;

    const items = await api.getForcedNotifications();
    if (items.length === 0) return;

    setQueue(items);
    setCurrentIndex(0);
    setVisible(true);
  }, []);

  useEffect(() => {
    void checkForced();
  }, [checkForced]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkForced();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkForced]);

  const handleConfirm = useCallback(async () => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;

    const item = queue[currentIndex];
    if (!item) {
      confirmingRef.current = false;
      return;
    }

    await api.markRead(item.id);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setVisible(false);
      setQueue([]);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }

    confirmingRef.current = false;
  }, [queue, currentIndex]);

  if (!visible || queue.length === 0) return null;

  const current = queue[currentIndex];
  if (!current) return null;

  const isLast = currentIndex >= queue.length - 1;

  return (
    <Dialog open={visible} onOpenChange={() => {}}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="destructive">
              {t('Notification.ForcedModal.urgent', '紧急通知')}
            </Badge>
            <span className="font-semibold">{current.title}</span>
          </DialogTitle>
        </DialogHeader>

        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {current.content}
        </p>

        <DialogFooter>
          <Button variant="destructive" onClick={() => void handleConfirm()}>
            {isLast
              ? t('Notification.ForcedModal.confirm', '确定')
              : t('Notification.ForcedModal.confirmNext', '确定，查看下一条')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForcedNotificationModal;
