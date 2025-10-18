// app/page.tsx
import Link from "next/link";
import { BookOpen, Users, FileText, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="text-center max-w-2xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500 p-4 rounded-2xl shadow-lg">
              <BookOpen size={48} className="text-white" />
            </div>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">BlogHub</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            Share your stories, connect with readers, and discover amazing content in our vibrant blogging community.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Write Stories</h3>
              <p className="text-gray-600 text-sm">Share your thoughts and experiences with the world</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Join Community</h3>
              <p className="text-gray-600 text-sm">Connect with like-minded writers and readers</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Get Inspired</h3>
              <p className="text-gray-600 text-sm">Discover amazing content from talented writers</p>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link 
              href="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              Login to Your Account
            </Link>
            <Link 
              href="/signup"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              Join Our Community
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">10K+</div>
              <div className="text-gray-600">Active Writers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">50K+</div>
              <div className="text-gray-600">Blog Posts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">1M+</div>
              <div className="text-gray-600">Readers</div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}