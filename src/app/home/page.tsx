// app/page.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useBlogStore } from "@/store/useBlogStore";
import { BookOpen, Users, Heart, ArrowRight, Star, PenTool, Globe, Shield, Calendar, User, MessageCircle, Eye } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function LandingPage() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { posts, fetchAllPosts } = useBlogStore(); // use isLoggedIn boolean from store
const {isLoggedIn} = useAuthStore();
  useEffect(() => {
    setIsClient(true);

    const loadPosts = async () => {
      try {
        await fetchAllPosts();
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading posts:', error);
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [fetchAllPosts]);

  useEffect(() => {
    if (posts.length > 0) {
      setFeaturedPosts(posts.slice(0, 3));
    }
  }, [posts]);

  const features = [
    { icon: <PenTool className="w-12 h-12" />, title: "Easy Writing", description: "Beautiful editor that makes writing a pleasure" },
    { icon: <Globe className="w-12 h-12" />, title: "Global Reach", description: "Share your stories with readers worldwide" },
    { icon: <Users className="w-12 h-12" />, title: "Vibrant Community", description: "Connect with writers and readers" },
    { icon: <Shield className="w-12 h-12" />, title: "Safe Space", description: "Respectful environment for all voices" },
  ];

  const stats = [
    { number: "50K+", label: "Writers" },
    { number: "50K+", label: "Blog Posts" },
    { number: "1M+", label: "Readers" },
    { number: "120+", label: "Countries" },
  ];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const safeArrayLength = (array: any) => (Array.isArray(array) ? array.length : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Where Every <span className="text-blue-600">Story</span> Finds Its <span className="text-green-500">Voice</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of writers sharing their stories, ideas, and inspiration. BlogHub is your platform to write,
            connect, and be heard in a vibrant community of storytellers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {!isLoggedIn && (
              <Link
                href="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"
              >
                Start Writing Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link
              href="/blog"
              className="border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-500 px-8 py-4 rounded-lg font-medium transition-all duration-200 text-lg"
            >
              Explore Stories
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Blog Posts */}
      {isClient && !isLoading && featuredPosts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Stories</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the latest stories from our vibrant community of writers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featuredPosts.map((post) => (
                <div key={post.id} className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {post.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Heart className="w-4 h-4" />
                          <span>{safeArrayLength(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <MessageCircle className="w-4 h-4" />
                          <span>{safeArrayLength(post.comments)}</span>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${post.id}`}
                        className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/blog"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-lg"
              >
                <Eye className="w-5 h-5" />
                View All Stories
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Loading and Empty states */}
      {isLoading && (
        <section className="py-20 bg-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading featured stories...</p>
        </section>
      )}

      {isClient && !isLoading && featuredPosts.length === 0 && (
        <section className="py-20 bg-white text-center">
          <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Stories Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Be the first to share your story with the community!</p>
          {!isLoggedIn && (
            <Link
              href="/create-post"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <PenTool className="w-5 h-5" />
              Write First Story
            </Link>
          )}
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose BlogHub?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">We've built the perfect platform for writers and readers to connect, share, and grow together.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 group hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Story?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our community of writers and readers today. Share your voice, discover amazing content, and be part of something special.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
              >
                Create Your Account
              </Link>
              <Link
                href="/blog"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-medium text-lg"
              >
                Explore Stories
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
