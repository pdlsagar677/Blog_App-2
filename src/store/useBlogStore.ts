// stores/useBlogStore.ts - Fixed version
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface BlogState {
  posts: BlogPost[];
  isLoading: boolean;
  error: string | null;
  addPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<void>;
  updatePost: (id: string, updates: Partial<Omit<BlogPost, 'id' | 'createdAt'>>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  fetchAllPosts: () => Promise<void>;
  deletePostsByAuthor: (authorId: string) => Promise<void>;
  clearError: () => void;
  refreshPost: (postId: string) => Promise<void>; // NEW: Add this function
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      posts: [],
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      // NEW: Function to refresh a single post
      refreshPost: async (postId: string) => {
        try {
          const response = await fetch(`/api/posts/${postId}`);
          if (response.ok) {
            const { post } = await response.json();
            set((state) => ({
              posts: state.posts.map(p => p.id === postId ? post : p)
            }));
          }
        } catch (error) {
          console.error('Error refreshing post:', error);
        }
      },

      fetchAllPosts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/posts');
          if (!response.ok) throw new Error('Failed to fetch posts');
          const { posts } = await response.json();
          set({ posts, isLoading: false });
        } catch (error) {
          console.error('Error fetching posts:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch posts', isLoading: false });
        }
      },

      addPost: async (postData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(postData),
          });
          if (!response.ok) throw new Error('Failed to create post');
          const { post } = await response.json();
          set((state) => ({ posts: [post, ...state.posts], isLoading: false }));
        } catch (error) {
          console.error('Error creating post:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to create post', isLoading: false });
          throw error;
        }
      },

      updatePost: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update post');
          set((state) => ({
            posts: state.posts.map((post) => (post.id === id ? { ...post, ...updates } : post)),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error updating post:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update post', isLoading: false });
          throw error;
        }
      },

      deletePost: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/posts/${id}`, { method: 'DELETE', credentials: 'include' });
          if (!response.ok) throw new Error('Failed to delete post');
          set((state) => ({ posts: state.posts.filter((post) => post.id !== id), isLoading: false }));
        } catch (error) {
          console.error('Error deleting post:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to delete post', isLoading: false });
          throw error;
        }
      },

      // FIXED: addComment now uses the actual comment ID from backend
      addComment: async (postId, commentData) => {
        set({ isLoading: true, error: null });
        try {
          console.log('💬 Adding comment to post:', postId);
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'add-comment', commentData }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add comment');
          }
          
          const data = await response.json();
          console.log('✅ Comment added successfully:', data.comment);
          
          set((state) => ({
            posts: state.posts.map((post) =>
              post.id === postId 
                ? { ...post, comments: [...post.comments, data.comment] } 
                : post
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error adding comment:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to add comment', isLoading: false });
          throw error;
        }
      },

      // FIXED: deleteComment with better error handling and refresh
      deleteComment: async (postId, commentId) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🗑️ Deleting comment:', { postId, commentId });
          
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'delete-comment', commentId }),
          });
          
          console.log('📡 Delete response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            
            // If comment not found, refresh the post data
            if (errorData.error?.includes('Comment not found')) {
              console.log('🔄 Comment not found, refreshing post data...');
              await get().refreshPost(postId);
              throw new Error('Comment was already deleted. Page refreshed.');
            }
            
            throw new Error(errorData.error || `Failed to delete comment: ${response.status}`);
          }
          
          console.log('✅ Comment deleted successfully');
          
          // Update local state
          set((state) => ({
            posts: state.posts.map((post) =>
              post.id === postId
                ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
                : post
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('❌ Error deleting comment:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete comment', 
            isLoading: false 
          });
          throw error;
        }
      },

      likePost: async (postId, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'like', userId }),
          });
          if (!response.ok) throw new Error('Failed to like post');
          set((state) => ({
            posts: state.posts.map((post) =>
              post.id === postId && !post.likes.includes(userId) 
                ? { ...post, likes: [...post.likes, userId] } 
                : post
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error liking post:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to like post', isLoading: false });
          throw error;
        }
      },

      unlikePost: async (postId, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'unlike', userId }),
          });
          if (!response.ok) throw new Error('Failed to unlike post');
          set((state) => ({
            posts: state.posts.map((post) =>
              post.id === postId 
                ? { ...post, likes: post.likes.filter(id => id !== userId) } 
                : post
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error unliking post:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to unlike post', isLoading: false });
          throw error;
        }
      },

      deletePostsByAuthor: async (authorId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/posts?authorId=${authorId}`, { 
            method: 'DELETE', 
            credentials: 'include' 
          });
          if (!response.ok) throw new Error('Failed to delete posts by author');
          set((state) => ({ 
            posts: state.posts.filter((post) => post.authorId !== authorId), 
            isLoading: false 
          }));
        } catch (error) {
          console.error('Error deleting posts by author:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to delete posts by author', isLoading: false });
          throw error;
        }
      },
    }),
    { 
      name: 'blog-storage', 
      partialize: (state) => ({ posts: state.posts }) 
    }
  )
);

// Helper functions remain the same...
export const blogStoreHelpers = {
  getPostsByAuthor: (authorId: string) => useBlogStore.getState().posts.filter(p => p.authorId === authorId),
  getPostById: (id: string) => useBlogStore.getState().posts.find(p => p.id === id),
  getPopularPosts: (limit?: number) => {
    const sorted = [...useBlogStore.getState().posts].sort((a, b) => b.likes.length - a.likes.length);
    return limit ? sorted.slice(0, limit) : sorted;
  },
  getRecentPosts: (limit?: number) => {
    const sorted = [...useBlogStore.getState().posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  },
  hasUserLikedPost: (postId: string, userId: string) => {
    const post = useBlogStore.getState().posts.find(p => p.id === postId);
    return post ? post.likes.includes(userId) : false;
  },
  getLikeCount: (postId: string) => {
    const post = useBlogStore.getState().posts.find(p => p.id === postId);
    return post ? post.likes.length : 0;
  },
  getCommentCount: (postId: string) => {
    const post = useBlogStore.getState().posts.find(p => p.id === postId);
    return post ? post.comments.length : 0;
  },
};