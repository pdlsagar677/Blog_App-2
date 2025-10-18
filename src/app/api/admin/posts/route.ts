// src/app/api/admin/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { sessionService, userService, blogService } from "@/lib/mongodb/dbService";

// Use the same checkAdminAccess function from your users route
async function checkAdminAccess(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

  if (!authToken) {
    return { isAdmin: false, error: 'Unauthorized' };
  }

  const session = await sessionService.getSession(authToken);
  if (!session) {
    return { isAdmin: false, error: 'Invalid session' };
  }

  const user = await userService.findUserById(session.userId);
  if (!user || !user.isAdmin) {
    return { isAdmin: false, error: 'Admin access required' };
  }

  return { isAdmin: true, adminUser: user };
}

// GET /api/admin/posts - Get all posts
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const posts = await blogService.getAllPosts();

    return NextResponse.json({
      success: true,
      posts: posts.map(post => ({
        ...post,
        likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
        commentsCount: Array.isArray(post.comments) ? post.comments.length : 0
      })),
      total: posts.length
    }, { status: 200 });

  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/posts - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
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
      message: "Post deleted successfully",
      deletedPostId: postId
    }, { status: 200 });

  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/posts - Update a post
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const { postId, updates } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
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
    }, { status: 200 });

  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}