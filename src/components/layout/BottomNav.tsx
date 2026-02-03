"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
    Home,
    Wallet,
    Plus,
    ArrowLeftRight,
    User,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ActionSheet } from "./ActionSheet";

const tabs = [
    { id: "home", label: "Home", icon: Home, href: "/customer/dashboard" },
    { id: "wallet", label: "Carteira", icon: Wallet, href: "/customer/wallet" },
    { id: "action", label: "", icon: Plus, href: "#" },
    { id: "activity", label: "Atividade", icon: ArrowLeftRight, href: "/customer/transactions" },
    { id: "profile", label: "Perfil", icon: User, href: "/customer/settings" },
];

function getActiveTab(pathname: string): string {
    if (pathname.startsWith("/customer/dashboard")) return "home";
    if (pathname.startsWith("/customer/wallet")) return "wallet";
    if (pathname.startsWith("/customer/transactions")) return "activity";
    if (
        pathname.startsWith("/customer/settings") ||
        pathname.startsWith("/customer/kyc") ||
        pathname.startsWith("/customer/pix") ||
        pathname.startsWith("/customer/support") ||
        pathname.startsWith("/customer/affiliates")
    )
        return "profile";
    return "home";
}

export function BottomNav() {
    const pathname = usePathname() ?? "";
    const activeTab = getActiveTab(pathname);
    const [actionSheetOpen, setActionSheetOpen] = useState(false);

    // Scroll-aware auto-hide
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollThreshold = 8;

    const handleScroll = useCallback(() => {
        // Find the scroll container — the flex-1 overflow-y-auto div
        const scrollEl = document.querySelector("[data-scroll-container]") as HTMLElement | null;
        if (!scrollEl) return;

        const currentY = scrollEl.scrollTop;
        const delta = currentY - lastScrollY.current;

        if (delta > scrollThreshold && currentY > 60) {
            // Scrolling down past threshold — hide
            setVisible(false);
        } else if (delta < -scrollThreshold) {
            // Scrolling up — show
            setVisible(true);
        }

        lastScrollY.current = currentY;
    }, []);

    useEffect(() => {
        const scrollEl = document.querySelector("[data-scroll-container]") as HTMLElement | null;
        if (!scrollEl) return;

        scrollEl.addEventListener("scroll", handleScroll, { passive: true });
        return () => scrollEl.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Always show when action sheet is open
    useEffect(() => {
        if (actionSheetOpen) setVisible(true);
    }, [actionSheetOpen]);

    // Spring-animated translateY
    const yTarget = useMotionValue(visible ? 0 : 1);
    const ySmooth = useSpring(yTarget, { stiffness: 400, damping: 35, mass: 0.8 });
    const y = useTransform(ySmooth, [0, 1], [0, 120]);

    useEffect(() => {
        yTarget.set(visible ? 0 : 1);
    }, [visible, yTarget]);

    return (
        <>
            <ActionSheet
                open={actionSheetOpen}
                onClose={() => setActionSheetOpen(false)}
            />

            {/* Floating Liquid Glass dock */}
            <motion.nav
                className="fixed z-50 left-4 right-4 bottom-3 flex justify-center pointer-events-none"
                style={{ y }}
            >
                <div className="liquid-glass-dock pointer-events-auto w-full max-w-[400px]">
                    <div className="relative z-10 flex items-center justify-around h-[56px] px-1">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTab;
                            const isAction = tab.id === "action";
                            const Icon = tab.icon;

                            /* ─── Center FAB ─── */
                            if (isAction) {
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActionSheetOpen(true)}
                                        className="relative flex items-center justify-center outline-none -mt-3"
                                    >
                                        <motion.div
                                            className="flex items-center justify-center w-11 h-11 rounded-full"
                                            style={{
                                                background:
                                                    "linear-gradient(145deg, #a78bfa 0%, #8B5CF6 50%, #7c3aed 100%)",
                                                boxShadow: "0 2px 16px rgba(139, 92, 246, 0.4)",
                                            }}
                                            whileTap={{ scale: 0.88 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 25,
                                            }}
                                        >
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={actionSheetOpen ? "close" : "open"}
                                                    initial={{ rotate: actionSheetOpen ? -90 : 90, opacity: 0, scale: 0.5 }}
                                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                                    exit={{ rotate: actionSheetOpen ? 90 : -90, opacity: 0, scale: 0.5 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 25,
                                                    }}
                                                >
                                                    <Plus
                                                        className={`w-5 h-5 text-white ${actionSheetOpen ? "rotate-45" : ""}`}
                                                        strokeWidth={2.5}
                                                    />
                                                </motion.div>
                                            </AnimatePresence>
                                        </motion.div>
                                    </button>
                                );
                            }

                            /* ─── Regular tab ─── */
                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className="relative flex flex-col items-center justify-center px-3 py-1 outline-none"
                                >
                                    <motion.div
                                        className="relative flex flex-col items-center gap-0.5 z-10"
                                        whileTap={{ scale: 0.82 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 25,
                                        }}
                                    >
                                        <Icon
                                            className={`w-[20px] h-[20px] transition-colors duration-300 ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-white/40"
                                            }`}
                                            strokeWidth={isActive ? 2.2 : 1.6}
                                        />
                                        <span
                                            className={`text-[10px] leading-tight transition-colors duration-300 ${
                                                isActive
                                                    ? "text-white font-semibold"
                                                    : "text-white/40 font-medium"
                                            }`}
                                        >
                                            {tab.label}
                                        </span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </motion.nav>
        </>
    );
}
