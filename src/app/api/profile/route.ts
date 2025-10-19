// app/api/profile/route.ts - FIXED
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { userService, sessionService } from "@/lib/mongodb/dbService";

export async function PUT(request: NextRequest) {
  try {
    // FIXED: Use 'auth-token' consistently
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

    // Get user data from request
    const userData = await request.json();
    
    // FIXED: Handle profile picture removal (empty string)
    const updateData = {
      ...userData,
      // If profilePicture is explicitly set to empty string, it means remove the picture
      profilePicture: userData.profilePicture || null // Set to null in database to remove
    };
    
    // Update user profile
    const updated = await userService.updateUser(session.userId, updateData);
    
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