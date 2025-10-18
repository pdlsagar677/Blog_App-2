// app/api/posts/[id]/route.ts - Complete fixed version with Cloudinary
import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/mongodb/dbService";
import { cookies } from 'next/headers';
import { sessionService, userService } from "@/lib/mongodb/dbService";
import { deleteFromCloudinary, getPublicIdFromUrl, isCloudinaryUrl } from "@/lib/cloudinary";

// Helper function to check authentication and authorization
async function checkAuthAndPostOwnership(postId: string, requireOwnership: boolean = false) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

  if (!authToken) {
    return { success: false, error: "Unauthorized - Please log in", status: 401 };
  }

  const session = await sessionService.getSession(authToken);
  if (!session) {
    return { success: false, error: "Invalid session", status: 401 };
  }

  const currentUser = await userService.findUserById(session.userId);
  if (!currentUser) {
    return { success: false, error: "User not found", status: 404 };
  }

  // If ownership is required, check if user owns the post or is admin
  if (requireOwnership) {
    const post = await blogService.getPostById(postId);
    if (!post) {
      return { success: false, error: "Post not found", status: 404 };
    }

    if (post.authorId !== currentUser.id && !currentUser.isAdmin) {
      return { success: false, error: "You can only edit your own posts", status: 403 };
    }
  }

  return { 
    success: true, 
    user: currentUser,
    session 
  };
}

