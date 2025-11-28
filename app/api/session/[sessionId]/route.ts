import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const apiKey = process.env.HYPERBEAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'HYPERBEAM_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const { sessionId } = await params;
    
    // Terminate the session via Hyperbeam API
    const response = await fetch(
      `https://engine.hyperbeam.com/v0/vm/${sessionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to terminate session: ${error}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}
