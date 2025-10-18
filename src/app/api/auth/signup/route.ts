// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from 'bcryptjs';
import { userService, validateEmail, validatePhoneNumber } from "@/lib/mongodb/dbService";

export async function POST(request: NextRequest) {
  try {
    const { username, email, phoneNumber, gender, password } = await request.json();

    console.log("Signup attempt:", { username, email, phoneNumber, gender });

    // Validate required fields
    if (!username || !email || !phoneNumber || !gender || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Validate gender
    if (!['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender selection" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Hash password before storing
    const passwordHash = await bcryptjs.hash(password, 12);

    console.log("Creating user in database...");

    // Create user with MongoDB service
    const result = await userService.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      gender: gender as 'male' | 'female' | 'other',
      passwordHash,
      isAdmin: false
    });

    console.log("User creation result:", result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: result.user?.id,
          username: result.user?.username,
          email: result.user?.email
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}