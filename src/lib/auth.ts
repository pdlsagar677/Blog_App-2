// lib/auth.ts
import { cookies } from 'next/headers';
import { db } from './db/inMemoryStore';

export async function getSession(request?: Request) {
  try {
    const cookieHeader = request?.headers.get('cookie');
    const authToken = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1];
    
    if (!authToken) {
      return null;
    }

    const session = db.sessions.get(authToken);
    if (!session) {
      return null;
    }

    const user = db.users.get(session.userId);
    if (!user) {
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
  const session = {
    token: Math.random().toString(36).slice(2),
    userId,
    createdAt: Date.now(),
  };
  
  db.sessions.set(session.token, session);
  return session.token;
}

export async function deleteAuthToken(token: string) {
  db.sessions.delete(token);
}