// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/mongodb/dbService";
import { deleteFromCloudinary, getPublicIdFromUrl, isCloudinaryUrl } from "@/lib/cloudinary";

// GET /api/posts - Get all posts
export async function GET() {
  try {
    const posts = await blogService.getAllPosts();
    
    // Convert Date objects to ISO strings for client
    const formattedPosts = posts.map(post => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      comments: post.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString()
      }))
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, imageUrl, description, content, authorId, authorName } = body;

    console.log("Creating post with data:", { title, authorId, authorName });

    // Validate required fields
    if (!title?.trim() || !content?.trim() || !authorId || !authorName) {
      return NextResponse.json(
        { error: "Title, content, authorId, and authorName are required" },
        { status: 400 }
      );
    }

    const newPost = await blogService.createPost({
      title: title.trim(),
      imageUrl: imageUrl?.trim() || "",
      description: description?.trim() || "",
      content: content.trim(),
      authorId,
      authorName,
    });

    console.log("Post created successfully:", newPost.id);

    // Format the response for client
    const formattedPost = {
      ...newPost,
      createdAt: newPost.createdAt.toISOString(),
      comments: newPost.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString()
      }))
    };

    return NextResponse.json(
      { 
        post: formattedPost, 
        message: "Post created successfully" 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

// PUT /api/posts - Update a post
export async function PUT(request: NextRequest) {
  try {
    const { postId, updates } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Get current post to check if we need to delete old image from Cloudinary
    const currentPost = await blogService.getPostById(postId);
    
    // If updating image and old image exists and is from Cloudinary, delete it
    if (updates.imageUrl && currentPost?.imageUrl) {
      const isCloudinary = await isCloudinaryUrl(currentPost.imageUrl);
      if (isCloudinary) {
        const publicId = await getPublicIdFromUrl(currentPost.imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
            console.log(`Deleted old Cloudinary image: ${publicId}`);
          } catch (error) {
            console.error('Error deleting old Cloudinary image:', error);
            // Continue with update even if image deletion fails
          }
        }
      }
    }

    const success = await blogService.updatePost(postId, updates);

    if (!success) {
      return NextResponse.json(
        { error: "Post not found or no changes made" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Post updated successfully" 
    });
  } catch (error: any) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts - Delete a specific post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const authorId = searchParams.get('authorId');

    // Delete specific post
    if (postId) {
      // Get post first to delete image from Cloudinary
      const post = await blogService.getPostById(postId);
      
      // Delete image from Cloudinary if it exists and is from Cloudinary
      if (post?.imageUrl) {
        const isCloudinary = await isCloudinaryUrl(post.imageUrl);
        if (isCloudinary) {
          const publicId = await getPublicIdFromUrl(post.imageUrl);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
              console.log(`Deleted Cloudinary image: ${publicId}`);
            } catch (error) {
              console.error('Error deleting Cloudinary image:', error);
              // Continue with post deletion even if image deletion fails
            }
          }
        }
      }

      const success = await blogService.deletePost(postId);

      if (!success) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Post deleted successfully" 
      });
    }

    // Delete all posts by author
    if (authorId) {
      // Get all posts by author to delete their images from Cloudinary
      const authorPosts = await blogService.getPostsByAuthor(authorId);
      
      // Delete all Cloudinary images for this author's posts
      for (const post of authorPosts) {
        if (post.imageUrl) {
          const isCloudinary = await isCloudinaryUrl(post.imageUrl);
          if (isCloudinary) {
            const publicId = await getPublicIdFromUrl(post.imageUrl);
            if (publicId) {
              try {
                await deleteFromCloudinary(publicId);
                console.log(`Deleted Cloudinary image: ${publicId}`);
              } catch (error) {
                console.error('Error deleting Cloudinary image:', error);
                // Continue with deletion even if some images fail
              }
            }
          }
        }
      }

      const success = await blogService.deletePostsByAuthor(authorId);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to delete posts by author" },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "All posts by author deleted successfully" 
      });
    }

    return NextResponse.json(
      { error: "Either post ID or author ID is required" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}