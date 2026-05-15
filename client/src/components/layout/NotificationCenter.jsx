import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  Package,
  ShoppingCart,
  Trash2,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { connectEstablishmentSocket, socket } from "../../services/socket";
import { useAppStore } from "../../store/useAppStore";
import { Drawer } from "../ui/Drawer";
import { Button } from "../ui/Button";

const money = (value) => `${Number(value || 0).toFixed(2)} DH`;

const tableLabel = (order) =>
  order?.table?.number ||
  (order?.source === "DELIVERY" ? "Livraison" : order?.source === "COUNTER" ? "Comptoir" : "Table client");

const relativeTime = (value, lang) => {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);

  if (lang === "ar") {
    if (minutes < 1) return "\u0627\u0644\u0622\u0646";
    if (minutes < 60) return `${minutes} \u062f\u0642\u064a\u0642\u0629`;
    return `${Math.floor(minutes / 60)} \u0633\u0627\u0639\u0629`;
  }

  if (lang === "en") {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)} h`;
  }

  if (minutes < 1) return "Maintenant";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h`;
};

const NotificationIcon = ({ type }) => {
  const className = "shrink-0 rounded-xl p-2";

  if (type === "warning") {
    return (
      <div className={`${className} bg-warning/15 text-warning`}>
        <AlertTriangle size={16} />
      </div>
    );
  }

  if (type === "danger") {
    return (
      <div className={`${className} bg-danger/15 text-danger`}>
        <AlertTriangle size={16} />
      </div>
    );
  }

  if (type === "success") {
    return (
      <div className={`${className} bg-success/15 text-success`}>
        <CreditCard size={16} />
      </div>
    );
  }

  if (type === "order") {
    return (
      <div className={`${className} bg-gold/15 text-copper`}>
        <ShoppingCart size={16} />
      </div>
    );
  }

  if (type === "stock") {
    return (
      <div className={`${className} bg-orange-500/15 text-orange-500`}>
        <Package size={16} />
      </div>
    );
  }

  return (
    <div className={`${className} bg-elegant/15 text-elegant`}>
      <Info size={16} />
    </div>
  );
};

export const NotificationCenter = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const notifications = useAppStore((state) => state.notifications);
  const pushNotification = useAppStore((state) => state.pushNotification);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useAppStore((state) => state.markAllNotificationsRead);
  const clearNotifications = useAppStore((state) => state.clearNotifications);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const lang = i18n.language;

  useEffect(() => {
    if (!user) return undefined;

    const establishmentId = user.establishmentId;
    const isSuperAdmin = user.roleName === "SUPER_ADMIN";

    connectEstablishmentSocket(establishmentId);

    const joinRooms = () => {
      if (establishmentId) socket.emit("join:establishment", establishmentId);
      if (isSuperAdmin) socket.emit("join:super-admin");
    };

    const onConnect = () => {
      setConnected(true);
      joinRooms();
    };

    const onDisconnect = () => setConnected(false);

    const onNewOrder = (order) => {
      const notification = {
        key: `order-new-${order.id}`,
        title: t("new_order"),
        body: `${order.code} - ${tableLabel(order)} - ${money(order.total)}`,
        type: "order"
      };

      pushNotification(notification);
      toast.success(notification.title);
    };

    const onOrderStatus = (order) => {
      pushNotification({
        key: `order-status-${order.id}-${order.status}`,
        title: t("order_status"),
        body: `${order.code} -> ${t(`status_${order.status}`) || order.status}`,
        type: order.status === "CANCELLED" ? "danger" : "success"
      });
    };

    const onPayment = ({ payment, invoice }) => {
      const notification = {
        key: `payment-${payment.id}`,
        title: t("payment_received"),
        body: `${money(payment.amount)} - ${invoice?.number || ""}`.trim().replace(/- $/, ""),
        type: "success"
      };

      pushNotification(notification);
      toast.success(notification.title);
    };

    const onStockMovement = ({ stock, movement }) => {
      pushNotification({
        key: `stock-movement-${movement.id}`,
        title: t("stock_movement"),
        body: `${stock.name}: ${movement.type} ${movement.quantity} ${stock.unit}`,
        type: Number(stock.quantity) <= Number(stock.alertThreshold) ? "warning" : "stock"
      });
    };

    const onStockAlert = (stock) => {
      const isOut = Number(stock.quantity) <= 0;
      const notification = {
        key: `stock-alert-${stock.id}-${stock.quantity}`,
        title: isOut ? t("stock_empty") : t("stock_alert"),
        body: `${stock.name}: ${stock.quantity} ${stock.unit} - seuil ${stock.alertThreshold}`,
        type: "danger"
      };

      pushNotification(notification);
      toast.error(notification.title);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:new", onNewOrder);
    socket.on("order:status", onOrderStatus);
    socket.on("payment:created", onPayment);
    socket.on("stock:movement", onStockMovement);
    socket.on("stock:alert", onStockAlert);

    setConnected(socket.connected);
    if (socket.connected) joinRooms();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("order:new", onNewOrder);
      socket.off("order:status", onOrderStatus);
      socket.off("payment:created", onPayment);
      socket.off("stock:movement", onStockMovement);
      socket.off("stock:alert", onStockAlert);
    };
  }, [pushNotification, user, t]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-2xl border border-black/10 bg-white/80 p-2.5 text-ink shadow-sm transition hover:border-gold dark:border-white/10 dark:bg-white/10 dark:text-cream"
        aria-label={t("notifications")}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-black text-white shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={t("notification_center")}>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              {connected ? <Wifi size={16} className="text-success" /> : <WifiOff size={16} className="text-danger" />}
              <span className={connected ? "text-success" : "text-danger"}>
                {connected ? t("realtime_active") : t("realtime_off")}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={CheckCheck}
                onClick={markAllNotificationsRead}
                disabled={!notifications.length || !unreadCount}
              >
                {t("mark_all_read")}
              </Button>
              <Button size="sm" variant="secondary" icon={Trash2} onClick={clearNotifications} disabled={!notifications.length}>
                {t("clear_all")}
              </Button>
            </div>
          </div>

          {!notifications.length && (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
              <Bell size={32} className="mx-auto mb-3 text-elegant/40" />
              <p className="text-sm font-semibold text-elegant">{t("no_notifications")}</p>
              <p className="mx-auto mt-2 max-w-sm text-xs font-medium leading-5 text-elegant/80">
                {t("notification_socket_hint")}
              </p>
            </div>
          )}

          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => markNotificationRead(notification.id)}
              className={`w-full rounded-2xl border p-4 text-left transition hover:shadow-soft ${
                notification.read
                  ? "border-black/5 bg-white/70 dark:border-white/10 dark:bg-white/5"
                  : "border-gold/40 bg-gold/[0.07] dark:border-gold/30 dark:bg-gold/[0.05]"
              }`}
            >
              <div className="flex items-start gap-3">
                <NotificationIcon type={notification.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-black ${notification.read ? "text-ink/70 dark:text-cream/60" : "text-ink dark:text-cream"}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-elegant line-clamp-2">{notification.body}</p>
                  <p className="mt-1.5 text-[10px] font-bold text-elegant/60">
                    {relativeTime(notification.createdAt, lang)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Drawer>
    </>
  );
};
