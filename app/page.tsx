"use client";

import RequestForm3 from "@/components/RequestForm3";
import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const unauthorized = searchParams?.get("unauthorized");
    if (unauthorized) {
      toast.error("Yetkisiz Erişim", {
        description: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
      });
      // URL'yi temizle
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center 
      bg-gradient-to-b from-[#ccb36e]/10 via-white to-white 
      dark:from-[#ccb36e]/5 dark:via-zinc-900 dark:to-black
      py-2"
    >
      {/* Form Bileşeni */}
      <div
        className="
        w-full 
        max-w-7xl 
        px-1                   /* ⬅ Mobilde minimum boşluk */
        sm:px-3                /* ⬅ Tablet altı küçük ekran */
        md:px-4                /* ⬅ Tablet */
        lg:px-6                /* ⬅ Büyük ekran */
      "
      >
        <RequestForm3 />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Yükleniyor...</div>}>
      <HomeContent />
    </Suspense>
  );
}
