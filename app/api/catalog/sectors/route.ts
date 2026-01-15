import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sector } from "@/models/index";

export async function GET() {
    try {
        await connectDB();

        const sectors = await Sector.find().sort({ name: 1 }).lean();

        return NextResponse.json(sectors);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
