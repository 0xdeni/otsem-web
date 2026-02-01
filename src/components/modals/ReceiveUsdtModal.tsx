"use client";

import * as React from "react";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useUiModals } from "@/stores/ui-modals";
// opcional: npm i qrcode.react
// import { QRCode } from "react-qrcode-logo";

export default function ReceiveUsdtModal() {
    const { open, closeModal } = useUiModals();
    const address = "0xSEU_ENDERECO_USDT";

    return (
        <BottomSheet open={open.receiveUsdt} onOpenChange={(v) => (!v ? closeModal("receiveUsdt") : null)}>
            <BottomSheetContent>
                <BottomSheetHeader>
                    <BottomSheetTitle>Receber USDT</BottomSheetTitle>
                </BottomSheetHeader>

                <div className="grid gap-3">
                    <div className="rounded-xl border p-3 font-mono text-xs break-all">{address}</div>
                    {/* {<QRCode value={address} size={180} />} */}
                </div>

                <BottomSheetFooter className="gap-2">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(address)}>Copiar</Button>
                    <Button onClick={() => closeModal("receiveUsdt")}>Fechar</Button>
                </BottomSheetFooter>
            </BottomSheetContent>
        </BottomSheet>
    );
}
