import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sector, ProductionGroup, Product, ProductAssignment } from "@/models/index";
import { requireAdmin } from "@/lib/auth";

export async function DELETE() {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        await connectDB();

        // Delete in order of dependency if needed, though simpler to just wipe all
        // Assignments depend on Product, Sector, Group
        // Groups depend on Sector

        const deletedAssignments = await ProductAssignment.deleteMany({});
        const deletedProducts = await Product.deleteMany({});
        const deletedGroups = await ProductionGroup.deleteMany({});
        const deletedSectors = await Sector.deleteMany({});

        return NextResponse.json({
            message: "Catalog data reset successful",
            deletedCounts: {
                assignments: deletedAssignments.deletedCount,
                products: deletedProducts.deletedCount,
                groups: deletedGroups.deletedCount,
                sectors: deletedSectors.deletedCount,
            }
        });
    } catch (error: any) {
        console.error("Catalog Reset Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