// GET - Get specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await blogService.getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Format dates for JSON serialization
    const formattedPost = {
      ...post,
      createdAt: post.createdAt.toISOString(),
      comments: post.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString()
      }))
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error: any) {
    console.error(`Error in GET /api/posts/[id]:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT - Update post with Cloudinary support
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;

  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    // Check authentication and ownership
    const authCheck = await checkAuthAndPostOwnership(id, true);
    if (!authCheck.success) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 401 }
      );
    }

    const body = await request.json();
    const { title, imageUrl, description, content } = body;

    console.log("🔄 PUT request received:", { id, updates: body });

    // Validate that we have at least one field to update
    if (!title?.trim() && !content?.trim() && !description?.trim() && imageUrl === undefined) {
      return NextResponse.json(
        { error: "At least one field is required for update" },
        { status: 400 }
      );
    }

    // Get current post to handle Cloudinary image cleanup
    const currentPost = await blogService.getPostById(id);
    if (!currentPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Handle Cloudinary image cleanup if updating image
    if (imageUrl !== undefined && imageUrl !== currentPost.imageUrl) {
      // If old image exists and is from Cloudinary, delete it
      if (currentPost.imageUrl) {
        const isCloudinary = await isCloudinaryUrl(currentPost.imageUrl);
        if (isCloudinary) {
          const publicId = await getPublicIdFromUrl(currentPost.imageUrl);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
              console.log(`🗑️ Deleted old Cloudinary image: ${publicId}`);
            } catch (error) {
              console.error('❌ Error deleting old Cloudinary image:', error);
              // Continue with update even if image deletion fails
            }
          }
        }
      }
    }

    const updates: any = {};
    if (title?.trim()) updates.title = title.trim();
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (description?.trim()) updates.description = description.trim();
    if (content?.trim()) updates.content = content.trim();

    console.log("📝 Processing updates:", updates);

    const success = await blogService.updatePost(id, updates);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update post - post may not exist or no changes made" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: "Post updated successfully" 
    });
  } catch (error: any) {
    console.error("❌ Error in PUT /api/posts/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete post with Cloudinary cleanup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;

  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    // Check authentication and ownership
    const authCheck = await checkAuthAndPostOwnership(id, true);
    if (!authCheck.success) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 401 }
      );
    }

    console.log("🗑️ DELETE request received for post:", id);

    // Get post first to handle Cloudinary image cleanup
    const post = await blogService.getPostById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary if it exists and is from Cloudinary
    if (post.imageUrl) {
      const isCloudinary = await isCloudinaryUrl(post.imageUrl);
      if (isCloudinary) {
        const publicId = await getPublicIdFromUrl(post.imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
            console.log(`🗑️ Deleted Cloudinary image: ${publicId}`);
          } catch (error) {
            console.error('❌ Error deleting Cloudinary image:', error);
            // Continue with post deletion even if image deletion fails
          }
        }
      }
    }

    const success = await blogService.deletePost(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete post - post may not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: "Post deleted successfully" 
    });
  } catch (error: any) {
    console.error("❌ Error in DELETE /api/posts/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}

// PATCH - For comments, likes, etc. (your existing PATCH method remains the same)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;

  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    // Check authentication
    const authCheck = await checkAuthAndPostOwnership(id);
    if (!authCheck.success) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 401 }
      );
    }

    const currentUser = authCheck.user!;
    const body = await request.json();
    const { action, userId, commentId, commentData } = body;

    console.log('🔄 PATCH request:', { 
      postId: id, 
      action, 
      commentId,
      user: currentUser.username 
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "like":
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for like action" },
            { status: 400 }
          );
        }
        if (userId !== currentUser.id) {
          return NextResponse.json(
            { error: "Cannot like post as another user" },
            { status: 403 }
          );
        }
        const likeSuccess = await blogService.likePost(id, userId);
        if (!likeSuccess) {
          return NextResponse.json(
            { error: "Failed to like post" },
            { status: 400 }
          );
        }
        return NextResponse.json({ message: "Post liked successfully" });

      case "unlike":
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for unlike action" },
            { status: 400 }
          );
        }
        if (userId !== currentUser.id) {
          return NextResponse.json(
            { error: "Cannot unlike post as another user" },
            { status: 403 }
          );
        }
        const unlikeSuccess = await blogService.unlikePost(id, userId);
        if (!unlikeSuccess) {
          return NextResponse.json(
            { error: "Failed to unlike post" },
            { status: 400 }
          );
        }
        return NextResponse.json({ message: "Post unliked successfully" });

      case "add-comment":
        if (!commentData?.text?.trim() || !commentData?.authorId || !commentData?.authorName) {
          return NextResponse.json(
            { error: "Comment text, authorId, and authorName are required" },
            { status: 400 }
          );
        }
        if (commentData.authorId !== currentUser.id) {
          return NextResponse.json(
            { error: "Cannot add comment as another user" },
            { status: 403 }
          );
        }

        const addResult = await blogService.addComment(id, {
          text: commentData.text.trim(),
          authorId: commentData.authorId,
          authorName: commentData.authorName,
        });

        if (!addResult.success) {
          return NextResponse.json(
            { error: addResult.error || "Failed to add comment" },
            { status: 400 }
          );
        }

        return NextResponse.json({ 
          message: "Comment added successfully",
          comment: {
            ...addResult.comment,
            createdAt: addResult.comment!.createdAt.toISOString()
          }
        });

      case "delete-comment":
        if (!commentId) {
          return NextResponse.json(
            { error: "Comment ID is required for delete action" },
            { status: 400 }
          );
        }
        
        console.log("🗑️ Deleting comment:", { postId: id, commentId });
        
        const post = await blogService.getPostById(id);
        if (!post) {
          return NextResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        }

        const commentToDelete = post.comments.find(comment => comment.id === commentId);
        if (!commentToDelete) {
          return NextResponse.json(
            { error: "Comment not found in this post" },
            { status: 404 }
          );
        }

        if (commentToDelete.authorId !== currentUser.id && !currentUser.isAdmin) {
          return NextResponse.json(
            { error: "You can only delete your own comments" },
            { status: 403 }
          );
        }

        const deleteResult = await blogService.deleteComment(id, commentId);
        if (!deleteResult.success) {
          return NextResponse.json(
            { error: deleteResult.error || "Failed to delete comment" },
            { status: 400 }
          );
        }

        return NextResponse.json({ 
          message: "Comment deleted successfully"
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error(`❌ Error in PATCH /api/posts/${id ?? "unknown"}:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}