// stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (userData: {
    username: string;
    email: string;
    phoneNumber: string;
  }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      // Clear error state
      clearError: () => set({ error: null }),

      // Login sets user state and marks as logged in
      login: (user: User) => set({ 
        user, 
        isLoggedIn: true, 
        isLoading: false,
        error: null 
      }),

      // Logout API + local clear
      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
            throw new Error(errorData.error || 'Logout failed');
          }
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state even if API call fails
        } finally {
          set({ 
            user: null, 
            isLoggedIn: false, 
            isLoading: false,
            error: null 
          });
          
          // Clear persisted storage
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('blog-storage');
        }
      },

      // Set user manually
      setUser: (user: User) => set({ user }),

      // Set loading state manually
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Check user session
      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (!response.ok) {
            // Don't throw error for auth check - just clear state
            set({ user: null, isLoggedIn: false, isLoading: false });
            return;
          }

          const data = await response.json();

          if (data.user) {
            set({ 
              user: data.user, 
              isLoggedIn: true, 
              isLoading: false,
              error: null 
            });
          } else {
            set({ 
              user: null, 
              isLoggedIn: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ 
            user: null, 
            isLoggedIn: false, 
            isLoading: false 
          });
        }
      },

      // Update user profile
      updateProfile: async (userData) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
            throw new Error(errorData.error || 'Failed to update profile');
          }

          const data = await response.json();
          set({ 
            user: data.user, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Profile update error:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update profile'
          });
          throw error;
        }
      },

      // Delete account
     // In your useAuthStore.ts - update the deleteAccount method
deleteAccount: async (password: string) => {
  try {
    set({ isLoading: true, error: null });
    
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    // Handle response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: `HTTP error: ${response.status} - ${text || response.statusText}` };
    }

    if (!response.ok) {
      // Don't throw the error - just return it so the UI can handle it
      set({ 
        isLoading: false,
        error: data.error || `Failed to delete account: ${response.status}`
      });
      throw new Error(data.error || `Failed to delete account: ${response.status}`);
    }

    // Clear all auth state and persisted data
    set({ 
      user: null, 
      isLoggedIn: false, 
      isLoading: false,
      error: null 
    });
    
    // Clear all persisted storage
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('blog-storage');
    localStorage.removeItem('user-storage');
    
    return data;
  } catch (error) {
    console.error('Delete account error:', error);
    set({ 
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to delete account'
    });
    throw error;
  }
},
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);