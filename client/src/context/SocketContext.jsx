/**
 * SocketContext.jsx
 * Provides a shared socket.io-client instance to the whole app.
 * Owner dashboard pages use `useSocket()` to listen for real-time events.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MdClose } from "react-icons/md";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

function playNotificationSound() {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.7;
    const promise = audio.play();
    if (promise) {
      promise.catch(() => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const tones = [880, 1100];
          tones.forEach((frequency, index) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = "sine";
            const startTime = ctx.currentTime + index * 0.2;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
          });
        } catch (_) {}
      });
    }
  } catch (_) {}
}

function CustomerToast({ notif, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed top-4 left-1/2 z-[9999] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-orange-200 bg-white shadow-2xl overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl">
          🔔
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {notif.title || "Order update"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {notif.body}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close notification"
        >
          <MdClose size={18} />
        </button>
      </div>
    </motion.div>
  );
}

export function SocketProvider({ children }) {
  const [socket, setSocket]     = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const clearToast = useMemo(() => () => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const fireCustomerNotification = useMemo(() => (notif) => {
    playNotificationSound();
    setToast(notif);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 7000);

    if (navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notif.title || "Order update", {
        body: notif.body,
        icon: "/favicon.ico",
      });
    }
  }, []);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on("connect",    () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    setSocket(s);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const userId = user._id;
    const joinRoom = () => socket.emit("joinUserRoom", userId);
    const leaveRoom = () => socket.emit("leaveUserRoom", userId);

    joinRoom();
    socket.on("connect", joinRoom);

    const onOutForDelivery = (payload) => {
      fireCustomerNotification({
        id: `${Date.now()}-${payload.orderId ?? "order"}`,
        title: payload.title || payload.restaurantName || "Order update",
        body: payload.body || "Your order status has changed.",
      });
    };

    socket.on("orderOutForDelivery", onOutForDelivery);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("orderOutForDelivery", onOutForDelivery);
      leaveRoom();
    };
  }, [socket, user?._id, fireCustomerNotification]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
      <AnimatePresence>
        {toast && <CustomerToast notif={toast} onClose={clearToast} />}
      </AnimatePresence>
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
