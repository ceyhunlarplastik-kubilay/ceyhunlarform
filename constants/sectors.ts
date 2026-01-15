export const sectors = [
    {
        name: "Mobilya",
        image: "/furniture.jpg"
    },
    {
        name: "Spor Aletleri",
        image: "/gym.jpg"
    },
    {
        name: "Makine Sanayi",
        image: "/machine.jpg"
    },
    {
        name: "Dış Mekan",
        image: "/outdoor.jpg"
    },
    {
        name: "Raf ve Stant",
        image: "/shelf.jpg"
    },
    {
        name: "Sahne ve Müzik",
        image: "/stage.jpg"
    },
    {
        name: "Ev Ürünleri",
        image: "/home.jpg"
    },
    {
        name: "Endüstriyel Mutfak",
        image: "/kitchen.jpg"
    },
    {
        name: "Medikal",
        image: "/medical.jpg"
    }
];

// Yardımcı fonksiyon: Sektör adına göre görsel path'i bulma
export const getSectorImage = (sectorName: string): string => {
    const sector = sectors.find(s => s.name === sectorName);
    return sector?.image || "/default.jpg"; // fallback görsel
};

// Sektör isimlerini array olarak alma
export const sectorNames = sectors.map(s => s.name);