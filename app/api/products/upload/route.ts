import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const s3 = new S3Client({
    region: process.env.AWS_REGION || "eu-central-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getS3KeyFromUrl(url: string) {
    // beklenen format:
    // https://<bucket>.s3.amazonaws.com/products/xxx.jpg
    // veya region'lı olabilir. en güvenlisi URL ile parse edip pathname almak.
    const u = new URL(url);
    const key = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
    return key;
}

export async function POST(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const productId = formData.get("productId") as string | null;

        if (!file || !productId) {
            return NextResponse.json({ error: "No file or productId" }, { status: 400 });
        }

        // basit content-type kontrolü
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = sanitizeFileName(file.name);
        // const fileKey = `products/${Date.now()}-${safeName}`;
        // const fileKey = `products/${productId}/${Date.now()}-${file.name}`;
        const fileKey = `products/${productId}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: fileKey,
                Body: buffer,
                ContentType: file.type,
            })
        );

        const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileKey}`;
        return NextResponse.json({ url: imageUrl, key: fileKey });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get("url");
        if (!url) {
            return NextResponse.json({ error: "url is required" }, { status: 400 });
        }

        const key = getS3KeyFromUrl(url);

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: key,
            })
        );

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
