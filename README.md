# 🎬 Hyperbeam Watch Party

A Next.js application for shared virtual browsing using the Hyperbeam API. Perfect for watching movies together remotely!

## What is This?

This is a POC (Proof of Concept) app that uses [Hyperbeam](https://hyperbeam.com) to create a shared virtual browser session. Both you and your girlfriend can access the same browser from different devices and control it together - perfect for watching content on sites like fmovies.com.

## How It Works

1. **Create Session**: Click "Create New Session" to spin up a virtual browser in the cloud
2. **Auto Share**: URL automatically updates with session info
3. **Copy & Share**: Click "Copy Share Link" and send to your GF
4. **Auto Join**: When she opens the link, she automatically joins your session!
5. **Watch Together**: Both control the same browser and watch synchronized content

### Session Persistence
- **URL Sharing**: Sessions are encoded in the URL for easy sharing
- **Auto-Restore**: Refresh within 1 hour? Your session automatically restores!
- **Smart Detection**: App detects existing sessions and joins them instead of creating new ones

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Hyperbeam API Key

1. Sign up at [Hyperbeam Dashboard](https://hyperbeam.com/dashboard)
2. Create a new API key
3. Copy your API key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
HYPERBEAM_API_KEY=your_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Quick Start (Watch Together)

1. **Create Session**
   - Click "Create New Session"
   - Wait for virtual browser to load (5-10 seconds)

2. **Share Link**
   - Click "📋 Copy Share Link" button
   - Send the copied link to your GF (text, Discord, etc.)

3. **She Joins Automatically**
   - She opens the link → automatically joins your session
   - You'll see "👥 Joined Session" indicator

4. **Watch Together**
   - Navigate to `https://fmovies.com` or any streaming site
   - Both of you see and control the same browser!
   - Start a video - both watch synchronized!

### Session Management

- **� Sessions Button**: View all active sessions (top-right)
- **🔌 Disconnect**: End current session
- **⚠️ Disconnect All**: Terminate all sessions at once
- **🔄 New Session**: Start fresh session
- **Auto-Restore**: Refresh? Session restores (1 hour)
- **URL Sharing**: Session is in the URL - share the link!

See [SESSION_SHARING.md](./SESSION_SHARING.md) for sharing and [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) for session control.

## Features

- ✅ **Auto Session Detection** - Detects and joins existing sessions
- ✅ **URL-based Sharing** - Share link, friend auto-joins!
- ✅ **Session Persistence** - Auto-restores on refresh (1 hour)
- ✅ **Session Manager** - View and disconnect all active sessions
- ✅ **Real-time Control** - Multiple users control simultaneously
- ✅ **Synchronized Playback** - Video syncs for all viewers
- ✅ **Copy Share Link** - One-click link copying
- ✅ **Disconnect Controls** - End current or all sessions
- ✅ **Connection Monitoring** - Live status indicators
- ✅ **URL Navigation** - Quick site access
- ✅ **Clean UI** - Modern, intuitive interface

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Hyperbeam Web SDK** - Virtual browser embedding

## Important Notes

### Session Sharing
- Both users need to access the **same URL** with the **same session**
- Sessions are temporary (default: 5 minute inactive timeout)
- For production use, you'd want to implement session persistence

### Current Limitations (POC Phase)
- ~~Sessions are not persisted~~ ✅ **FIXED** - Now persists in URL & localStorage!
- ~~Basic URL sharing~~ ✅ **FIXED** - One-click copy & auto-join!
- No user authentication (anyone with link can join)
- No database storage (sessions expire with inactivity)
- Runs on localhost (needs deployment for remote access)

## Next Steps for Production

To make this production-ready for watching with your GF remotely:

1. **Deploy the App**
   - Deploy to Vercel/Netlify so you both can access it remotely
   - Set `HYPERBEAM_API_KEY` in your deployment environment

2. **Add Session Persistence**
   - Store session IDs in a database
   - Create shareable room links (e.g., `/room/abc123`)

3. **Add User Authentication**
   - Implement login to identify users
   - Control permissions (who can navigate, etc.)

4. **Improve UX**
   - Add chat functionality
   - Add presence indicators (show who's online)
   - Add notifications

## Troubleshooting

### "HYPERBEAM_API_KEY not configured" Error
- Make sure you created `.env.local` file
- Verify the API key is correct
- Restart the dev server after adding env vars

### Virtual Browser Not Loading
- Check your Hyperbeam API key is valid
- Ensure you have credits in your Hyperbeam account
- Check browser console for errors

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- The `@hyperbeam/web` package should be in `node_modules`

## Resources

- [Hyperbeam Documentation](https://docs.hyperbeam.com)
- [Hyperbeam JavaScript SDK](https://docs.hyperbeam.com/client-sdk/javascript/overview)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This is a personal POC project. Use responsibly and in accordance with content platform terms of service.
