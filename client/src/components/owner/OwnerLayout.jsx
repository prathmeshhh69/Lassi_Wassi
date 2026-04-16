import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdNotifications, MdClose } from "react-icons/md";
import Sidebar from "./Sidebar";
import { OwnerRestaurantProvider, useOwnerRestaurant } from "../../context/OwnerRestaurantContext";
import { useSocket } from "../../context/SocketContext";

const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit:    { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

// ─── Notification sound ──────────────────────────────────────────────────────
// Primary: play /notification.mp3 (generated WAV served from /public).
// Fallback: synthesise a two-tone beep via Web Audio API (no file needed).
function playNotifSound(type = "order") {
    // Primary — HTML Audio element
    try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.7;
        const p = audio.play();
        if (p !== undefined) {
            p.catch(() => _playNotifSoundSynth(type)); // autoplay blocked → synth
        }
        return;
    } catch (_) { /* fall through to synth */ }
    _playNotifSoundSynth(type);
}

function _playNotifSoundSynth(type = "order") {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const t = ctx.currentTime;
        const tones = type === "order"
            ? [{ f: 880, s: t,        d: 0.28 }, { f: 1100, s: t + 0.2, d: 0.28 }]
            : [{ f: 660, s: t,        d: 0.28 }, { f: 880,  s: t + 0.2, d: 0.28 }];
        tones.forEach(({ f, s, d }) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = f;
            osc.type = "sine";
            gain.gain.setValueAtTime(0, s);
            gain.gain.linearRampToValueAtTime(0.35, s + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, s + d);
            osc.start(s); osc.stop(s + d);
        });
    } catch (_) {}
}

// ─── Toast banner ─────────────────────────────────────────────────────────────
function NotifToast({ notif, onClose }) {
    const isOrder = notif.type === "order";
    return (
        <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -48, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -48, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-2xl shadow-2xl px-5 py-3.5 text-sm font-medium min-w-72 max-w-sm ${
                isOrder ? "bg-orange-500 text-white" : "bg-purple-600 text-white"
            }`}
        >
            <span className="text-2xl shrink-0">{isOrder ? "🛒" : "📅"}</span>
            <div className="flex-1">
                <p className="font-semibold">{isOrder ? "New order received!" : "New booking received!"}</p>
                <p className={`text-xs mt-0.5 ${isOrder ? "text-orange-100" : "text-purple-200"}`}>{notif.sub}</p>
            </div>
            <button onClick={onClose} className={`ml-1 ${isOrder ? "text-orange-200 hover:text-white" : "text-purple-300 hover:text-white"} transition-colors`}>
                <MdClose size={18} />
            </button>
        </motion.div>
    );
}

// ─── Bell icon with unread badge ──────────────────────────────────────────────
function NotifBell({ count, onClick }) {
    return (
        <button onClick={onClick} className="relative p-1.5 rounded-xl hover:bg-gray-100 transition-colors" title="Notifications">
            <MdNotifications size={22} className="text-gray-500" />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </button>
    );
}

// ─── Inner layout (has access to both context providers) ─────────────────────
const OwnerLayoutInner = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    const { restaurant } = useOwnerRestaurant();
    const { socket }     = useSocket();

    const [toast,  setToast]  = useState(null); // { id, type, sub }
    const [unread, setUnread] = useState(0);
    const toastTimer = useRef(null);

    // Request browser notification permission once
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Show a toast + play sound + fire browser notification
    const fireNotif = (notif) => {
        playNotifSound(notif.type);
        setToast(notif);
        setUnread((n) => n + 1);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 7000);
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(
                notif.type === "order" ? "New Order 🛒" : "New Booking 📅",
                { body: notif.sub, icon: "/favicon.ico" }
            );
        }
    };

    // Join restaurant socket room + listen for events
    useEffect(() => {
        if (!socket || !restaurant?._id) return;
        const roomId = restaurant._id;

        // Join now (socket may already be connected), and re-join on every reconnect
        const joinRoom = () => socket.emit("joinRestaurant", roomId);
        joinRoom();
        socket.on("connect", joinRoom);

        const onNewOrder = (order) => fireNotif({
            id:   Date.now(),
            type: "order",
            sub:  `${order.user?.name ?? "Customer"} — ₹${Number(order.totalAmount || 0).toFixed(2)}${order.fulfillmentType === "pickup" ? " • Pickup" : " • Delivery"}`,
        });

        const onNewBooking = (booking) => fireNotif({
            id:   Date.now(),
            type: "booking",
            sub:  `${booking.customerName ?? "Guest"} — ${booking.partySize} people at ${booking.time}`,
        });

        socket.on("newOrder",   onNewOrder);
        socket.on("newBooking", onNewBooking);
        return () => {
            socket.off("connect",    joinRoom);
            socket.off("newOrder",   onNewOrder);
            socket.off("newBooking", onNewBooking);
            clearTimeout(toastTimer.current);
        };
    }, [socket, restaurant?._id]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Global notification toast */}
            <AnimatePresence>
                {toast && <NotifToast notif={toast} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((v) => !v)}
            />

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="h-[65px] bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
                    <h1 className="text-gray-400 text-sm font-medium">Owner Portal</h1>
                    <div className="ml-auto flex items-center gap-3">
                        <NotifBell count={unread} onClick={() => setUnread(0)} />
                        <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold border border-orange-200">
                            Owner
                        </span>
                    </div>
                </header>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                    <motion.div
                        key={location.pathname}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="p-6 max-w-7xl mx-auto w-full"
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

/** Wrap the inner layout with the restaurant context provider */
const OwnerLayout = () => (
    <OwnerRestaurantProvider>
        <OwnerLayoutInner />
    </OwnerRestaurantProvider>
);

export default OwnerLayout;
