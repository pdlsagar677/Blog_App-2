import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: 'male' | 'female' | 'other';
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface Session {
  _id?: ObjectId;
  token: string;
  userId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface BlogPost {
  _id?: ObjectId;
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  likes: string[];
  comments: Comment[];
}
// Add these interfaces to your models.ts or dbService.ts
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