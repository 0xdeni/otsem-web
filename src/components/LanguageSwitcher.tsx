"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES = [
    { code: "pt-BR", flag: "🇧🇷" },
    { code: "en",    flag: "🇺🇸" },
    { code: "es",    flag: "🇪🇸" },
    { code: "ru",    flag: "🇷🇺" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();
    const t = useTranslations("language");
    const router = useRouter();

    function switchLocale(next: string) {
        document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax;Secure`;
        router.refresh();
    }

    const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition hover:bg-white/10 focus:outline-none ${className ?? ""}`}
                    aria-label={t("label")}
                >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{current.flag}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
                {LOCALES.map((l) => (
                    <DropdownMenuItem
                        key={l.code}
                        onClick={() => switchLocale(l.code)}
                        className={locale === l.code ? "font-bold" : ""}
                    >
                        <span className="mr-2">{l.flag}</span>
                        {t(l.code)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
