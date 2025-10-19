// components/blog/CreatePostForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useBlogStore } from "@/store/useBlogStore";
import { ArrowLeft, Image, FileText, Send, Upload, X } from "lucide-react";
import Link from "next/link";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function CreatePostForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const { addPost } = useBlogStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setMessage("🔒 Please log in to create a blog post. Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setIsCheckingAuth(false);
    }
  }, [isLoggedIn, router]);

  // Clean up image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageUpload = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' }));
      return;
    }

    // UPDATED: Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setErrors(prev => ({ 
        ...prev, 
        image: `Image size must be less than 10MB (current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)` 
      }));
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Clear any previous image errors
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview("");
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth || !isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="bg-blue-100 p-4 rounded-lg mb-6">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-blue-800 mb-2">Please Wait</h2>
            <p className="text-blue-600">{message || "Checking authentication..."}</p>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!form.content.trim()) {
      newErrors.content = "Content is required";
    } else if (form.content.length < 20) {
      newErrors.content = "Content must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      let finalImageUrl = "";

      // If image file is selected, upload it to Cloudinary
      if (imageFile) {
        const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
        setMessage(`📤 Uploading  image for post...`);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setMessage("✅ Image uploaded! Creating post...");
      }

      // FIXED: Add authorAvatar from user object
      await addPost({
        title: form.title,
        imageUrl: finalImageUrl,
        description: form.description,
        content: form.content,
        authorId: user.id,
        authorName: user.username,
        authorAvatar: user.avatar || "", // ADD THIS LINE
      });

      setMessage("🎉 Blog post created successfully! Redirecting...");
      
      // Reset form
      setForm({
        title: "",
        description: "",
        content: ""
      });
      removeImage();

      // Redirect to blog page after 2 seconds
      setTimeout(() => {
        router.push("/blog");
      }, 2000);

    } catch (error) {
      console.error('Error creating post:', error);
      setMessage("❌ Failed to create blog post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return form.title && form.description && form.content;
  };

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
          <div className="text-right">
            <p className="text-sm text-gray-600">Writing as</p>
            <p className="font-semibold text-gray-900">{user.username}</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-500 p-3 rounded-2xl inline-flex mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Blog Post</h1>
            <p className="text-gray-600">Share your story with the world</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Title *
              </label>
              <input
                type="text"
                placeholder="Enter a compelling title for your blog post"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Image Upload Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4 inline mr-2" />
                Featured Image (Optional)
              </label>
              
              {/* File Upload Area */}
              {!imagePreview && (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                  <p className="text-gray-600 mb-2 text-lg font-medium">Drag & drop an image here</p>
                  <p className="text-gray-500 mb-3">or click to browse files</p>
                  <p className="text-xs text-gray-500">Supports: JPEG, PNG, GIF, WebP (Max 10MB)</p>
                  <p className="text-xs text-blue-500 mt-2">Images are securely uploaded to Cloudinary CDN</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-green-200 shadow-sm"
                      />
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-green-800 font-medium mb-2">
                        Image Ready for Upload
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {imageFile?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {imageFile ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'}
                      </p>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="mt-3 flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {errors.image && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.image}
                </p>
              )}

              {/* Help Text */}
              {!imagePreview && (
                <p className="text-xs text-gray-500 mt-2">
                  ✨ Tip: A compelling featured image can increase engagement with your post
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                placeholder="Write a brief description that will appear in blog listings (minimum 20 characters)"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500 resize-vertical"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {form.description.length}/20 characters (minimum)
                </p>
                {form.description.length >= 20 && (
                  <span className="text-xs text-green-600 font-medium">✓ Good length</span>
                )}
              </div>
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Content *
              </label>
              <textarea
                placeholder="Write your blog post content here... (minimum 50 characters)"
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500 resize-vertical"
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {form.content.length}/50 characters (minimum)
                </p>
                {form.content.length >= 50 && (
                  <span className="text-xs text-green-600 font-medium">✓ Good length</span>
                )}
              </div>
              {errors.content && (
                <p className="mt-2 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                isFormValid() && !isLoading
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Publish Blog Post
                </>
              )}
            </button>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg text-center ${
                message.includes("❌") || message.includes("Failed")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}