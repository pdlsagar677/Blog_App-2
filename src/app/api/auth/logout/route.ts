// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/lib/mongodb/dbService";

export async function POST(request: NextRequest) {
  try {
    // FIX: Use 'auth-token' consistently
    const token = request.cookies.get('auth-token')?.value;
    
    // Remove session from database
    if (token) {
      await sessionService.deleteSession(token);
    }

    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    // FIX: Clear 'auth-token' cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}