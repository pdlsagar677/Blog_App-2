// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { sessionService, userService, adminService, blogService } from "@/lib/mongodb/dbService";

// Helper function to check if user is admin
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

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    // Get query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const result = await adminService.getAllUsers(page, limit, search);

    return NextResponse.json({
      users: result.users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }),
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
      hasNext: (page * limit) < result.total,
      hasPrev: page > 1
    }, { status: 200 });

  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const userData = await request.json();

    const result = await adminService.createUser(userData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: result.user
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const result = await adminService.updateUser(userId, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "User updated successfully",
        user: result.user 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const result = await adminService.deleteUser(userId, adminCheck.adminUser!.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "User account deleted successfully",
        deletedUserId: userId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'toggleAdmin':
        result = await adminService.toggleAdminStatus(userId, adminCheck.adminUser!.id);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "User updated successfully",
        user: result.user 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Patch user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}