"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import http from "@/lib/http";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUiModals } from "@/stores/ui-modals";

type WalletType = {
    id: string;
    network: string;
    currency: string;
    externalAddress: string;
    label?: string;
    isMain?: boolean;
};

function getNetworkLabel(network?: string) {
    if (network === "TRON") return "Tron (TRC20)";
    if (network === "SOLANA") return "Solana (SPL)";
    if (network === "ETHEREUM") return "Ethereum (ERC20)";
    if (network === "BITCOIN") return "Bitcoin";
    return network || "Rede";
}

export default function ReceiveUsdtModal() {
    const { open, closeModal } = useUiModals();
    const isOpen = open.receiveUsdt;
    const [wallets, setWallets] = React.useState<WalletType[]>([]);
    const [selectedWalletId, setSelectedWalletId] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const usdtWallets = React.useMemo(
        () => wallets.filter((wallet) => wallet.currency?.toUpperCase() === "USDT"),
        [wallets]
    );
    const selectedWallet = usdtWallets.find((wallet) => wallet.id === selectedWalletId) || usdtWallets[0] || null;
    const address = selectedWallet?.externalAddress || "";

    React.useEffect(() => {
        if (!isOpen) return;
        void fetchWallets();
    }, [isOpen]);

    React.useEffect(() => {
        if (!usdtWallets.length) {
            setSelectedWalletId("");
            return;
        }
        const stillExists = usdtWallets.some((wallet) => wallet.id === selectedWalletId);
        if (stillExists) return;
        const mainWallet = usdtWallets.find((wallet) => wallet.isMain);
        setSelectedWalletId(mainWallet?.id || usdtWallets[0].id);
    }, [usdtWallets, selectedWalletId]);

    async function fetchWallets() {
        setLoading(true);
        try {
            const res = await http.get<WalletType[]>("/wallet");
            setWallets(res.data || []);
        } catch {
            setWallets([]);
            toast.error("Não foi possível carregar suas carteiras");
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy() {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        toast.success("Endereço copiado!");
    }

    return (
        <BottomSheet open={isOpen} onOpenChange={(v) => (!v ? closeModal("receiveUsdt") : null)}>
            <BottomSheetContent>
                <BottomSheetHeader>
                    <BottomSheetTitle>Receber USDT</BottomSheetTitle>
                </BottomSheetHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#6F00FF]" />
                    </div>
                ) : usdtWallets.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                        Nenhuma carteira USDT encontrada. Crie ou importe uma carteira USDT para receber.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <div>
                            <Label className="mb-2 block text-xs text-white/70">Carteira USDT</Label>
                            <select
                                value={selectedWallet?.id || ""}
                                onChange={(e) => setSelectedWalletId(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
                            >
                                {usdtWallets.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.label || "Carteira USDT"} • {getNetworkLabel(wallet.network)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="text-xs text-white/60">
                            Rede: {getNetworkLabel(selectedWallet?.network)}
                        </p>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white break-all">
                            {address}
                        </div>

                        <div className="flex justify-center rounded-xl border border-white/10 bg-white/5 p-4">
                            <QRCodeSVG value={address} size={170} bgColor="#00000000" fgColor="#ffffff" />
                        </div>
                    </div>
                )}

                <BottomSheetFooter className="gap-2">
                    <Button variant="outline" onClick={handleCopy} disabled={!address} className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50">
                        Copiar
                    </Button>
                    <Button onClick={() => closeModal("receiveUsdt")} className="bg-[#6F00FF] hover:bg-[#5800CC] text-white">Fechar</Button>
                </BottomSheetFooter>
            </BottomSheetContent>
        </BottomSheet>
    );
}
