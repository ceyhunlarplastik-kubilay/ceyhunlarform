import { NextResponse } from "next/server";
import axios from "axios";

const BASE_URL = process.env.TURKIYE_API_URL; // https://api.turkiyeapi.dev/v1

if (!BASE_URL) {
    throw new Error("TURKIYE_API_URL environment variable is not set");
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") ?? "";

    const res = await axios.get(`${BASE_URL}/provinces`, {
        params: {
            name,
            fields: "id,name",
            sort: "name",
        },
    });

    return NextResponse.json(res.data.data);
}
