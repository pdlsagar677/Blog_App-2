// src/app/api/admin/about/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionService, userService, aboutService } from '@/lib/mongodb/dbService';

// Use the same authentication pattern as your posts route
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

// GET /api/admin/about - Get all about page content and team members (ADMIN ONLY)
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const content = await aboutService.getAboutContent();
    const teamMembers = await aboutService.getAllTeamMembers();
    
    return NextResponse.json({ 
      success: true, 
      content: {
        ...content,
        teamMembers
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get about content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/about - Update about page content (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, content, action, teamMember } = body;

    // Handle team member creation
    if (action === 'createTeamMember' && teamMember) {
      const { name, position, bio, imageUrl, email, socialLinks, order } = teamMember;

      if (!name || !position || !bio) {
        return NextResponse.json(
          { error: 'Name, position, and bio are required' },
          { status: 400 }
        );
      }

      const result = await aboutService.createTeamMember({
        name,
        position,
        bio,
        imageUrl: imageUrl || '/images/default-avatar.png',
        email,
        socialLinks,
        order: order || 0,
        isActive: true,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        member: result.member 
      }, { status: 200 });
    }

    // Handle section update
    if (!section || !content) {
      return NextResponse.json(
        { error: 'Section and content are required' },
        { status: 400 }
      );
    }

    const updateData = { [section]: content };
    const result = await aboutService.updateAboutContent(updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Update about content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/about - Update multiple sections or team member (ADMIN ONLY)
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates, action, teamMemberId, teamMemberUpdates } = body;

    // Handle team member update
    if (action === 'updateTeamMember' && teamMemberId && teamMemberUpdates) {
      const result = await aboutService.updateTeamMember(teamMemberId, teamMemberUpdates);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        member: result.member 
      }, { status: 200 });
    }

    // Handle multiple sections update
    if (!updates) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      );
    }

    const result = await aboutService.updateAboutContent(updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Update about content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/about - Delete team member (ADMIN ONLY)
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teamMemberId } = body;

    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    const result = await aboutService.deleteTeamMember(teamMemberId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/about - For reordering team members (ADMIN ONLY)
export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'Ordered IDs array is required' },
        { status: 400 }
      );
    }

    const result = await aboutService.reorderTeamMembers(orderedIds);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Reorder team members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}