"use client";

import { useQuery } from "@tanstack/react-query";

interface ProductionGroup {
    _id: string;
    name: string;
    sectorId: {
        _id: string;
        name: string;
    };
}

export function useProductionGroups(sectorId?: string) {
    return useQuery({
        queryKey: ["production-groups", sectorId],
        queryFn: async (): Promise<ProductionGroup[]> => {
            const params = new URLSearchParams();
            if (sectorId && sectorId !== "all") {
                params.append("sectorId", sectorId);
            }

            const res = await fetch(`/api/production-groups?${params.toString()}`);
            if (!res.ok) throw new Error("Üretim grupları alınamadı");
            return res.json();
        },
        enabled: true, // Her zaman çalışabilir, sectorId opsiyonel
        staleTime: 1000 * 60 * 5, // 5 dakika
    });
}
