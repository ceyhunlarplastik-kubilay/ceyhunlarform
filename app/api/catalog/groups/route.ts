import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductionGroup } from "@/models/index";

export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const sectorId = searchParams.get("sectorId");

        if (!sectorId) {
            return NextResponse.json(
                { error: "sectorId query param required" },
                { status: 400 }
            );
        }

        const groups = await ProductionGroup.find({ sectorId })
            .sort({ name: 1 })
            .lean();

        return NextResponse.json(groups);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
