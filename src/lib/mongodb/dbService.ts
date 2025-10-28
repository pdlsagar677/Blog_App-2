import { connectToDatabase } from './connection';
import { User, Session, BlogPost, Comment } from './models';
import bcryptjs from 'bcryptjs';

// Collection names
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';
const POSTS_COLLECTION = 'posts';
const ABOUT_CONTENT_COLLECTION = 'about_content';
const TEAM_MEMBERS_COLLECTION = 'team_members';

// Helper functions
export const generateId = (): string => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhoneNumber = (phone: string): boolean => /^\d{10}$/.test(phone);
export const verifyPassword = (password: string, hashedPassword: string): boolean => bcryptjs.compareSync(password, hashedPassword);

// About Page Interfaces
export interface TeamMember {
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

export interface AboutPageData {
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

// --------------------- User Service ---------------------
export const userService = {
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { db } = await connectToDatabase();
      if (!db) return { success: false, error: 'Database connection failed' };

      const existingUsername = await db.collection<User>(USERS_COLLECTION).findOne({ username: { $regex: new RegExp(`^${userData.username}$`, 'i') } });
      if (existingUsername) return { success: false, error: 'Username already exists' };

      const existingEmail = await db.collection<User>(USERS_COLLECTION).findOne({ email: { $regex: new RegExp(`^${userData.email}$`, 'i') } });
      if (existingEmail) return { success: false, error: 'Email already exists' };

      const existingPhone = await db.collection<User>(USERS_COLLECTION).findOne({ phoneNumber: userData.phoneNumber });
      if (existingPhone) return { success: false, error: 'Phone number already exists' };

      const newUser: User = { ...userData, id: generateId(), createdAt: new Date() };
      const result = await db.collection<User>(USERS_COLLECTION).insertOne(newUser);
      newUser._id = result.insertedId;

      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      return { success: false, error: 'Database error' };
    }
  },

  async findUserByUsername(username: string): Promise<User | null> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  },

  async findUserByPhone(phoneNumber: string): Promise<User | null> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).findOne({ phoneNumber });
  },

  async findUserById(id: string): Promise<User | null> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).findOne({ id });
  },

  async getAllUsers(): Promise<User[]> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).find().toArray();
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<User>(USERS_COLLECTION).updateOne({ id: userId }, { $set: updates });
    return result.modifiedCount > 0;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<User>(USERS_COLLECTION).deleteOne({ id: userId });
    return result.deletedCount > 0;
  },

  async getAdminUsers(): Promise<User[]> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).find({ isAdmin: true }).toArray();
  },
};

// --------------------- Session Service ---------------------
export const sessionService = {
  async createSession(userId: string): Promise<Session> {
    const { db } = await connectToDatabase();
    const session: Session = { token: generateId(), userId, createdAt: new Date() };
    await db.collection<Session>(SESSIONS_COLLECTION).insertOne(session);
    return session;
  },

  async getSession(token: string): Promise<Session | null> {
    const { db } = await connectToDatabase();
    return db.collection<Session>(SESSIONS_COLLECTION).findOne({ token });
  },

  async deleteSession(token: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<Session>(SESSIONS_COLLECTION).deleteOne({ token });
    return result.deletedCount > 0;
  },

  async deleteUserSessions(userId: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<Session>(SESSIONS_COLLECTION).deleteMany({ userId });
    return result.deletedCount > 0;
  },
};

