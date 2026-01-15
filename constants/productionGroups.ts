export const sectors = [
    {
        name: "Bahçe Mobilyası",
        image: "/furniture.jpg"
    },
    {
        name: "Çocuk Odası",
        image: "/furniture.jpg"
    },
    {
        name: "Çocuk – Genç Grup",
        image: "/furniture.jpg"
    },
    {
        name: "Salon ve Oturma Odası",
        image: "/furniture.jpg"
    },
    {
        name: "Yemek Odası",
        image: "/furniture.jpg"
    },
    {
        name: "Yatak Odası (Yetişkin)",
        image: "/furniture.jpg"
    },
    {
        name: "Yatak Odası",
        image: "/furniture.jpg"
    },
    {
        name: "Mutfak Mobilyası",
        image: "/furniture.jpg"
    },
    {
        name: "Antre ve Hol",
        image: "/furniture.jpg"
    },
    {
        name: "Banyo Mobilyası",
        image: "/furniture.jpg"
    },
    {
        name: "Kamp Mobilyası",
        image: "/furniture.jpg"
    },
    {
        name: "Spor Aletleri",
        image: "/furniture.jpg"
    },
    {
        name: "Bisiklet ve Tekerlekli Sporlar",
        image: "/furniture.jpg"
    },
    {
        name: "Su Sporları ve Havuz",
        image: "/furniture.jpg"
    },
    {
        name: "Kış ve Dağ Sporları",
        image: "/furniture.jpg"
    },
    {
        name: "Stadyum ve Tesis Donanımı",
        image: "/furniture.jpg"
    },
    {
        name: "Rehabilitasyon ve Medikal Spor",
        image: "/furniture.jpg"
    },
    {
        name: "Makine Sanayi",
        image: "/furniture.jpg"
    },
    {
        name: "Dış Mekan ve Altyapı",
        image: "/furniture.jpg"
    },
    {
        name: "Raf ve Stant",
        image: "/furniture.jpg"
    },
    {
        name: "Sahne ve Müzik",
        image: "/furniture.jpg"
    },
    {
        name: "Ev Gereçleri",
        image: "/furniture.jpg"
    },
];

// Yardımcı fonksiyon: Üretim Grubu adına göre görsel path'i bulma
export const getProductionGroupImage = (productionGroupName: string): string => {
    const productionGroup = sectors.find(s => s.name === productionGroupName);
    return productionGroup?.image || "/default.jpg"; // fallback görsel
};

// Üretim Grubu isimlerini array olarak alma
export const productionGroupNames = sectors.map(s => s.name);