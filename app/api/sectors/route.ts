import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sector, ProductionGroup } from "@/models";
import { requireAdmin } from "@/lib/auth";


export async function GET() {
    try {
        await connectDB();
        const sectors = await Sector.find().sort({ createdAt: -1 });
        return NextResponse.json(sectors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await connectDB();
        const body = await req.json();
        console.log("👉 POST /api/sectors Body:", body);
        const { name, imageUrl } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Sector name is required" },
                { status: 400 }
            );
        }

        const existingSector = await Sector.findOne({ name });
        if (existingSector) {
            return NextResponse.json(
                { error: "Sector already exists" },
                { status: 400 }
            );
        }

        const sector = await Sector.create({ name, imageUrl });
        console.log("✅ Sector created:", sector);
        return NextResponse.json(sector, { status: 201 });
    } catch (error: any) {
        console.error("❌ POST /api/sectors Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await connectDB();
        const body = await req.json();
        console.log("👉 PUT /api/sectors Body:", body);
        const { id, name, imageUrl } = body;

        if (!id || !name) {
            return NextResponse.json(
                { error: "ID and name are required" },
                { status: 400 }
            );
        }

        const sector = await Sector.findByIdAndUpdate(
            id,
            { name, imageUrl },
            { new: true, runValidators: true }
        );

        console.log("✅ Sector updated:", sector);

        if (!sector) {
            return NextResponse.json(
                { error: "Sector not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(sector);
    } catch (error: any) {
        console.error("❌ PUT /api/sectors Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    console.log("👉 DELETE /api/sectors Request Received");
    try {
        const authError = await requireAdmin();
        if (authError) {
            console.log("❌ Admin auth failed");
            return authError;
        }

        await connectDB();
        console.log("✅ DB Connected");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        console.log("🆔 Received ID to delete:", id);

        if (!id) {
            return NextResponse.json(
                { error: "ID is required" },
                { status: 400 }
            );
        }

        // ✅ ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log("❌ Invalid ObjectId format:", id);
            return NextResponse.json(
                { error: "Invalid Sector ID" },
                { status: 400 }
            );
        }

        // ✅ Guard: bağlı production group var mı?
        console.log("🔍 Checking dependencies for sector:", id);
        const groupCount = await ProductionGroup.countDocuments({
            sectorId: id,
        });
        console.log("📊 Dependency count (ProductionGroups):", groupCount);

        if (groupCount > 0) {
            console.log("❌ Deletion blocked due to dependencies");
            return NextResponse.json(
                {
                    error: "Bu sektöre bağlı üretim grupları var.",
                    details: {
                        productionGroupCount: groupCount,
                        action: "Önce bu sektöre bağlı üretim gruplarını silmelisiniz.",
                    },
                },
                { status: 409 }
            );
        }

        console.log("🗑️ Attempting to delete sector from DB...");
        const sector = await Sector.findByIdAndDelete(id);

        if (!sector) {
            console.log("❌ Sector not found in DB");
            return NextResponse.json(
                { error: "Sector not found" },
                { status: 404 }
            );
        }

        console.log("✅ Sector deleted successfully:", sector);
        return NextResponse.json({
            success: true,
            message: "Sector deleted successfully",
        });
    } catch (error: any) {
        console.error("🔥 Sector DELETE CRITICAL ERROR:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

