# Deployment Guide

Deploy this SSG Nuxt app to Vercel.

## Environment Variables

Set these in Vercel project settings:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** Only use the public anon key, never the service role key.

## Deploy to Vercel

### Option 1: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Add environment variables in project settings
4. Deploy

**Build Settings:**
- Framework Preset: Nuxt.js
- Build Command: `npm run generate`
- Output Directory: `.output/public`

### Option 2: CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in dashboard
# Then deploy to production
vercel --prod
```

## Verify Deployment

After deploying, test:

1. Landing page loads (`/`)
2. Auth flows work (`/auth/login`, `/auth/register`)
3. Protected routes redirect (`/dashboard` → `/auth/login`)
4. Dashboard loads after login
5. Theme toggle works

## Troubleshooting

**Build fails:** Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel environment variables.

**Auth not working:** Verify Supabase email templates and auth providers are configured.

**Routes 404:** Vercel should auto-configure SPA routing. Check build logs.

## Local Testing

```bash
# Build
npm run generate

# Preview
npm run serve
```
