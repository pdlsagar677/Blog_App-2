// components/profile/Profile.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useBlogStore } from "@/store/useBlogStore";
import { useRouter } from "next/navigation";
import { Calendar, Heart, MessageCircle, Eye, Edit, Trash2, Upload, Camera } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ProfileFormData {
  username: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const { user, isLoggedIn, isLoading, logout, checkAuth, updateProfile, deleteAccount, clearError } = useAuthStore();
  const { posts, fetchAllPosts, deletePost } = useBlogStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    phoneNumber: '',
    profilePicture: ''
  });
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Profile picture states
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
        setAuthError(null);
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError("Failed to verify authentication");
      } finally {
        setHasCheckedAuth(true);
      }
    };

    verifyAuth();
  }, [checkAuth]);

  // Load all posts when component mounts
  useEffect(() => {
    const loadPosts = async () => {
      try {
        await fetchAllPosts();
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };

    if (isLoggedIn) {
      loadPosts();
    }
  }, [isLoggedIn, fetchAllPosts]);

  // Populate form when user data is available and filter user posts
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture || ''
      });
      
      // Filter user's posts from the global posts array
      const userPosts = posts.filter(post => post.authorId === user.id);
      setUserPosts(userPosts);
    }
  }, [user, posts]);

  // Clean up image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  // Handle profile image upload
  const handleProfileImageUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setProfileImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setProfileImagePreview(previewUrl);
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProfileImageUpload(files[0]);
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
      setProfileImagePreview("");
    }
    // Also clear the profile picture from form data
    setFormData(prev => ({ ...prev, profilePicture: '' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn || !user) {
      setMessage({ type: 'error', text: 'You must be logged in to update your profile' });
      return;
    }

    // Check if any changes were made
    const hasChanges = formData.username !== user.username || 
                      formData.email !== user.email || 
                      formData.phoneNumber !== user.phoneNumber ||
                      profileImageFile !== null;

    if (!hasChanges) {
      setMessage({ type: 'error', text: 'No changes detected' });
      return;
    }

    if (!formData.username.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      setMessage({ type: 'error', text: 'Phone number must be exactly 10 digits' });
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    clearError();

    try {
      let finalProfilePicture = formData.profilePicture;

      // If new profile image is selected, upload it to Cloudinary
      if (profileImageFile) {
        setIsUploadingImage(true);
        setMessage({ type: 'success', text: '📤 Uploading profile picture...' });
        
        finalProfilePicture = await uploadToCloudinary(profileImageFile);
        
        setIsUploadingImage(false);
        setMessage({ type: 'success', text: '✅ Picture uploaded! Updating profile...' });
      }

      // Update profile with new data including profile picture
      await updateProfile({
        ...formData,
        profilePicture: finalProfilePicture
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Clear the image file after successful upload
      setProfileImageFile(null);
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
        setProfileImagePreview("");
      }
      
      // Refresh the auth state after successful update
      setTimeout(() => {
        checkAuth();
      }, 500);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsUpdating(false);
      setIsUploadingImage(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
    clearError();
    
    // Reset image states
    setProfileImageFile(null);
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
      setProfileImagePreview("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(postId);
    try {
      await deletePost(postId);
      setMessage({ type: 'success', text: 'Post deleted successfully!' });
    } catch (error) {
      console.error('Error deleting post:', error);
      setMessage({ type: 'error', text: 'Failed to delete post. Please try again.' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/edit-post/${postId}`);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Password is required to confirm account deletion');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      await deleteAccount(deletePassword);
      
      setMessage({ type: 'success', text: 'Account and all your posts have been deleted successfully' });
      setShowDeleteDialog(false);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Account deletion error:', error);
      
      if (error.message.includes('Invalid password') || error.message.includes('incorrect')) {
        setDeleteError('The password you entered is incorrect. Please try again.');
      } else if (error.message.includes('Unauthorized') || error.message.includes('authentication token')) {
        setDeleteError('Your session has expired. Please log in again.');
      } else if (error.message.includes('Admin accounts cannot be deleted')) {
        setDeleteError('Admin accounts cannot be deleted through this interface.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletePassword('');
    setDeleteError(null);
    clearError();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const safeArrayLength = (array: any) => {
    return Array.isArray(array) ? array.length : 0;
  };

  // Check if user is admin
  const isAdmin = user?.isAdmin || false;

  // Show loading during initial auth check
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {authError ? "Authentication Error" : "Access Denied"}
          </h2>
          <p className="text-gray-600 mb-6">
            {authError || "You need to be logged in to view your profile."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600">
            {isEditing ? "Edit your account information" : "View your account information"}
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* User Avatar and Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8 pb-8 border-b border-gray-200">
            {/* Profile Picture Section */}
            <div className="relative group">
              {/* Profile Image */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show fallback
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload Button (only show when editing) */}
              {isEditing && (
                <>
                  <label 
                    htmlFor="profile-picture-upload"
                    className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                    title="Change profile picture"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleProfileImageSelect}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Remove Image Button (only show when there's an image) */}
                  {(profileImagePreview || user?.profilePicture) && (
                    <button
                      onClick={removeProfileImage}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                      title="Remove profile picture"
                      type="button"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}

              {/* Upload Progress */}
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {user?.username}
              </h2>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span
                  className={`px-4 py-2 rounded-full text-base font-medium ${
                    user?.isAdmin
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-green-100 text-green-800 border border-green-200"
                  }`}
                >
                  {user?.isAdmin ? "Administrator" : "User"}
                </span>
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-base font-medium border border-blue-200">
                  {user?.gender?.charAt(0).toUpperCase() + user?.gender?.slice(1)}
                </span>
              </div>
              
              {/* Profile Picture Help Text */}
              {isEditing && (
                <p className="text-sm text-gray-500 mt-3">
                  Click the camera icon to upload a profile picture
                </p>
              )}
            </div>
            
            {/* Edit Button */}
            {!isEditing && (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>

                {/* Username */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Username *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={isUpdating}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-900 transition-colors"
                      required
                      minLength={3}
                      maxLength={50}
                    />
                  ) : (
                    <div className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium">
                      {user?.username}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Email Address *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isUpdating}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-900 transition-colors"
                      required
                    />
                  ) : (
                    <div className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium">
                      {user?.email}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Phone Number *
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      disabled={isUpdating}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-900 transition-colors"
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit phone number"
                      required
                    />
                  ) : (
                    <div className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium">
                      {user?.phoneNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Account Information
                </h3>

                {/* Profile Picture URL (Read-only) */}
                {user?.profilePicture && !isEditing && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Profile Picture
                    </label>
                    <div className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-mono break-all">
                      {user.profilePicture}
                    </div>
                    <p className="text-xs text-gray-500">
                      Your profile picture is stored securely in Cloudinary
                    </p>
                  </div>
                )}

                {/* Gender Display (Non-editable) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Gender
                  </label>
                  <div className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium">
                    {user?.gender?.charAt(0).toUpperCase() + user?.gender?.slice(1)}
                  </div>
                  <p className="text-xs text-gray-500">Gender cannot be changed</p>
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    User ID
                  </label>
                  <div className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-mono font-medium">
                    {user?.id}
                  </div>
                  <p className="text-xs text-gray-500">
                    Your unique identifier in the system
                  </p>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Member Since
                  </label>
                  <div className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium">
                    {new Date(user?.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    Joined{" "}
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(user?.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days ago
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isUpdating || isUploadingImage}
                  className="flex-1 bg-green-600 text-white py-4 px-8 rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isUpdating || isUploadingImage) ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isUploadingImage ? 'Uploading...' : 'Updating...'}
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUpdating || isUploadingImage}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-4 px-8 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* My Posts Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Blog Posts</h2>
            <button
              onClick={() => router.push("/create-post")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Write New Post
            </button>
          </div>

          {userPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Posts Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't published any blog posts yet. Start sharing your stories with the community!
              </p>
              <button
                onClick={() => router.push("/create-post")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300">
                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="h-48 overflow-hidden rounded-t-xl">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Post Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                      {post.description}
                    </p>
                    
                    {/* Post Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{safeArrayLength(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{safeArrayLength(post.comments)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/blog/${post.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        View Post
                      </button>
                      <button
                        onClick={() => handleEditPost(post.id)}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                        title="Edit Post"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        disabled={isDeleting === post.id}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Post"
                      >
                        {isDeleting === post.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Deletion Section - Only show for non-admin users */}
        {!isAdmin && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-800 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-red-600 text-sm">
                    Once you delete your account, there is no going back. This will permanently 
                    delete your profile, remove all your blog posts, and cannot be recovered.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Delete Account Dialog */}
            {showDeleteDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                  {/* Dialog Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Delete Your Account
                      </h3>
                      <p className="text-sm text-gray-600">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          This will permanently delete:
                        </h4>
                        <ul className="text-xs text-red-700 space-y-1">
                          <li>• Your profile and account information</li>
                          <li>• All your blog posts ({userPosts.length} posts)</li>
                          <li>• All your comments and likes</li>
                          <li>• Your session and login access</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Password Confirmation */}
                  <div className="space-y-3 mb-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm your password to continue *
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setDeleteError(null);
                      }}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500 transition-colors"
                      disabled={isDeletingAccount}
                      autoFocus
                    />
                    {deleteError && (
                      <p className="text-red-600 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {deleteError}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount || !deletePassword.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isDeletingAccount ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCloseDeleteDialog}
                      disabled={isDeletingAccount}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Additional Warning */}
                  <p className="text-xs text-gray-500 text-center mt-4">
                    You will be logged out immediately after deletion
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Admin Notice - Show for admin users */}
        {isAdmin && (
          <div className="bg-blue-50 rounded-2xl shadow-xl p-8 border border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-800 mb-2">
                  Administrator Account
                </h3>
                <p className="text-blue-600 text-sm">
                  As an administrator, account deletion is disabled to maintain system integrity. 
                  Please contact system support if you need to make changes to your administrator account.
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;