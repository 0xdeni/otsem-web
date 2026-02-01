"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Wallet,
    Plus,
    ArrowLeftRight,
    User,
} from "lucide-react";
import { useState } from "react";
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

    return (
        <>
            <ActionSheet
                open={actionSheetOpen}
                onClose={() => setActionSheetOpen(false)}
            />

            {/* Spacer to prevent content from hiding behind nav */}
            <div className="h-[calc(5rem+env(safe-area-inset-bottom,0px))]" />

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                {/* Liquid Glass Background */}
                <div className="absolute inset-0 bg-white/60 dark:bg-[#0a0118]/70 border-t border-white/30 dark:border-white/[0.08]"
                    style={{
                        WebkitBackdropFilter: "blur(40px) saturate(180%)",
                        backdropFilter: "blur(40px) saturate(180%)",
                    }}
                />

                {/* Gradient glow from active tab */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        className="absolute -top-8 w-20 h-20 rounded-full bg-[#6F00FF]/20 dark:bg-[#6F00FF]/30 blur-2xl"
                        animate={{
                            left: `${tabs.findIndex((t) => t.id === activeTab) * 20 + 10}%`,
                            x: "-50%",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>

                <div
                    className="relative flex items-end justify-around px-2"
                    style={{
                        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
                    }}
                >
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        const isAction = tab.id === "action";
                        const Icon = tab.icon;

                        if (isAction) {
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActionSheetOpen(true)}
                                    className="relative -mt-4 flex flex-col items-center justify-center outline-none"
                                >
                                    <motion.div
                                        className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
                                        style={{
                                            background: "linear-gradient(135deg, #8B2FFF 0%, #6F00FF 100%)",
                                            boxShadow: "0 4px 20px rgba(111, 0, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    >
                                        <AnimatePresence mode="wait">
                                            {actionSheetOpen ? (
                                                <motion.div
                                                    key="close"
                                                    initial={{ rotate: -90, opacity: 0 }}
                                                    animate={{ rotate: 0, opacity: 1 }}
                                                    exit={{ rotate: 90, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Plus className="w-7 h-7 text-white rotate-45" />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="open"
                                                    initial={{ rotate: 90, opacity: 0 }}
                                                    animate={{ rotate: 0, opacity: 1 }}
                                                    exit={{ rotate: -90, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Plus className="w-7 h-7 text-white" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className="relative flex flex-col items-center justify-center pt-2 pb-1 min-w-[64px] outline-none"
                            >
                                <motion.div
                                    className="relative flex flex-col items-center gap-0.5"
                                    whileTap={{ scale: 0.85 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    <div className="relative">
                                        <Icon
                                            className={`w-6 h-6 transition-colors duration-200 ${
                                                isActive
                                                    ? "text-[#6F00FF] dark:text-[#8B2FFF]"
                                                    : "text-[#7c7591] dark:text-[#8b839e]"
                                            }`}
                                            strokeWidth={isActive ? 2.5 : 1.8}
                                        />
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottomNavIndicator"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6F00FF] dark:bg-[#8B2FFF]"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] font-medium transition-colors duration-200 ${
                                            isActive
                                                ? "text-[#6F00FF] dark:text-[#8B2FFF]"
                                                : "text-[#7c7591] dark:text-[#8b839e]"
                                        }`}
                                    >
                                        {tab.label}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
