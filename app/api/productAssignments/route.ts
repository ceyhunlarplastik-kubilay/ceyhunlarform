import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductAssignment } from "@/models/index"

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        const sectorId = searchParams.get("sectorId");
        const productionGroupId = searchParams.get("productionGroupId");
        const productId = searchParams.get("productId");

        const query: any = {};

        if (sectorId) query.sectorId = sectorId;
        if (productionGroupId) query.productionGroupId = productionGroupId;
        if (productId) query.productId = productId;

        const assignments = await ProductAssignment.find(query)
            .populate("sectorId", "name")
            .populate("productionGroupId", "name")
            .populate("productId", "name");

        return NextResponse.json({
            count: assignments.length,
            assignments,
        });
    } catch (error: any) {
        console.error("ProductAssignment GET Error:", error);
        return NextResponse.json(
            { error: "ProductAssignment fetch failed" },
            { status: 500 }
        );
    }
}

/* -------------------------------------------------------------------------- */
/*                                   POST                                     */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();
        const { productId, sectorId, productionGroupId } = body;

        // Validation
        if (!productId || !sectorId || !productionGroupId) {
            return NextResponse.json(
                { error: "productId, sectorId ve productionGroupId zorunludur" },
                { status: 400 }
            );
        }

        // Check if assignment already exists
        const existingAssignment = await ProductAssignment.findOne({
            productId,
            sectorId,
            productionGroupId,
        });

        if (existingAssignment) {
            return NextResponse.json(
                { error: "Bu ürün zaten bu sektör ve üretim grubuna atanmış" },
                { status: 409 }
            );
        }

        // Create new assignment
        const newAssignment = await ProductAssignment.create({
            productId,
            sectorId,
            productionGroupId,
        });

        return NextResponse.json(
            { success: true, assignment: newAssignment },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("ProductAssignment POST Error:", error);

        if (error.code === 11000) {
            return NextResponse.json(
                { error: "Bu atama zaten mevcut" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const assignmentId = searchParams.get("id");

        // Option 1: Delete by assignment ID
        if (assignmentId) {
            const result = await ProductAssignment.findByIdAndDelete(assignmentId);

            if (!result) {
                return NextResponse.json(
                    { error: "Assignment bulunamadı" },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, message: "Assignment silindi" });
        }

        // Option 2: Delete by productId + sectorId + productionGroupId
        const productId = searchParams.get("productId");
        const sectorId = searchParams.get("sectorId");
        const productionGroupId = searchParams.get("productionGroupId");

        if (productId && sectorId && productionGroupId) {
            const result = await ProductAssignment.findOneAndDelete({
                productId,
                sectorId,
                productionGroupId,
            });

            if (!result) {
                return NextResponse.json(
                    { error: "Assignment bulunamadı" },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, message: "Assignment silindi" });
        }

        return NextResponse.json(
            { error: "id veya (productId + sectorId + productionGroupId) zorunludur" },
            { status: 400 }
        );
    } catch (error) {
        console.error("ProductAssignment DELETE Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
