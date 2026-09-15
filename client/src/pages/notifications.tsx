import { useState } from "react";
import { Bell, BookOpen, Check, Target } from "lucide-react";
import { getListNotificationsQueryKey, useListNotifications, useMarkNotificationRead, type Course, type Notification } from "@/lib/api-client-react";
import { EmptyState, Flash, QueryState } from "@/components/common";
import { Shell } from "@/components/layout";
import { queryClient } from "@/lib/query-client";
export function NotificationsPage() {
  const query = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey() },
  });
  const markRead = useMarkNotificationRead();
  const [flash, setFlash] = useState("");
  const notifications = query.data || [];
  const mark = (notification: Notification) =>
    markRead.mutate(
      { notificationId: notification.id },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(
            getListNotificationsQueryKey(),
            (old: Notification[] | undefined) =>
              old?.map((item) => (item.id === updated.id ? updated : item)),
          );
          setFlash("Update marked as read.");
        },
      },
    );
  return (
    <Shell>
      <div className="content-header animate-in">
        <div>
          <div className="eyebrow">Your signal desk</div>
          <h1>Updates worth your attention.</h1>
          <p>
            Course changes, competency nudges, and the small details that keep
            your learning moving.
          </p>
        </div>
        <div className="pill">
          {notifications.filter((item) => !item.read).length} unread
        </div>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        label="notifications"
      >
        {notifications.length ? (
          <div className="notification-list">
            {notifications.map((notification, index) => (
              <NotificationRow
                item={notification}
                onRead={mark}
                pending={markRead.isPending}
                key={notification.id}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell />}
            title="No updates right now"
            text="When there is something useful to know, it will land here."
          />
        )}
      </QueryState>
      {flash && <Flash message={flash} onClose={() => setFlash("")} />}
    </Shell>
  );
}

export function NotificationRow({
  item,
  onRead,
  pending,
  index,
}: {
  item: Notification;
  onRead: (item: Notification) => void;
  pending: boolean;
  index: number;
}) {
  return (
    <article
      className={`surface notification-item ${!item.read ? "unread" : ""} animate-in delay-${Math.min(index + 1, 4)}`}
      data-testid={`notification-${item.id}`}
    >
      <span className="notification-icon">
        {item.type.toLowerCase().includes("course") ? (
          <BookOpen size={15} />
        ) : item.type.toLowerCase().includes("compet") ? (
          <Target size={15} />
        ) : (
          <Bell size={15} />
        )}
      </span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        {!item.read && (
          <button
            className="text-button"
            style={{ marginTop: 9 }}
            disabled={pending}
            onClick={() => onRead(item)}
            data-testid={`button-mark-read-${item.id}`}
          >
            Mark as read <Check size={13} style={{ verticalAlign: "middle" }} />
          </button>
        )}
      </div>
      <span className="notification-time">{item.time}</span>
    </article>
  );
}

