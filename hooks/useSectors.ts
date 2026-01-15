"use client";

import { useQuery } from "@tanstack/react-query";

interface Sector {
    _id: string;
    name: string;
}

export function useSectors() {
    return useQuery({
        queryKey: ["sectors"],
        queryFn: async (): Promise<Sector[]> => {
            const res = await fetch("/api/sectors");
            if (!res.ok) throw new Error("Sektörler alınamadı");
            return res.json();
        },
        staleTime: 1000 * 60 * 5, // 5 dakika
    });
}
