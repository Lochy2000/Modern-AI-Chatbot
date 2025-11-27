# Modern AI Chatbot

A full-featured AI chatbot built with Next.js 15, React 19, Prisma, NextAuth.js, and OpenRouter AI.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/lochlanns-projects/v0-modern-ai-chatbot-interface-tem)

## Features

- 🤖 **Real AI Chat** - Powered by OpenRouter with streaming responses
- 🔐 **Authentication** - Secure login with Google and GitHub OAuth via NextAuth.js
- 💾 **Persistent Storage** - All conversations and messages saved to PostgreSQL database
- 📁 **Organization** - Folders and templates for organizing your conversations
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode support
- ⚡ **Real-time Streaming** - See AI responses appear in real-time
- 🔍 **Search** - Find conversations quickly with built-in search

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Prisma Accelerate)
- **Authentication**: NextAuth.js with OAuth providers
- **AI**: OpenRouter API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A PostgreSQL database (or use Prisma Accelerate)
- OpenRouter API key
- OAuth credentials (Google and/or GitHub)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Modern-AI-Chatbot
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` with your credentials:
- `OPEN_ROUTER_API_KEY` - Get from [OpenRouter](https://openrouter.ai/keys)
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - From [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `GITHUB_ID` & `GITHUB_SECRET` - From [GitHub Developer Settings](https://github.com/settings/developers)

4. Set up the database:
```bash
npx prisma generate --no-engine
npx prisma migrate dev --name init
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses the following database models:

- **User** - Authentication and user data
- **Account** - OAuth account linking
- **Session** - User sessions
- **Conversation** - Chat conversations
- **Message** - Individual chat messages
- **Folder** - Conversation organization
- **Template** - Reusable message templates

## Environment Variables

Required environment variables (see `.env.example`):

- `OPEN_ROUTER_API_KEY` - Your OpenRouter API key
- `DATABASE_URL` - PostgreSQL database connection string
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js session encryption
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `GITHUB_ID` - GitHub OAuth client ID (optional)
- `GITHUB_SECRET` - GitHub OAuth client secret (optional)

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy!

Make sure to:
- Set up a production PostgreSQL database
- Update `NEXTAUTH_URL` to your production URL
- Add OAuth redirect URIs in Google/GitHub settings pointing to your production URL

## Development

The project structure:

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js
│   │   ├── chat/          # AI chat endpoint
│   │   ├── conversations/ # Conversation CRUD
│   │   ├── messages/      # Message CRUD
│   │   ├── folders/       # Folder CRUD
│   │   └── templates/     # Template CRUD
│   ├── login/             # Login page
│   └── page.tsx           # Main app page
├── components/            # React components
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth config
│   └── prisma.ts         # Prisma client
└── prisma/               # Database schema and migrations
```

## How It Works

1. **Authentication Flow**:
   - Users land on the app and are redirected to `/login`
   - They can sign in with Google or GitHub
   - NextAuth.js creates a session and stores user data in the database

2. **Chat Flow**:
   - User creates a new conversation or selects an existing one
   - When sending a message:
     - Message is saved to the database
     - Sent to OpenRouter AI with conversation history
     - AI response streams back in real-time
     - Response is saved to the database

3. **Data Persistence**:
   - All conversations, messages, folders, and templates are stored in PostgreSQL
   - Data is fetched on page load and updated in real-time
   - Changes sync to the database immediately

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
