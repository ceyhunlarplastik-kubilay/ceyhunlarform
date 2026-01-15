import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Request, Sector, Product, ProductionGroup } from "@/models";

const LIMIT = 10;

export async function GET(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        const page = Number(searchParams.get("page")) || 1;
        const search = searchParams.get("search")?.trim() || "";
        const sector = searchParams.get("sector");
        const productionGroup = searchParams.get("productionGroup");
        const province = searchParams.get("province")?.trim() || "";
        const district = searchParams.get("district")?.trim() || "";

        const skip = (page - 1) * LIMIT;

        // const filter: any = {};
        const filter: any = {
            ...(province && { province }),
            ...(district && { district }),
            ...(sector && sector !== "all" && { sectorId: sector }),
            ...(productionGroup && { productionGroupIds: productionGroup }),
        };

        /* -------------------------------------------------------
           SEARCH MODE (pagination yok)
        ------------------------------------------------------- */
        if (search) {
            const regex = new RegExp(search, "i");

            const items = await Request.find(filter)
                .sort({ createdAt: -1 })
                .lean();

            const customers = await Promise.all(
                items.map(async (req) => {
                    const sector = req.sectorId
                        ? await Sector.findById(req.sectorId).lean()
                        : null;

                    const productIds =
                        req.products?.map((p: any) => p.productId) || [];
                    const groupIds =
                        req.products?.map((p: any) => p.productionGroupId) || [];

                    const products = await Product.find({
                        _id: { $in: productIds },
                    }).lean();

                    const groups = await ProductionGroup.find({
                        _id: { $in: groupIds },
                    }).lean();

                    const combined = [
                        req.companyName,
                        req.firstName,
                        req.lastName,
                        req.email,
                        req.phone,
                        req.province,
                        req.district,
                        req.address,
                        sector?.name,
                        ...products.map((p) => p.name),
                        ...groups.map((g) => g.name),
                    ]
                        .filter(Boolean)
                        .join(" ");

                    if (!regex.test(combined)) return null;

                    return {
                        mongoId: req._id.toString(),
                        id: req._id.toString().slice(-6),
                        tarih: new Date(req.createdAt).toLocaleString("tr-TR"),
                        companyName: req.companyName,
                        firstName: req.firstName,
                        lastName: req.lastName,
                        email: req.email,
                        phone: req.phone,
                        province: req.province || "",
                        district: req.district || "",
                        address: req.address,
                        sector: sector?.name || "",
                        productionGroups: groups.map((g) => g.name).join(", "),
                        products: products.map((p) => p.name).join(", "),
                        status: req.status || "pending",
                    };
                })
            );

            const filtered = customers.filter(Boolean);

            return NextResponse.json({
                customers: filtered,
                pagination: {
                    total: filtered.length,
                    page: 1,
                    limit: filtered.length,
                    totalPages: 1,
                },
            });
        }

        /* -------------------------------------------------------
           PAGINATED LIST MODE
        ------------------------------------------------------- */

        const total = await Request.countDocuments(filter);

        const items = await Request.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(LIMIT)
            .lean();

        const customers = await Promise.all(
            items.map(async (req) => {
                const sector = req.sectorId
                    ? await Sector.findById(req.sectorId).lean()
                    : null;

                const productIds =
                    req.products?.map((p: any) => p.productId) || [];
                const groupIds =
                    req.products?.map((p: any) => p.productionGroupId) || [];

                const products = await Product.find({
                    _id: { $in: productIds },
                }).lean();

                const groups = await ProductionGroup.find({
                    _id: { $in: groupIds },
                }).lean();

                return {
                    mongoId: req._id.toString(),
                    id: req._id.toString().slice(-6),
                    tarih: new Date(req.createdAt).toLocaleString("tr-TR"),
                    companyName: req.companyName,
                    firstName: req.firstName,
                    lastName: req.lastName,
                    email: req.email,
                    phone: req.phone,
                    province: req.province || "",
                    district: req.district || "",
                    address: req.address,
                    sector: sector?.name || "",
                    productionGroups: groups.map((g) => g.name).join(", "),
                    products: products.map((p) => p.name).join(", "),
                    status: req.status || "pending",
                };
            })
        );

        return NextResponse.json({
            customers,
            pagination: {
                total,
                page,
                limit: LIMIT,
                totalPages: Math.ceil(total / LIMIT),
            },
        });
    } catch (error) {
        console.error("Customers API Error:", error);
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
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Missing id parameter" },
                { status: 400 }
            );
        }

        const deleted = await Request.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            deletedId: id,
        });
    } catch (error) {
        console.error("DELETE /api/customers error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