// --------------------- Blog Service ---------------------
export const blogService = {
  async createPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<BlogPost> {
    const { db } = await connectToDatabase();
    const newPost: BlogPost = { ...postData, id: generateId(), createdAt: new Date(), likes: [], comments: [] };
    const result = await db.collection<BlogPost>(POSTS_COLLECTION).insertOne(newPost);
    newPost._id = result.insertedId;
    return newPost;
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const { db } = await connectToDatabase();
    return db.collection<BlogPost>(POSTS_COLLECTION).find().sort({ createdAt: -1 }).toArray();
  },

  async getPostById(id: string): Promise<BlogPost | null> {
    const { db } = await connectToDatabase();
    return db.collection<BlogPost>(POSTS_COLLECTION).findOne({ id });
  },

  async getPostsByAuthor(authorId: string): Promise<BlogPost[]> {
    const { db } = await connectToDatabase();
    return db.collection<BlogPost>(POSTS_COLLECTION).find({ authorId }).sort({ createdAt: -1 }).toArray();
  },

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<BlogPost>(POSTS_COLLECTION).updateOne({ id }, { $set: updates });
    return result.modifiedCount > 0;
  },

  async deletePost(id: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<BlogPost>(POSTS_COLLECTION).deleteOne({ id });
    return result.deletedCount > 0;
  },

  async deletePostsByAuthor(authorId: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<BlogPost>(POSTS_COLLECTION).deleteMany({ authorId });
    return result.deletedCount > 0;
  },

  async addComment(postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    const { db } = await connectToDatabase();
    try {
      const newComment: Comment = { ...comment, id: generateId(), createdAt: new Date() };
      const result = await db.collection<BlogPost>(POSTS_COLLECTION).updateOne({ id: postId }, { $push: { comments: newComment } });
      if (result.modifiedCount > 0) return { success: true, comment: newComment };
      return { success: false, error: 'Failed to add comment' };
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      return { success: false, error: 'Database error' };
    }
  },

  async deleteComment(postId: string, commentId: string): Promise<{ success: boolean; error?: string }> {
    const { db } = await connectToDatabase();
    try {
      const post = await db.collection<BlogPost>(POSTS_COLLECTION).findOne({ id: postId });
      if (!post) return { success: false, error: 'Post not found' };
      if (!post.comments.some(c => c.id === commentId)) return { success: false, error: 'Comment not found' };

      const result = await db.collection<BlogPost>(POSTS_COLLECTION).updateOne({ id: postId }, { $pull: { comments: { id: commentId } } });
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      return { success: false, error: 'Database error' };
    }
  },

  async likePost(postId: string, userId: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<BlogPost>(POSTS_COLLECTION).updateOne({ id: postId, likes: { $ne: userId } }, { $push: { likes: userId } });
    return result.modifiedCount > 0;
  },

  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection<BlogPost>(POSTS_COLLECTION).updateOne({ id: postId }, { $pull: { likes: userId } });
    return result.modifiedCount > 0;
  },
};

