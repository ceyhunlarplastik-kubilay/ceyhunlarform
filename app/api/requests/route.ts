import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
    Request,
    ProductAssignment,
    Sector,
    Product,
    ProductionGroup,
} from "@/models/index";
import { getGoogleSheets } from "@/lib/googleSheets";
import SampleRequestEmail from "@/emails/SampleRequestEmail";
import { sendMail } from "@/lib/mail/sendEmail";
import { render } from "@react-email/components";

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        const {
            companyName,
            firstName,
            lastName,
            email,
            phone,
            address,
            sectorId,
            products, // [{ productId, productionGroupId }]
        } = body;

        /* ------------------------------------------------------------------ */
        /* Basic validation                                                    */
        /* ------------------------------------------------------------------ */

        if (!companyName || !email || !phone || !products?.length) {
            return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
        }

        /* ------------------------------------------------------------------ */
        /* productionGroupIds derive                                           */
        /* ------------------------------------------------------------------ */

        const productionGroupIds = [
            ...new Set(products.map((p: any) => p.productionGroupId)),
        ];

        /* ------------------------------------------------------------------ */
        /* 1) Doğrulama: ProductAssignment                                     */
        /* ------------------------------------------------------------------ */

        for (const item of products) {
            const match = await ProductAssignment.findOne({
                productId: item.productId,
                productionGroupId: item.productionGroupId,
                ...(sectorId && { sectorId }),
            });

            if (!match) {
                return NextResponse.json(
                    {
                        error: `Ürün (${item.productId}) ile üretim grubu (${item.productionGroupId}) eşleşmesi hatalı`,
                    },
                    { status: 400 }
                );
            }
        }

        /* ------------------------------------------------------------------ */
        /* 2) Snapshot için gerekli dokümanları çek                            */
        /* ------------------------------------------------------------------ */

        const productIds = products.map((p: any) => p.productId);
        const groupIds = products.map((p: any) => p.productionGroupId);

        const productDocs = await Product.find({ _id: { $in: productIds } })
            .select("_id name")
            .lean();

        const groupDocs = await ProductionGroup.find({
            _id: { $in: groupIds },
        })
            .select("_id name")
            .lean();

        const productMap = new Map(
            productDocs.map((p) => [p._id.toString(), p])
        );

        const groupMap = new Map(
            groupDocs.map((g) => [g._id.toString(), g])
        );

        /* ------------------------------------------------------------------ */
        /* 3) Snapshot’lı products array oluştur                               */
        /* ------------------------------------------------------------------ */

        const snapshotProducts = products.map((item: any) => {
            const product = productMap.get(item.productId);
            const group = groupMap.get(item.productionGroupId);

            if (!product || !group) {
                throw new Error("Ürün veya üretim grubu bulunamadı");
            }

            return {
                productId: product._id,
                productName: product.name,
                productionGroupId: group._id,
                productionGroupName: group.name,
            };
        });

        /* ------------------------------------------------------------------ */
        /* 4) Request oluştur                                                  */
        /* ------------------------------------------------------------------ */

        const newRequest = await Request.create({
            companyName,
            firstName,
            lastName,
            email,
            phone,
            address,
            sectorId: sectorId || null,
            productionGroupIds,
            products: snapshotProducts,
            status: "pending",
            statusHistory: [
                {
                    status: "pending",
                    note: "Talep oluşturuldu",
                    timestamp: new Date(),
                },
            ],
        });

        /* ------------------------------------------------------------------ */
        /* 5) Google Sheets & Email için isimler                               */
        /* ------------------------------------------------------------------ */

        const sectorDoc = sectorId
            ? await Sector.findById(sectorId).select("name").lean()
            : null;

        const sectorName = sectorDoc?.name || "Diğerleri";
        // @ts-ignore
        const productNames = snapshotProducts.map((p: any) => p.productName).join(", ");
        // @ts-ignore
        const groupNames = snapshotProducts
            .map((p: any) => p.productionGroupName)
            .join(", ");

        const fullName = [firstName, lastName].filter(Boolean).join(" ") || "-";
        const dateStr = new Date().toLocaleString("tr-TR");

        /* ------------------------------------------------------------------ */
        /* 6) Google Sheets                                                    */
        /* ------------------------------------------------------------------ */

        try {
            const { sheets, spreadsheetId } = await getGoogleSheets();
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "Response!A:K",
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [
                        [
                            dateStr,
                            companyName,
                            firstName || "-",
                            lastName || "-",
                            email,
                            phone,
                            address || "-",
                            sectorName,
                            groupNames,
                            productNames,
                            newRequest._id.toString(),
                        ],
                    ],
                },
            });
        } catch (sheetError) {
            console.error("Google Sheets hatası:", sheetError);
        }

        /* ------------------------------------------------------------------ */
        /* 7) Email                                                            */
        /* ------------------------------------------------------------------ */

        try {
            const emailHtml = await render(
                SampleRequestEmail({
                    companyName,
                    fullName,
                    email,
                    phone,
                    address: address || "-",
                    sector: sectorName,
                    productionGroup: groupNames,
                    products: productNames,
                    date: dateStr,
                })
            );

            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await sendMail({
                    to: adminEmail,
                    subject: `Yeni Numune Talebi: ${companyName}`,
                    html: emailHtml,
                });
            }
        } catch (mailError) {
            console.error("Email hatası:", mailError);
        }

        return NextResponse.json(
            { success: true, data: newRequest },
            { status: 201 }
        );
    } catch (error) {
        console.error("Submission Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}


export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, status, note } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: "ID and status are required" },
                { status: 400 }
            );
        }

        const validStatuses = [
            "pending",
            "review",
            "approved",
            "preparing",
            "shipped",
            "delivered",
            "completed",
            "cancelled",
        ];

        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const request = await Request.findById(id);

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        request.status = status;
        request.statusHistory.push({
            status,
            note: note || "",
            timestamp: new Date(),
        });

        await request.save();

        return NextResponse.json({ success: true, data: request });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
