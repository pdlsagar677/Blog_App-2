import { NextResponse } from 'next/server';
import { aboutService } from '@/lib/mongodb/dbService';

// GET /api/about - Get about page content (PUBLIC ACCESS)
export async function GET() {
  try {
    const content = await aboutService.getAboutContent();
    const teamMembers = await aboutService.getAllTeamMembers();
    
    return NextResponse.json({ 
      success: true, 
      content: {
        ...content,
        teamMembers
      }
    });
  } catch (error) {
    console.error('Get about content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}