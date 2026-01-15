import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product, ProductAssignment } from "@/models/index";

export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get("groupId");

        if (!groupId) {
            return NextResponse.json(
                { error: "groupId query param required" },
                { status: 400 }
            );
        }

        // pivot table üzerinden ilgili productId'leri çekiyoruz
        const assignments = await ProductAssignment.find({ productionGroupId: groupId })
            .select("productId")
            .lean();

        const productIds = assignments.map((a) => a.productId);

        const products = await Product.find({ _id: { $in: productIds } })
            .sort({ name: 1 })
            .lean();

        // Frontend expects productId field, map _id to productId
        const mappedProducts = products.map((p) => ({
            ...p,
            productId: p._id.toString(),
        }));

        return NextResponse.json(mappedProducts);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
