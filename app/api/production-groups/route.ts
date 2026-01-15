import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductionGroup, ProductAssignment } from "@/models/index";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const sectorId = searchParams.get("sectorId");

        const query = sectorId ? { sectorId } : {};

        const groups = await ProductionGroup.find(query)
            .sort({ name: 1 })
            .populate("sectorId", "name"); // Populate sector name for convenience

        return NextResponse.json(groups);
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
        const { name, sectorId } = body;

        if (!name || !sectorId) {
            return NextResponse.json(
                { error: "Name and Sector ID are required" },
                { status: 400 }
            );
        }

        const existingGroup = await ProductionGroup.findOne({ name, sectorId });
        if (existingGroup) {
            return NextResponse.json(
                { error: "Production Group already exists in this sector" },
                { status: 400 }
            );
        }

        const group = await ProductionGroup.create({ name, sectorId });
        return NextResponse.json(group, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await connectDB();
        const body = await req.json();
        const { id, name, sectorId } = body;

        if (!id) {
            return NextResponse.json(
                { error: "ID is required" },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (sectorId) updateData.sectorId = sectorId;

        const group = await ProductionGroup.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!group) {
            return NextResponse.json(
                { error: "Production Group not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(group);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID is required" },
                { status: 400 }
            );
        }

        // ✅ ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Geçersiz ProductionGroup ID" },
                { status: 400 }
            );
        }

        // ✅ Check active product assignments
        const assignmentCount = await ProductAssignment.countDocuments({
            productionGroupId: id,
        });

        if (assignmentCount > 0) {
            return NextResponse.json(
                {
                    error: "Bu üretim grubuna bağlı ürünler var.",
                    details: {
                        assignedProductCount: assignmentCount,
                        action: "Önce bu gruba bağlı ürünleri veya atamaları kaldırmalısınız.",
                    },
                },
                { status: 409 }
            );
        }

        const group = await ProductionGroup.findByIdAndDelete(id);

        if (!group) {
            return NextResponse.json(
                { error: "Production Group not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Production Group deleted successfully",
        });
    } catch (error: any) {
        console.error("ProductionGroup DELETE Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

