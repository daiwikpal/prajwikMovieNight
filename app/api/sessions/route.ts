import { NextResponse } from 'next/server';

// Get all active sessions
export async function GET() {
  const apiKey = process.env.HYPERBEAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'HYPERBEAM_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Hyperbeam returns { results: [...], next: "..." }
    // Transform to match our expected format
    const sessions = (data.results || []).map((session: any) => ({
      session_id: session.id,
      created_at: session.creation_date,
      ...session
    }));
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Delete all active sessions
export async function DELETE() {
  const apiKey = process.env.HYPERBEAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'HYPERBEAM_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    // First, get all active sessions
    const listResponse = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${error}` },
        { status: listResponse.status }
      );
    }

    const data = await listResponse.json();
    const sessions = data.results || [];
    
    if (sessions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active sessions to terminate',
        count: 0 
      });
    }
    
    // Terminate each session (use 'id' field from Hyperbeam response)
    const deletePromises = sessions.map((session: any) =>
      fetch(`https://engine.hyperbeam.com/v0/vm/${session.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }).catch(err => {
        console.error(`Failed to terminate session ${session.id}:`, err);
        return null;
      })
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ 
      success: true, 
      message: `Terminated ${sessions.length} session(s)`,
      count: sessions.length 
    });
  } catch (error) {
    console.error('Error terminating all sessions:', error);
    return NextResponse.json(
      { error: 'Failed to terminate all sessions' },
      { status: 500 }
    );
  }
}
