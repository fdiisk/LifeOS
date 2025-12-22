# Life OS

Your personal life operating system.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenRouter API key

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `OPENROUTER_API_KEY`: Your OpenRouter API key

### Development

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the production application:
```bash
npm run build
```

### Deployment

This application is configured for deployment on Vercel.

## Project Structure

```
/app              - Next.js app directory (pages and API routes)
/components       - React components
/lib              - Utility functions and clients (Supabase, OpenRouter)
/db               - Database schemas and migrations
/public           - Static assets
```

## Tech Stack

- **Frontend**: Next.js 16 with App Router, React 19, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter (xiaomi/mimo-v2-flash:free model)
