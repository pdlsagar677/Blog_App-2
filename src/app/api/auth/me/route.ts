// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { userService, sessionService } from "@/lib/mongodb/dbService";

export async function GET(request: NextRequest) {
  try {
    // FIX: Use 'auth-token' consistently
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = await sessionService.getSession(token);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await userService.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null });
  }
}