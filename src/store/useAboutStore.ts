import { create } from 'zustand';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  imageUrl: string;
  email?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AboutContent {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  stats: Array<{
    number: string;
    label: string;
  }>;
  mission: {
    title: string;
    description: string;
    forWriters: {
      title: string;
      description: string;
      features: string[];
    };
    forReaders: {
      title: string;
      description: string;
      features: string[];
    };
  };
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  milestones: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  team: {
    title: string;
    description: string;
  };
}

interface AboutState {
  content: AboutContent | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
  fetchAboutContent: () => Promise<void>;
  updateAboutContent: (updates: Partial<AboutContent>) => Promise<void>;
  updateSection: (section: string, content: any) => Promise<void>;
  createTeamMember: (memberData: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  reorderTeamMembers: (orderedIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useAboutStore = create<AboutState>((set, get) => ({
  content: null,
  teamMembers: [],
  isLoading: false,
  error: null,

  fetchAboutContent: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch about content');
      }
      
      const data = await response.json();
      set({ 
        content: data.content,
        teamMembers: data.content.teamMembers || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Fetch about content error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch about content',
        isLoading: false 
      });
    }
  },

  updateAboutContent: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update about content');
      }
      
      // Update local state
      const { content } = get();
      set({ 
        content: content ? { ...content, ...updates } : null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Update about content error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update about content',
        isLoading: false 
      });
    }
  },

  updateSection: async (section, content) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ section, content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update section');
      }
      
      // Update local state
      const { content: currentContent } = get();
      if (currentContent) {
        set({ 
          content: {
            ...currentContent,
            [section]: content
          },
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Update section error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update section',
        isLoading: false 
      });
    }
  },

  // Team member methods
  createTeamMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'createTeamMember',
          teamMember: memberData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team member');
      }
      
      const data = await response.json();
      
      // Add new member to local state
      const { teamMembers } = get();
      set({ 
        teamMembers: [...teamMembers, data.member], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Create team member error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create team member',
        isLoading: false 
      });
    }
  },

  updateTeamMember: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'updateTeamMember',
          teamMemberId: id,
          teamMemberUpdates: updates
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team member');
      }
      
      // Update local state
      const { teamMembers } = get();
      const updatedMembers = teamMembers.map(member => 
        member.id === id ? { ...member, ...updates } : member
      );
      
      set({ teamMembers: updatedMembers, isLoading: false });
    } catch (error) {
      console.error('Update team member error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update team member',
        isLoading: false 
      });
    }
  },

  deleteTeamMember: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ teamMemberId: id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team member');
      }
      
      // Update local state
      const { teamMembers } = get();
      const updatedMembers = teamMembers.filter(member => member.id !== id);
      
      set({ teamMembers: updatedMembers, isLoading: false });
    } catch (error) {
      console.error('Delete team member error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete team member',
        isLoading: false 
      });
    }
  },

  reorderTeamMembers: async (orderedIds) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/admin/about', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ orderedIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reorder team members');
      }
      
      // Refresh members after reordering
      await get().fetchAboutContent();
    } catch (error) {
      console.error('Reorder team members error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reorder team members',
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
}));