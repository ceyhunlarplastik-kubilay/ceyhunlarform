import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useProvinces = () =>
    useQuery({
        queryKey: ["provinces"],
        queryFn: async () => {
            const res = await axios.get("/api/provinces");
            return res.data as { id: number; name: string }[];
        },
        staleTime: 1000 * 60 * 60, // 1 saat
    });
