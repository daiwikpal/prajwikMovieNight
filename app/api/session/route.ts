import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.HYPERBEAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'HYPERBEAM_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Optional: specify initial URL
        // start_url: 'https://example.com'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Hyperbeam API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating Hyperbeam session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to create a new Hyperbeam session' },
    { status: 405 }
  );
}
