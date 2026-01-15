import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { google } from "googleapis";
import { Sector, ProductionGroup, Product, ProductAssignment, ImportLog } from "@/models/index";

export async function GET() {
    try {
        await connectDB();

        // Google Auth
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL!,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const range = "Data!A2:C";

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values || [];

        let inserted = {
            sectors: 0,
            groups: 0,
            products: 0,
            assignments: 0,
        };

        for (const row of rows) {
            ""
            const sectorName = row[0];
            const groupName = row[1];
            const productName = row[2];

            if (!sectorName || !groupName || !productName) continue;

            // 1) Sector
            let sector = await Sector.findOne({ name: sectorName });
            if (!sector) {
                sector = await Sector.create({ name: sectorName });
                inserted.sectors++;
            }

            // 2) Production Group
            let group = await ProductionGroup.findOne({
                name: groupName,
                sectorId: sector._id,
            });
            if (!group) {
                group = await ProductionGroup.create({
                    name: groupName,
                    sectorId: sector._id,
                });
                inserted.groups++;
            }

            // 3) Product
            let product = await Product.findOne({ name: productName });
            if (!product) {
                product = await Product.create({ name: productName });
                inserted.products++;
            }

            // 4) ProductAssignment
            try {
                await ProductAssignment.create({
                    sectorId: sector._id,
                    productionGroupId: group._id,
                    productId: product._id,
                });
                inserted.assignments++;
            } catch (e) {
                /* duplicate index — ignore */
            }
        }

        return NextResponse.json({
            message: "Normalized import completed",
            inserted,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/* -------------------------------------------------------------------------- */
/*                                   POST                                     */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    const startedAt = new Date();

    try {
        const body = await req.json().catch(() => ({}));
        const dryRun = body?.dryRun === true;

        await connectDB();



        /* -------------------------- GOOGLE AUTH -------------------------- */
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const range = "Data!A2:C";

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values || [];

        /* -------------------------- NORMALIZE DATA -------------------------- */

        const sectorSet = new Set<string>();
        const groupSet = new Set<string>();
        const productSet = new Set<string>();

        const normalizedRows: {
            sector: string;
            group: string;
            product: string;
        }[] = [];

        for (const row of rows) {
            const sector = row?.[0]?.trim();
            const group = row?.[1]?.trim();
            const product = row?.[2]?.trim();

            if (!sector || !group || !product) continue;

            sectorSet.add(sector);
            groupSet.add(`${sector}::${group}`);
            productSet.add(product);

            normalizedRows.push({ sector, group, product });
        }

        /* -------------------------- DRY RUN -------------------------- */

        if (dryRun) {
            return NextResponse.json({
                dryRun: true,
                rowCount: rows.length,
                unique: {
                    sectors: sectorSet.size,
                    groups: groupSet.size,
                    products: productSet.size,
                },
                samples: {
                    sectors: Array.from(sectorSet).slice(0, 5),
                    groups: Array.from(groupSet)
                        .slice(0, 5)
                        .map((g) => g.split("::")[1]),
                    products: Array.from(productSet).slice(0, 5),
                },
            });
        }

        /* -------------------------- REAL IMPORT -------------------------- */

        const inserted = {
            sectors: 0,
            groups: 0,
            products: 0,
            assignments: 0,
        };

        const sectorMap = new Map<string, any>();
        const groupMap = new Map<string, any>();
        const productMap = new Map<string, any>();

        /* ----------- SECTORS ----------- */
        for (const sectorName of sectorSet) {
            let sector = await Sector.findOne({ name: sectorName });
            if (!sector) {
                sector = await Sector.create({ name: sectorName });
                inserted.sectors++;
            }
            sectorMap.set(sectorName, sector);
        }

        /* ----------- GROUPS ----------- */
        for (const key of groupSet) {
            const [sectorName, groupName] = key.split("::");
            const sector = sectorMap.get(sectorName);

            let group = await ProductionGroup.findOne({
                name: groupName,
                sectorId: sector._id,
            });

            if (!group) {
                group = await ProductionGroup.create({
                    name: groupName,
                    sectorId: sector._id,
                });
                inserted.groups++;
            }

            groupMap.set(key, group);
        }

        /* ----------- PRODUCTS ----------- */
        for (const productName of productSet) {
            let product = await Product.findOne({ name: productName });
            if (!product) {
                product = await Product.create({ name: productName });
                inserted.products++;
            }
            productMap.set(productName, product);
        }

        /* ----------- ASSIGNMENTS ----------- */
        for (const row of normalizedRows) {
            const sector = sectorMap.get(row.sector);
            const group = groupMap.get(`${row.sector}::${row.group}`);
            const product = productMap.get(row.product);

            try {
                await ProductAssignment.create({
                    sectorId: sector._id,
                    productionGroupId: group._id,
                    productId: product._id,
                });
                inserted.assignments++;
            } catch {
                // duplicate index → ignore
            }
        }

        /* -------------------------- IMPORT LOG -------------------------- */

        await ImportLog.create({
            source: "google-spreadsheet",
            dryRun: false,
            rowCount: rows.length,
            inserted,
            startedAt,
            finishedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            inserted,
        });
    } catch (err: any) {
        console.error("IMPORT ERROR:", err);
        return NextResponse.json(
            { error: err.message || "Import failed" },
            { status: 500 }
        );
    }
}
