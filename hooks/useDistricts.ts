import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useDistricts = (province?: string) =>
  useQuery({
    queryKey: ["districts", province],
    enabled: !!province,
    queryFn: async () => {
      const res = await axios.get("/api/districts", {
        params: { province },
      });
      return res.data as { id: number; name: string }[];
    },
  });
