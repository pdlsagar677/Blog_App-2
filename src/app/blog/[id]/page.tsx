// app/blog/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useBlogStore } from "@/store/useBlogStore";
import {
  ArrowLeft,
  Calendar,
  User,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  LogIn,
  Edit,
  Save,
  X,
} from "lucide-react";

export default function BlogPostPage() {
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    content: "",
    imageUrl: "",
  });

  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const {
    posts,
    fetchAllPosts,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
    deletePost,
    updatePost,
  } = useBlogStore();

  const postId = params.id as string;
  const post = posts.find(p => p.id === postId);

  useEffect(() => {
    setIsClient(true);

    // Load posts if not already loaded
    const loadPosts = async () => {
      try {
        await fetchAllPosts();
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };

    // Check authentication status
    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        setAuthChecked(true);
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAuthChecked(true);
      loadPosts().finally(() => setIsLoading(false));
    }
  }, [isLoggedIn, postId, fetchAllPosts]);

  // Populate edit form when post loads
  useEffect(() => {
    if (post) {
      setEditForm({
        title: post.title,
        description: post.description,
        content: post.content,
        imageUrl: post.imageUrl || ""
      });
    }
  }, [post]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authChecked && !isLoggedIn) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authChecked, isLoggedIn, router]);

  // Safe array check and includes function
  const safeIncludes = (array: any, value: any) => {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  };

  const safeArrayLength = (array: any) => {
    return Array.isArray(array) ? array.length : 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (post) {
      setEditForm({
        title: post.title,
        description: post.description,
        content: post.content,
        imageUrl: post.imageUrl || ""
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!post) return;
    
    try {
      await updatePost(post.id, {
        title: editForm.title,
        description: editForm.description,
        content: editForm.content,
        imageUrl: editForm.imageUrl
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLike = async () => {
    if (!isLoggedIn || !user || !post) return;

    try {
      if (safeIncludes(post.likes, user.id)) {
        await unlikePost(post.id, user.id);
      } else {
        await likePost(post.id, user.id);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !isLoggedIn || !user || !post) return;

    try {
      await addComment(post.id, {
        text: comment,
        authorId: user.id,
        authorName: user.username,
      });

      setComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    
    try {
      await deleteComment(post.id, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(post.id);
        router.push("/blog");
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const isPostLiked = safeIncludes(post?.likes, user?.id);
  const canEditPost = isLoggedIn && (user?.id === post?.authorId || user?.isAdmin);
  const canDeletePost = isLoggedIn && (user?.id === post?.authorId || user?.isAdmin);

  // Show loading while checking authentication
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (authChecked && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-yellow-100 p-4 rounded-lg mb-6">
            <LogIn className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-yellow-800">
              Authentication Required
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            Please log in to read this blog post.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Redirecting to login page...
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login Now
            </Link>
            <Link
              href="/blog"
              className="border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-500 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show post not found if post doesn't exist
  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="bg-red-100 p-4 rounded-lg mb-6">
            <MessageCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-800">Post Not Found</h2>
          </div>
          <p className="text-gray-600 mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/blog"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blog"
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blogs
          </Link>

          <div className="flex items-center gap-4">
            {canEditPost && (
              <>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center text-gray-600 hover:text-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Edit className="w-5 h-5 mr-2" />
                      Edit Post
                    </button>
                    {canDeletePost && (
                      <button
                        onClick={handleDeletePost}
                        className="flex items-center text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete Post
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Blog Post */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Featured Image */}
          {isEditing ? (
            <div className="p-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          ) : (
            post.imageUrl && (
              <div className="h-96 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )
          )}

          {/* Content */}
          <div className="p-8">
            {isEditing ? (
              <>
                {/* Editable Title */}
                <input
                  type="text"
                  className="w-full text-4xl font-bold text-gray-900 mb-4 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
                
                {/* Editable Description */}
                <textarea
                  className="w-full text-xl text-gray-700 mb-8 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
                
                {/* Editable Content */}
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 leading-8 resize-none"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your blog content here..."
                />
              </>
            ) : (
              <>
                {/* Read-only View */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
                
                {/* Meta Information */}
                <div className="flex items-center gap-6 text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">{post.description}</p>
                
                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-line text-gray-800 leading-8">
                    {post.content}
                  </div>
                </div>
              </>
            )}
            
            {/* Engagement - Only show when not editing */}
            {!isEditing && (
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLike}
                  disabled={!isLoggedIn}
                  className={`flex items-center gap-2 transition-colors ${
                    isPostLiked
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-600 hover:text-red-500"
                  } ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart
                    className={`w-6 h-6 ${isPostLiked ? "fill-current" : ""}`}
                  />
                  <span className="font-medium">
                    {safeArrayLength(post.likes)} likes
                  </span>
                </button>

                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">
                    {safeArrayLength(post.comments)} comments
                  </span>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({safeArrayLength(post.comments)})
          </h2>

          {/* Add Comment */}
          {isLoggedIn ? (
            <div className="mb-8">
              <textarea
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-400 bg-white text-lg"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Post Comment
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
              <p className="text-gray-600">
                <Link
                  href="/login"
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  Log in
                </Link>{" "}
                to join the conversation
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {safeArrayLength(post.comments) === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {comment.authorName}
                      </span>
                      <span className="text-gray-500 text-sm ml-3">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {isLoggedIn &&
                      (user?.id === comment.authorId || user?.isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                  <p className="text-gray-700 text-lg">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}