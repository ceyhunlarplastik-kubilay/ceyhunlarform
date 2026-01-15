import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/customers(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    const { sessionClaims } = await auth();
    const pathname = req.nextUrl.pathname;

    // 1) Auth sayfaları asla korunmamalı
    if (isAuthRoute(req)) {
        return NextResponse.next();
    }

    // 2) Korunan route'a erişmeye çalışan kullanıcı giriş yapmamışsa
    if (isProtectedRoute(req) && !sessionClaims) {
        const redirectUrl = pathname + req.nextUrl.search;
        const signInUrl = new URL("/sign-in", req.url);

        signInUrl.searchParams.set("redirect_url", redirectUrl);

        return NextResponse.redirect(signInUrl);
    }

    // 3) Admin role kontrolü
    if (pathname.startsWith("/admin") && sessionClaims?.metadata?.role !== "admin") {
        return NextResponse.redirect(new URL("/?unauthorized=1", req.url));
    }


    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|static|favicon.ico|sign-in|sign-up).*)",
    ],
};

