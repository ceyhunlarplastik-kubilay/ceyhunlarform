import { NextResponse } from "next/server";
import axios from "axios";

const BASE_URL = process.env.TURKIYE_API_URL;

if (!BASE_URL) {
    throw new Error("TURKIYE_API_URL environment variable is not set");
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const province = searchParams.get("province");

    if (!province) {
        return NextResponse.json([], { status: 200 });
    }

    const res = await axios.get(`${BASE_URL}/districts`, {
        params: {
            province,
            fields: "id,name",
            sort: "name",
        },
    });

    return NextResponse.json(res.data.data);
}
