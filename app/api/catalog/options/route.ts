import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sector, ProductionGroup, Product, ProductAssignment } from "@/models/index";

export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const sectorId = searchParams.get("sectorId");

        if (!sectorId) {
            return NextResponse.json(
                { error: "sectorId param is required" },
                { status: 400 }
            );
        }

        // 1) Sector bilgisi
        let sector = null;
        let groups = [];

        if (sectorId === "all") {
            // "Diğerleri" seçimi -> Tüm grupları getir
            groups = await ProductionGroup.find({}).sort({ name: 1 }).lean();
        } else {
            sector = await Sector.findById(sectorId).lean();
            if (!sector) {
                return NextResponse.json({ groups: [] });
            }
            // 2) Bu sektöre bağlı gruplar
            groups = await ProductionGroup.find({ sectorId }).sort({ name: 1 }).lean();
        }

        // 3) Her group'a bağlanmış ürünleri TEK query ile çek (N+1 yerine)
        const groupIds = groups.map((g) => g._id);

        // Tüm assignments'ları tek seferde çek
        const allAssignments = await ProductAssignment.find({
            productionGroupId: { $in: groupIds }
        })
            .select("productId productionGroupId")
            .lean();

        // Unique productId'leri çek
        const productIds = [...new Set(allAssignments.map((a) => a.productId.toString()))];

        // Tüm ürünleri tek seferde çek
        const allProducts = await Product.find({ _id: { $in: productIds } })
            .sort({ name: 1 })
            .lean();

        // productId -> Product map oluştur
        const productMap = new Map(allProducts.map((p) => [p._id.toString(), p]));

        // groupId -> productIds map oluştur
        const groupProductsMap = new Map<string, any[]>();
        for (const assignment of allAssignments) {
            const gId = assignment.productionGroupId.toString();
            const pId = assignment.productId.toString();
            const product = productMap.get(pId);

            if (product) {
                if (!groupProductsMap.has(gId)) {
                    groupProductsMap.set(gId, []);
                }
                groupProductsMap.get(gId)!.push({
                    productId: product._id.toString(),
                    name: product.name,
                    imageUrl: product.imageUrl || null,
                });
            }
        }

        // Final response oluştur
        const groupData = groups.map((group) => ({
            groupId: group._id.toString(),
            name: group.name,
            products: groupProductsMap.get(group._id.toString()) || [],
        }));

        return NextResponse.json({
            sectorId: sector?._id || "all",
            sectorName: sector?.name || "Tüm Sektörler",
            groups: groupData,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
