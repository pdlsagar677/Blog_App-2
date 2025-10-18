// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { userService, sessionService } from "@/lib/mongodb/dbService";

export async function PUT(request: NextRequest) {
  try {
    // FIX: Use 'auth-token' consistently
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await sessionService.getSession(authToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // ... rest of your profile update logic
    const userData = await request.json();
    
    // Update user profile
    const updated = await userService.updateUser(session.userId, userData);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Get updated user
    const user = await userService.findUserById(session.userId);
    const { passwordHash, ...userWithoutPassword } = user!;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}