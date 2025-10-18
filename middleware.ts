// middleware.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { userService, sessionService } from "@/lib/mongodb/dbService";

export async function middleware(req: NextRequest) {
  // CORRECT: Using 'auth-token'
  const token = req.cookies.get("auth-token")?.value;
  const isProtected = req.nextUrl.pathname.startsWith("/admin");

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const session = await sessionService.getSession(token);
      
      if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      const user = await userService.findUserById(session.userId);
      if (!user?.isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};