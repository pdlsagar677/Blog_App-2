// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from 'bcryptjs';
import { userService, sessionService, verifyPassword } from "@/lib/mongodb/dbService";

export async function POST(request: NextRequest) {
  try {
    const { emailOrUsername, password } = await request.json();

    // Validation checks
    const errors: Record<string, string> = {};

    if (!emailOrUsername?.trim()) {
      errors.emailOrUsername = "Email or username is required";
    }

    if (!password?.trim()) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          errors 
        },
        { status: 400 }
      );
    }

    // Find user
    let user;
    const cleanInput = emailOrUsername.trim();
    
    if (cleanInput.includes('@')) {
      user = await userService.findUserByEmail(cleanInput);
      if (!user) {
        return NextResponse.json(
          { 
            error: "Invalid credentials",
            errors: { emailOrUsername: "No account found with this email" }
          },
          { status: 401 }
        );
      }
    } else {
      user = await userService.findUserByUsername(cleanInput);
      if (!user) {
        return NextResponse.json(
          { 
            error: "Invalid credentials",
            errors: { emailOrUsername: "No account found with this username" }
          },
          { status: 401 }
        );
      }
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: "Invalid credentials",
          errors: { password: "Incorrect password" }
        },
        { status: 401 }
      );
    }

    // Create session
    const session = await sessionService.createSession(user.id);

    // Prepare user data for response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json(
      { 
        message: "Login successful",
        user: userData
      },
      { status: 200 }
    );

    // FIX: Use 'auth-token' consistently across the app
    response.cookies.set('auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}