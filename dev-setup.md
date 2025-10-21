# Local Development Setup

## 🚀 Quick Start

### 1. Start Supabase Local Development
```bash
supabase start
```

### 2. Start Nuxt Development Server
```bash
npm run dev
```

### 3. Access Local Services

- **Application**: http://localhost:3005
- **Supabase Studio**: http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Email Testing (Inbucket)**: http://127.0.0.1:54324

## 📝 Environment Configuration

### Local Environment Variables
The project uses `.env.local` for local development which overrides `.env`:

```bash
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Production Environment
For production, use the actual Supabase project credentials in `.env`:

```bash
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your_production_anon_key_here"
```

## 🗄️ Database Management

### Apply Schema Changes
```bash
# Create new migration
supabase migration new migration_name

# Apply all migrations
supabase db reset

# Generate types from current schema
supabase gen types typescript --local > types/supabase.ts
```

### View Database
- Use Supabase Studio: http://127.0.0.1:54323
- Or connect directly: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### Current Schema
- **users**: User profiles linked to auth.users
- **projects**: Time tracking projects per user
- **stints**: Individual work sessions

## 🔐 Authentication Testing

### Email Testing
- All emails go to Inbucket: http://127.0.0.1:54324
- No external email service needed for development
- Test registration/password reset flows locally

### User Management
- Create test users through the app
- View/manage users in Supabase Studio
- RLS policies ensure data isolation

## 🛠️ Development Workflow

### 1. Schema Changes
1. Edit `supabase/migrations/` files
2. Run `supabase db reset` to apply
3. Update TypeScript types if needed

### 2. Feature Development
1. Ensure Supabase is running: `supabase start`
2. Start Nuxt dev server: `npm run dev`
3. Use Supabase Studio for database inspection

### 3. Production Deployment
1. Apply migrations to production: `supabase db push`
2. Generate production types: `supabase gen types typescript --project-id=YOUR_PROJECT_ID`
3. Deploy with production environment variables

## 🚫 Common Issues

### "Connection refused" errors
- Ensure Supabase is running: `supabase start`
- Check Docker is running
- Restart if needed: `supabase stop && supabase start`

### Schema out of sync
- Reset local database: `supabase db reset`
- This applies all migrations from scratch

### Type errors after schema changes
- Regenerate types: `supabase gen types typescript --local > types/supabase.ts`
- Restart your IDE/TypeScript server