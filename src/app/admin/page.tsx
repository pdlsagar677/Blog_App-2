// app/admin/page.tsx
"use client";
import { useBlogStore } from "@/store/useBlogStore";
import { FileText, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { posts } = useBlogStore();

  const stats = {
    totalPosts: posts.length,
    totalUsers: 150,
    totalComments: posts.reduce((acc, post) => acc + (post.comments?.length || 0), 0),
    totalLikes: posts.reduce((acc, post) => acc + (post.likes?.length || 0), 0),
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalComments}</p>
            </div>
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
          <Link 
            href="/admin/posts"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {posts.slice(0, 5).map((post) => (
            <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{post.title}</h4>
                <p className="text-sm text-gray-600">By {post.authorName}</p>
              </div>
              <Link
                href={`/blog/${post.id}`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}