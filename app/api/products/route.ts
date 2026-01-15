import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product, ProductAssignment, Request } from "@/models/index";
import { requireAdmin } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const productIdParam = searchParams.get("productId");
        const search = searchParams.get("search");
        const sectorId = searchParams.get("sectorId");
        const productionGroupId = searchParams.get("productionGroupId");

        // 1. If productId param exists, return specific product(s) (existing logic)
        if (productIdParam) {
            const productIds = productIdParam.split(",").map((id) => id.trim());
            if (productIds.length === 1) {
                const product = await Product.findById(productIds[0]).lean();
                if (!product) {
                    return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
                }
                return NextResponse.json(product);
            }
            const products = await Product.find({ _id: { $in: productIds } }).lean();
            return NextResponse.json(products);
        }

        // 2. Build Filter Query
        let productIdsFromAssignments: string[] | null = null;

        // If filtering by sector or group, we need to check assignments first
        if (sectorId || productionGroupId) {
            const assignmentQuery: any = {};
            if (sectorId && sectorId !== "all") assignmentQuery.sectorId = sectorId;
            if (productionGroupId && productionGroupId !== "all") assignmentQuery.productionGroupId = productionGroupId;

            const assignments = await ProductAssignment.find(assignmentQuery).select("productId").lean();
            productIdsFromAssignments = assignments.map((a: any) => a.productId.toString());

            // If no assignments found for filter, return empty early
            if (productIdsFromAssignments.length === 0) {
                return NextResponse.json([]);
            }
        }

        // 3. Build Product Query
        const productQuery: any = {};

        // Name search
        if (search) {
            productQuery.name = { $regex: search, $options: "i" };
        }

        // Filter by IDs if assignments restricted them
        if (productIdsFromAssignments !== null) {
            productQuery._id = { $in: productIdsFromAssignments };
        }

        // 4. Fetch Products
        // 4. Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const total = await Product.countDocuments(productQuery);
        const products = await Product.find(productQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json({
            items: products,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error("Products API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

/* -------------------------------------------------------------------------- */
/*                                   POST                                     */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        await connectDB();

        const body = await req.json();
        const { name, description, imageUrl, assignments } = body;

        // Validation
        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Ürün adı zorunludur" },
                { status: 400 }
            );
        }

        // assignments: [{ sectorId, productionGroupId }]
        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return NextResponse.json(
                { error: "En az bir sektör ve üretim grubu seçilmelidir" },
                { status: 400 }
            );
        }

        // Check for duplicate product name
        const existingProduct = await Product.findOne({ name: name.trim() });
        if (existingProduct) {
            return NextResponse.json(
                { error: "Bu isimde bir ürün zaten mevcut" },
                { status: 409 }
            );
        }

        // 1) Create Product
        const newProduct = await Product.create({
            name: name.trim(),
            description: description?.trim() || "",
            imageUrl: imageUrl?.trim() || "", // TODO: S3 integration
        });

        // 2) Create ProductAssignments
        const assignmentDocs = assignments.map((a: any) => ({
            productId: newProduct._id,
            productionGroupId: a.productionGroupId,
            sectorId: a.sectorId,
        }));

        await ProductAssignment.insertMany(assignmentDocs);

        return NextResponse.json(
            { success: true, product: newProduct, assignmentsCreated: assignmentDocs.length },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Product POST Error:", error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "Bu ürün zaten mevcut" },
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
/*                                    PUT                                     */
/* -------------------------------------------------------------------------- */

export async function PUT(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        await connectDB();

        const body = await req.json();
        const { productId, name, description, imageUrl, assignments } = body;

        if (!productId) {
            return NextResponse.json(
                { error: "productId zorunludur" },
                { status: 400 }
            );
        }

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        // Update product fields
        if (name !== undefined) product.name = name.trim();
        if (description !== undefined) product.description = description.trim();
        if (imageUrl !== undefined) product.imageUrl = imageUrl.trim(); // TODO: S3 integration

        await product.save();

        // If assignments are provided, update them
        if (assignments && Array.isArray(assignments)) {
            // Delete existing assignments
            await ProductAssignment.deleteMany({ productId });

            // Create new assignments
            if (assignments.length > 0) {
                const assignmentDocs = assignments.map((a: any) => ({
                    productId: product._id,
                    productionGroupId: a.productionGroupId,
                    sectorId: a.sectorId,
                }));

                await ProductAssignment.insertMany(assignmentDocs);
            }
        }

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error("Product PUT Error:", error);

        if (error.code === 11000) {
            return NextResponse.json(
                { error: "Bu isimde bir ürün zaten mevcut" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json(
                { error: "productId query param zorunludur" },
                { status: 400 }
            );
        }

        // ✅ ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return NextResponse.json(
                { error: "Invalid productId" },
                { status: 400 }
            );
        }

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        // 1) Cascade delete: ProductAssignments
        const assignmentResult = await ProductAssignment.deleteMany({ productId });

        // 2) (Opsiyonel) Request içinde productId null'la
        // ❗ Zorunlu değil, istersen tamamen kaldırabilirsin
        await Request.updateMany(
            { "products.productId": productId },
            { $set: { "products.$[p].productId": null } },
            { arrayFilters: [{ "p.productId": productId }] }
        );

        // 3) Delete product
        await Product.findByIdAndDelete(productId);

        return NextResponse.json({
            success: true,
            message: "Ürün silindi",
            details: {
                removedAssignments: assignmentResult.deletedCount,
            },
        });
    } catch (error) {
        console.error("Product DELETE Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

