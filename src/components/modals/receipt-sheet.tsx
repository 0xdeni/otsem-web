"use client";

import * as React from "react";
import {
    BottomSheet,
    BottomSheetContent,
    BottomSheetHeader,
    BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import {
    Loader2,
    XCircle,
    Download,
    Share2,
    CheckCircle2,
} from "lucide-react";
import http from "@/lib/http";
import type { TransactionReceipt } from "@/types/transaction";

function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    });
}

function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

type Props = {
    transactionId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ReceiptSheet({ transactionId, open, onOpenChange }: Props) {
    const [receipt, setReceipt] = React.useState<TransactionReceipt | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const receiptRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open || !transactionId) {
            setReceipt(null);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        http.get<TransactionReceipt>(`/transactions/${transactionId}/receipt`)
            .then((res) => {
                if (!cancelled) setReceipt(res.data);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Error fetching receipt:", err);
                    setError("Não foi possível carregar o comprovante.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, transactionId]);

    async function handleShare() {
        if (!receipt) return;

        const text = buildReceiptText(receipt);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: receipt.title,
                    text,
                });
            } catch {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(text);
            // Rely on component re-rendering isn't needed, just a simple feedback
        }
    }

    async function handleDownload() {
        if (!receipt) return;

        const text = buildReceiptText(receipt);
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `comprovante-${receipt.transactionId.slice(0, 8)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
            <BottomSheetContent className="dark:bg-[#1a1025]/98">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#6F00FF]" />
                        <p className="text-[13px] text-muted-foreground mt-4">
                            Carregando comprovante...
                        </p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <XCircle className="h-8 w-8 text-red-400" />
                        <p className="text-[13px] text-muted-foreground mt-4">{error}</p>
                    </div>
                )}

                {receipt && !loading && (
                    <>
                        <BottomSheetHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <BottomSheetTitle>{receipt.title}</BottomSheetTitle>
                            </div>
                        </BottomSheetHeader>

                        {/* Receipt card */}
                        <div
                            ref={receiptRef}
                            className="rounded-2xl border border-border/40 bg-card/50 p-5 space-y-4"
                        >
                            {/* Amount */}
                            <div className="text-center pb-4 border-b border-border/30">
                                <p className="text-[28px] font-bold text-foreground leading-none">
                                    {formatCurrency(receipt.amount)}
                                </p>
                                <p className="text-[12px] text-muted-foreground mt-1.5">
                                    {formatDateTime(receipt.date)}
                                </p>
                                {receipt.completionDate && receipt.completionDate !== receipt.date && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Concluído em {formatDateTime(receipt.completionDate)}
                                    </p>
                                )}
                            </div>

                            {/* Payer */}
                            <ReceiptSection title="Pagador">
                                <ReceiptRow label="Nome" value={receipt.payer.name} />
                                <ReceiptRow label="CPF/CNPJ" value={receipt.payer.maskedTaxNumber} />
                                {receipt.payer.pixKey && (
                                    <ReceiptRow label="Chave PIX" value={receipt.payer.pixKey} />
                                )}
                                {receipt.payer.bankCode && (
                                    <ReceiptRow label="Banco" value={receipt.payer.bankCode} />
                                )}
                            </ReceiptSection>

                            {/* Receiver */}
                            <ReceiptSection title="Recebedor">
                                <ReceiptRow label="Nome" value={receipt.receiver.name} />
                                <ReceiptRow label="CPF/CNPJ" value={receipt.receiver.maskedTaxNumber} />
                                {receipt.receiver.pixKey && (
                                    <ReceiptRow label="Chave PIX" value={receipt.receiver.pixKey} />
                                )}
                                {receipt.receiver.bankCode && (
                                    <ReceiptRow label="Banco" value={receipt.receiver.bankCode} />
                                )}
                            </ReceiptSection>

                            {/* IDs */}
                            <ReceiptSection title="Identificação">
                                <ReceiptRow
                                    label="ID"
                                    value={truncateId(receipt.transactionId)}
                                />
                                {receipt.endToEndId && (
                                    <ReceiptRow
                                        label="End-to-End"
                                        value={truncateId(receipt.endToEndId)}
                                    />
                                )}
                                {receipt.txid && (
                                    <ReceiptRow label="TxID" value={truncateId(receipt.txid)} />
                                )}
                                {receipt.bankProvider && (
                                    <ReceiptRow label="Provedor" value={receipt.bankProvider} />
                                )}
                            </ReceiptSection>

                            {/* Payer message */}
                            {receipt.payerMessage && (
                                <ReceiptSection title="Mensagem">
                                    <p className="text-[13px] text-foreground">
                                        {receipt.payerMessage}
                                    </p>
                                </ReceiptSection>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mt-5 mb-2">
                            <button
                                onClick={handleShare}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border/50 bg-card/30 text-foreground font-semibold text-[14px] active:bg-card/60 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                Compartilhar
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#6F00FF] text-white font-semibold text-[14px] active:bg-[#5800CC] transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Salvar
                            </button>
                        </div>
                    </>
                )}
            </BottomSheetContent>
        </BottomSheet>
    );
}

// ─── Sub-components ──────────────────────────────────────

function ReceiptSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="pt-3 border-t border-border/30 first:border-t-0 first:pt-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {title}
            </p>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">{label}</span>
            <span className="text-[12px] font-medium text-foreground text-right max-w-[60%] truncate">
                {value}
            </span>
        </div>
    );
}

function truncateId(id: string): string {
    if (id.length <= 16) return id;
    return `${id.slice(0, 8)}...${id.slice(-8)}`;
}

function buildReceiptText(receipt: TransactionReceipt): string {
    const lines: string[] = [
        receipt.title,
        "═".repeat(40),
        "",
        `Valor: ${formatCurrency(receipt.amount)}`,
        `Data: ${formatDateTime(receipt.date)}`,
    ];

    if (receipt.completionDate) {
        lines.push(`Concluído em: ${formatDateTime(receipt.completionDate)}`);
    }

    lines.push("", "── Pagador ──");
    lines.push(`Nome: ${receipt.payer.name}`);
    lines.push(`CPF/CNPJ: ${receipt.payer.maskedTaxNumber}`);
    if (receipt.payer.pixKey) lines.push(`Chave PIX: ${receipt.payer.pixKey}`);
    if (receipt.payer.bankCode) lines.push(`Banco: ${receipt.payer.bankCode}`);

    lines.push("", "── Recebedor ──");
    lines.push(`Nome: ${receipt.receiver.name}`);
    lines.push(`CPF/CNPJ: ${receipt.receiver.maskedTaxNumber}`);
    if (receipt.receiver.pixKey) lines.push(`Chave PIX: ${receipt.receiver.pixKey}`);
    if (receipt.receiver.bankCode) lines.push(`Banco: ${receipt.receiver.bankCode}`);

    lines.push("", "── Identificação ──");
    lines.push(`ID: ${receipt.transactionId}`);
    if (receipt.endToEndId) lines.push(`End-to-End: ${receipt.endToEndId}`);
    if (receipt.txid) lines.push(`TxID: ${receipt.txid}`);
    if (receipt.bankProvider) lines.push(`Provedor: ${receipt.bankProvider}`);

    if (receipt.payerMessage) {
        lines.push("", `Mensagem: ${receipt.payerMessage}`);
    }

    lines.push("", "═".repeat(40));
    lines.push("Otsem Pay");

    return lines.join("\n");
}
