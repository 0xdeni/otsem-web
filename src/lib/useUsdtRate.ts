import { useEffect, useState } from "react";

export function useUsdtRate() {
    const [buyRate, setBuyRate] = useState<number | null>(null);
    const [sellRate, setSellRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState(Date.now());

    async function fetchRate() {
        setLoading(true);
        try {
            // Use relative URL to go through Next.js rewrites
            const res = await fetch(`/public/quote`);
            const data = await res.json();
            setBuyRate(data.buyRate ?? null);
            setSellRate(data.sellRate ?? null);
            setUpdatedAt(Date.now());
        } catch {
            setBuyRate(null);
            setSellRate(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRate();
        const interval = setInterval(fetchRate, 15000);
        return () => clearInterval(interval);
    }, []);

    return { buyRate, sellRate, loading, updatedAt };
}