// --------------------- Admin Service ---------------------
export const adminService = {
  // Get all users with pagination and search
  async getAllUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<{ users: User[], total: number }> {
    const { db } = await connectToDatabase();
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await db.collection<User>(USERS_COLLECTION)
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection<User>(USERS_COLLECTION).countDocuments(query);

    return { users, total };
  },

  // Create user (admin only)
  async createUser(userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    const { db } = await connectToDatabase();
    
    try {
      // Check if username exists
      const existingUsername = await db.collection<User>(USERS_COLLECTION).findOne({ 
        username: { $regex: new RegExp(`^${userData.username}$`, 'i') } 
      });
      if (existingUsername) {
        return { success: false, error: 'Username already exists' };
      }

      // Check if email exists
      const existingEmail = await db.collection<User>(USERS_COLLECTION).findOne({ 
        email: { $regex: new RegExp(`^${userData.email}$`, 'i') } 
      });
      if (existingEmail) {
        return { success: false, error: 'Email already exists' };
      }

      // Check if phone number exists
      const existingPhone = await db.collection<User>(USERS_COLLECTION).findOne({ 
        phoneNumber: userData.phoneNumber 
      });
      if (existingPhone) {
        return { success: false, error: 'Phone number already exists' };
      }

      const passwordHash = bcryptjs.hashSync(userData.password, 12);

      const newUser: User = {
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        gender: userData.gender,
        passwordHash,
        isAdmin: userData.isAdmin || false,
        id: generateId(),
        createdAt: new Date(),
      };

      const result = await db.collection<User>(USERS_COLLECTION).insertOne(newUser);
      newUser._id = result.insertedId;

      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Database error' };
    }
  },

  // Update user (admin only)
  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    const { db } = await connectToDatabase();
    
    try {
      // Remove fields that shouldn't be updated
      const { id, passwordHash, createdAt, _id, ...allowedUpdates } = updates;

      // If updating username/email/phone, check for duplicates
      if (allowedUpdates.username) {
        const existingUser = await db.collection<User>(USERS_COLLECTION).findOne({
          username: { $regex: new RegExp(`^${allowedUpdates.username}$`, 'i') },
          id: { $ne: userId }
        });
        if (existingUser) {
          return { success: false, error: 'Username already exists' };
        }
      }

      if (allowedUpdates.email) {
        const existingUser = await db.collection<User>(USERS_COLLECTION).findOne({
          email: { $regex: new RegExp(`^${allowedUpdates.email}$`, 'i') },
          id: { $ne: userId }
        });
        if (existingUser) {
          return { success: false, error: 'Email already exists' };
        }
      }

      if (allowedUpdates.phoneNumber) {
        const existingUser = await db.collection<User>(USERS_COLLECTION).findOne({
          phoneNumber: allowedUpdates.phoneNumber,
          id: { $ne: userId }
        });
        if (existingUser) {
          return { success: false, error: 'Phone number already exists' };
        }
      }

      const result = await db.collection<User>(USERS_COLLECTION).updateOne(
        { id: userId },
        { $set: allowedUpdates }
      );

      if (result.modifiedCount === 0) {
        return { success: false, error: 'User not found or no changes made' };
      }

      const updatedUser = await db.collection<User>(USERS_COLLECTION).findOne({ id: userId });
      if (!updatedUser) {
        return { success: false, error: 'User not found after update' };
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Database error' };
    }
  },

  // Delete user (admin only)
  async deleteUser(userId: string, currentAdminId: string): Promise<{ success: boolean; error?: string }> {
    const { db } = await connectToDatabase();
    
    try {
      // Prevent admin from deleting themselves
      if (userId === currentAdminId) {
        return { success: false, error: 'Cannot delete your own account' };
      }

      // Check if user exists
      const user = await db.collection<User>(USERS_COLLECTION).findOne({ id: userId });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Delete user's posts
      await blogService.deletePostsByAuthor(userId);

      // Delete user's sessions
      await sessionService.deleteUserSessions(userId);

      // Delete user account
      const result = await db.collection<User>(USERS_COLLECTION).deleteOne({ id: userId });

      if (result.deletedCount === 0) {
        return { success: false, error: 'Failed to delete user' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Database error' };
    }
  },

  // Toggle admin status
  async toggleAdminStatus(userId: string, currentAdminId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const { db } = await connectToDatabase();
    
    try {
      // Prevent admin from modifying their own admin status
      if (userId === currentAdminId) {
        return { success: false, error: 'Cannot modify your own admin status' };
      }

      const user = await db.collection<User>(USERS_COLLECTION).findOne({ id: userId });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const result = await db.collection<User>(USERS_COLLECTION).updateOne(
        { id: userId },
        { $set: { isAdmin: !user.isAdmin } }
      );

      if (result.modifiedCount === 0) {
        return { success: false, error: 'Failed to update admin status' };
      }

      const updatedUser = await db.collection<User>(USERS_COLLECTION).findOne({ id: userId });
      if (!updatedUser) {
        return { success: false, error: 'User not found after update' };
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      console.error('Error toggling admin status:', error);
      return { success: false, error: 'Database error' };
    }
  }
};

// --------------------- About Page Service ---------------------
export const aboutService = {
  // Get all about page content
  async getAboutContent(): Promise<AboutPageData> {
    const { db } = await connectToDatabase();
    
    // Default content structure
    const defaultContent: AboutPageData = {
      hero: {
        title: "About BlogHub",
        subtitle: "BlogHub",
        description: "BlogHub is more than just a blogging platform—it's a vibrant community where writers and readers come together to share stories, ideas, and inspiration. We're building the future of digital storytelling, one post at a time.",
        ctaPrimary: "Start Writing Today",
        ctaSecondary: "Explore Blogs"
      },
      stats: [
        { number: "50K+", label: "Active Writers" },
        { number: "500K+", label: "Blog Posts" },
        { number: "10M+", label: "Monthly Readers" },
        { number: "120+", label: "Countries" }
      ],
      mission: {
        title: "Our Mission",
        description: "To empower every voice by providing a platform where stories can be shared, discovered, and celebrated. We believe that everyone has a story worth telling.",
        forWriters: {
          title: "For Writers",
          description: "Whether you're a seasoned author or just starting your writing journey, BlogHub provides the tools and audience you need to succeed.",
          features: [
            "Easy-to-use writing tools",
            "Built-in audience growth",
            "Real-time analytics"
          ]
        },
        forReaders: {
          title: "For Readers",
          description: "Discover incredible content from writers around the world. Follow your favorite authors and explore new topics.",
          features: [
            "Personalized recommendations",
            "Save your favorite articles",
            "Engage with writers directly"
          ]
        }
      },
      features: [
        {
          icon: "PenTool",
          title: "Easy Writing Experience",
          description: "Our intuitive editor makes writing and formatting your stories effortless."
        },
        {
          icon: "Globe",
          title: "Global Reach",
          description: "Share your stories with readers from around the world."
        },
        {
          icon: "Users",
          title: "Vibrant Community",
          description: "Join thousands of writers who share, support, and inspire each other."
        },
        {
          icon: "Shield",
          title: "Safe Space",
          description: "We prioritize creating a respectful and inclusive environment."
        }
      ],
      milestones: [
        {
          year: "2020",
          title: "BlogHub Founded",
          description: "Started with a simple mission: to create the best platform for writers and readers."
        },
        {
          year: "2021",
          title: "First 10K Users",
          description: "Reached our first major milestone with 10,000 passionate writers."
        },
        {
          year: "2022",
          title: "Mobile App Launch",
          description: "Expanded our reach with dedicated mobile apps for iOS and Android."
        },
        {
          year: "2023",
          title: "Global Recognition",
          description: "Featured as one of the top emerging platforms for digital content creators."
        }
      ],
      team: {
        title: "Meet Our Team",
        description: "The passionate people behind BlogHub"
      }
    };

    try {
      const savedContent = await db.collection(ABOUT_CONTENT_COLLECTION).findOne({});
      if (savedContent) {
        return { ...defaultContent, ...savedContent.content };
      }
      
      // Initialize with default content
      await db.collection(ABOUT_CONTENT_COLLECTION).insertOne({
        id: 'about_page',
        content: defaultContent,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return defaultContent;
    } catch (error) {
      console.error('Error getting about content:', error);
      return defaultContent;
    }
  },

  // Update about page content
  async updateAboutContent(content: Partial<AboutPageData>): Promise<{ success: boolean; error?: string }> {
    try {
      const { db } = await connectToDatabase();
      
      const existing = await db.collection(ABOUT_CONTENT_COLLECTION).findOne({});
      const currentContent = existing?.content || {};
      
      const updatedContent = {
        ...currentContent,
        ...content
      };
      
      const result = await db.collection(ABOUT_CONTENT_COLLECTION).updateOne(
        {},
        { 
          $set: { 
            content: updatedContent,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error updating about content:', error);
      return { success: false, error: 'Database error' };
    }
  },

  // Team member operations
  async createTeamMember(memberData: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
    try {
      const { db } = await connectToDatabase();
      const newMember: TeamMember = {
        ...memberData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.collection<TeamMember>(TEAM_MEMBERS_COLLECTION).insertOne(newMember);
      newMember._id = result.insertedId;
      
      return { success: true, member: newMember };
    } catch (error) {
      console.error('Error creating team member:', error);
      return { success: false, error: 'Database error' };
    }
  },

  async getAllTeamMembers(): Promise<TeamMember[]> {
    const { db } = await connectToDatabase();
    return db.collection<TeamMember>(TEAM_MEMBERS_COLLECTION)
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .toArray();
  },

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
    try {
      const { db } = await connectToDatabase();
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      const result = await db.collection<TeamMember>(TEAM_MEMBERS_COLLECTION).updateOne(
        { id },
        { $set: updateData }
      );
      
      if (result.modifiedCount === 0) {
        return { success: false, error: 'Member not found or no changes made' };
      }
      
      const updatedMember = await db.collection<TeamMember>(TEAM_MEMBERS_COLLECTION).findOne({ id });
      return { success: true, member: updatedMember };
    } catch (error) {
      console.error('Error updating team member:', error);
      return { success: false, error: 'Database error' };
    }
  },

  async deleteTeamMember(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { db } = await connectToDatabase();
      const result = await db.collection<TeamMember>(TEAM_MEMBERS_COLLECTION).deleteOne({ id });
      
      if (result.deletedCount === 0) {
        return { success: false, error: 'Member not found' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting team member:', error);
      return { success: false, error: 'Database error' };
    }
  },

  async reorderTeamMembers(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { db } = await connectToDatabase();
      
      const bulkOps = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { id },
          update: { $set: { order: index, updatedAt: new Date() } }
        }
      }));
      
      await db.collection<TeamMember>(TEAM_MEMBERS_COLLECTION).bulkWrite(bulkOps);
      return { success: true };
    } catch (error) {
      console.error('Error reordering members:', error);
      return { success: false, error: 'Database error' };
    }
  },

  // Add this method to find user by ID for authentication
  async findUserById(id: string): Promise<User | null> {
    const { db } = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION).findOne({ id });
  }
};