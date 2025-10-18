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