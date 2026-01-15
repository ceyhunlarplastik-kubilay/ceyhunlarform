"use client";

import Image from "next/image";

export const WelcomeSection = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 py-6 md:py-8">
      {/* Logo ve Başlık Grubu */}
      <div className="text-center mb-6 md:mb-8">
        {/* Logo */}
        <div className="mb-4 md:mb-5">
          <div
            className="relative w-full max-w-xs md:max-w-md lg:max-w-lg mx-auto"
            style={{ aspectRatio: "1470/341" }}
          >
            <Image
              src="/ceyhunlar.png"
              alt="Ceyhunlar Plastik Logo"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>

        {/* Ana Başlık */}
        <h1 className="text-xl md:text-2xl lg:text-2xl font-bold text-zinc-800 dark:text-white mb-1">
          {/* Ceyhunlar Plastik */}
          CEYHUNLAR PLASTİK SANAYİ VE TİCARET LİMİTED ŞİRKETİ
        </h1>

        {/* Alt Başlık - Altın rengi ve çizgiler */}
        <div className="flex items-center justify-center space-x-2 mb-2 md:mb-3">
          <div className="w-8 md:w-10 h-px bg-[#ccb36e]/50"></div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-[#ccb36e] dark:text-[#ccb36e]">
            Numune Talep Formu
          </h2>
          <div className="w-8 md:w-10 h-px bg-[#ccb36e]/50"></div>
        </div>
      </div>

      <div className="max-w-md text-sm text-gray-500">
        <p>
          Lütfen numune talebinizi oluşturmak için aşağıdaki adımları takip
          ediniz.
        </p>
      </div>
    </div>
  );
};
