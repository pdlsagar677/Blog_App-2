// app/api/auth/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { userService, sessionService, blogService, verifyPassword } from '@/lib/mongodb/dbService';

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    console.log('🔍 Delete account - Auth token:', authToken ? 'exists' : 'missing');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token found' },
        { status: 401 }
      );
    }

    // Get session from database
    const session = await sessionService.getSession(authToken);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await userService.findUserById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password with better error handling
    let isPasswordValid = false;
    try {
      isPasswordValid = verifyPassword(password, user.passwordHash);
      console.log('🔍 Password verification result:', isPasswordValid);
    } catch (error) {
      console.error('❌ Password verification error:', error);
      return NextResponse.json(
        { error: 'Error verifying password' },
        { status: 500 }
      );
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'The password you entered is incorrect' }, // More user-friendly message
        { status: 400 }
      );
    }

    // Prevent admin account deletion
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted through this interface' },
        { status: 403 }
      );
    }

    // Delete user's blog posts and comments
    const postsDeleted = await blogService.deletePostsByAuthor(user.id);

    // Delete user's sessions
    await sessionService.deleteUserSessions(user.id);

    // Delete user account
    const userDeleted = await userService.deleteUser(user.id);
    
    if (!userDeleted) {
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    // Create response
    const response = NextResponse.json(
      { 
        message: 'Account deleted successfully',
        postsDeleted: postsDeleted
      },
      { status: 200 }
    );

    // Clear auth token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    console.log('✅ Account deletion completed successfully for user:', user.id);
    return response;

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error during account deletion' },
      { status: 500 }
    );
  }
}