// src/stores/useAdminStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: 'male' | 'female' | 'other';
  isAdmin: boolean;
  createdAt: Date;
}

interface AdminState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchAllUsers: (page?: number, limit?: number, search?: string) => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<{ success: boolean; data?: any }>;
  toggleAdminStatus: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchAllUsers: async (page = 1, limit = 10, search = '') => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search
      });
      
      const response = await fetch(`/api/admin/users?${queryParams}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      set({ users: data.users, isLoading: false });
    } catch (error) {
      console.error('Fetch users error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false 
      });
    }
  },

  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const data = await response.json();
      
      // Add new user to local state
      const { users } = get();
      set({ users: [...users, data.user], isLoading: false });
    } catch (error) {
      console.error('Create user error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create user',
        isLoading: false 
      });
    }
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, updates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      const data = await response.json();
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      );
      
      set({ users: updatedUsers, isLoading: false });
    } catch (error) {
      console.error('Update user error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update user',
        isLoading: false 
      });
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      const data = await response.json();
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.filter(user => user.id !== userId);
      
      set({ users: updatedUsers, isLoading: false });
      
      // Return success for the component to handle
      return { success: true, data };
    } catch (error) {
      console.error('Delete user error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete user',
        isLoading: false 
      });
      throw error;
    }
  },

  toggleAdminStatus: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, action: 'toggleAdmin' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update admin status');
      }
      
      const data = await response.json();
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, isAdmin: data.user.isAdmin } : user
      );
      
      set({ users: updatedUsers, isLoading: false });
    } catch (error) {
      console.error('Toggle admin status error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update admin status',
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
}));