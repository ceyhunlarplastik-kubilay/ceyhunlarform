// app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: "Arama için en az 2 karakter giriniz." },
                { status: 400 }
            );
        }

        const products = await Product.find({
            name: { $regex: query, $options: "i" }, // case-insensitive
        })
            .limit(20)
            .lean();

        return NextResponse.json(products);
    } catch (error) {
        console.error("Product search error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
