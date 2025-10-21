// lib/auth.ts
import { cookies } from 'next/headers';
import { sessionService, userService } from './mongodb/dbService';

export async function getSession(request?: Request) {
  try {
    // Get auth token from cookies
    let authToken: string | undefined;
    
    if (request) {
      // For server components with request object
      const cookieHeader = request.headers.get('cookie');
      authToken = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1];
    } else {
      // For client components or API routes
      const cookieStore = await cookies();
      authToken = cookieStore.get('auth-token')?.value;
    }

    if (!authToken) {
      return null;
    }

    // Get session from MongoDB
    const session = await sessionService.getSession(authToken);
    if (!session) {
      return null;
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - session.createdAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      // Delete expired session
      await sessionService.deleteSession(authToken);
      return null;
    }

    // Get user from MongoDB
    const user = await userService.findUserById(session.userId);
    if (!user) {
      // Delete orphaned session
      await sessionService.deleteSession(authToken);
      return null;
    }

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: authToken
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

export async function createAuthToken(userId: string) {
  try {
    const session = await sessionService.createSession(userId);
    return session.token;
  } catch (error) {
    console.error('Error creating auth token:', error);
    throw new Error('Failed to create authentication token');
  }
}

export async function deleteAuthToken(token: string) {
  try {
    await sessionService.deleteSession(token);
  } catch (error) {
    console.error('Error deleting auth token:', error);
    throw new Error('Failed to delete authentication token');
  }
}

export async function refreshAuthToken(oldToken: string): Promise<string | null> {
  try {
    const session = await sessionService.getSession(oldToken);
    if (!session) {
      return null;
    }

    // Create new token
    const newToken = await createAuthToken(session.userId);
    
    // Delete old token
    await deleteAuthToken(oldToken);
    
    return newToken;
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    return null;
  }
}

export async function validateAuthToken(token: string): Promise<boolean> {
  try {
    const session = await sessionService.getSession(token);
    if (!session) {
      return false;
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - session.createdAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      await sessionService.deleteSession(token);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating auth token:', error);
    return false;
  }
}