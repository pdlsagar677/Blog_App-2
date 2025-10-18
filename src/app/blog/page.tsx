// app/blog/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useBlogStore } from "@/store/useBlogStore";
import {
  Plus,
  Calendar,
  User,
  Heart,
  MessageCircle,
  ArrowRight,
  Search,
} from "lucide-react";

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoggedIn, user } = useAuthStore();
  const { posts, fetchAllPosts, likePost, unlikePost } = useBlogStore();

  // Initialize state after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch posts on component mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        await fetchAllPosts();
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isClient) {
      loadPosts();
    }
  }, [isClient, fetchAllPosts]);

  useEffect(() => {
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Safe array check and includes function
  const safeIncludes = (array: any, value: any) => {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  };

  const handleLike = async (postId: string) => {
    if (!isLoggedIn || !user) return;

    const post = posts.find((p) => p.id === postId);
    if (safeIncludes(post?.likes, user.id)) {
      await unlikePost(postId, user.id);
    } else {
      await likePost(postId, user.id);
    }
  };

  const isPostLiked = (postId: string) => {
    if (!isLoggedIn || !user) return false;
    const post = posts.find((p) => p.id === postId);
    return safeIncludes(post?.likes, user.id);
  };

  // Safe calculation functions to prevent NaN
  const getTotalLikes = () => {
    try {
      return posts.reduce((total, post) => {
        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        return total + likesCount;
      }, 0);
    } catch (error) {
      return 0;
    }
  };

  const getTotalComments = () => {
    try {
      return posts.reduce((total, post) => {
        const commentsCount = Array.isArray(post.comments)
          ? post.comments.length
          : 0;
        return total + commentsCount;
      }, 0);
    } catch (error) {
      return 0;
    }
  };

  const getUniqueWriters = () => {
    try {
      return [...new Set(posts.map((post) => post.authorId))].length;
    } catch (error) {
      return 0;
    }
  };

  // Don't render anything until client-side to avoid hydration mismatch
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Blog Hub</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing stories, share your thoughts, and connect with
            writers from around the world.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blogs, authors, or topics..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Create Post Button */}
          {isLoggedIn ? (
            <Link
              href="/create-post"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Write Blog
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
            >
              Login to Write
            </Link>
          )}
        </div>

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {posts.length === 0 ? "No Blog Posts Yet" : "No Posts Found"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "No posts match your search. Try different keywords."
                  : "Be the first to share your story with the community!"}
              </p>
              {isLoggedIn ? (
                <Link
                  href="/create-post"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create First Post
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Join Community
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Image */}
                {post.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={!isLoggedIn}
                        className={`flex items-center gap-1 transition-colors ${
                          isPostLiked(post.id)
                            ? "text-red-500 hover:text-red-600"
                            : "text-gray-400 hover:text-red-500"
                        } ${
                          !isLoggedIn ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isPostLiked(post.id) ? "fill-current" : ""
                          }`}
                        />
                        <span>
                          {Array.isArray(post.likes) ? post.likes.length : 0}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {Array.isArray(post.comments)
                            ? post.comments.length
                            : 0}
                        </span>
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
        )}

        {/* Stats - Only show after client-side hydration */}
        {isClient && posts.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-md p-6 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Community Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {posts.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {getUniqueWriters()}
                  </div>
                  <div className="text-sm text-gray-600">Writers</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}