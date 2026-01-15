import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAdmin() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    if (sessionClaims?.metadata?.role !== "admin") {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    return null;
}
