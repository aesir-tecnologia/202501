# Development Setup

## 🚀 Quick Start

### 1. Configure Environment Variables
Create a `.env` file with your remote Supabase development project credentials:

```bash
SUPABASE_URL="https://your-dev-project-id.supabase.co"
SUPABASE_ANON_KEY="your_dev_supabase_anon_key_here"
```

### 2. Start Nuxt Development Server
```bash
npm run dev
```

### 3. Access Development Services

- **Application**: http://localhost:3005
- **Supabase Dashboard**: https://supabase.com/dashboard/project/your-project-id
- **API**: Your Supabase project API URL

## 📝 Environment Configuration

### Development Environment Variables
The project uses `.env` for development with remote Supabase:

```bash
SUPABASE_URL="https://your-dev-project-id.supabase.co"
SUPABASE_ANON_KEY="your_dev_supabase_anon_key_here"
```

### Production Environment
For production, use the production Supabase project credentials in your deployment platform (e.g., Vercel):

```bash
SUPABASE_URL="https://your-production-project-id.supabase.co"
SUPABASE_ANON_KEY="your_production_anon_key_here"
```

## 🗄️ Database Management

### Apply Schema Changes
```bash
# Create new migration
supabase migration new migration_name

# Apply migrations to remote development database
supabase db push

# Generate types from remote schema
npm run supabase:types
```

### View Database
- Use Supabase Dashboard: https://supabase.com/dashboard/project/your-project-id
- Navigate to the SQL Editor or Table Editor to inspect your database

### Current Schema
- **users**: User profiles linked to auth.users
- **projects**: Time tracking projects per user
- **stints**: Individual work sessions

## 🔐 Authentication Testing

### Email Testing
- Configure email templates in Supabase Dashboard under Authentication > Email Templates
- Use Supabase's built-in email service or configure SMTP for development
- Test registration/password reset flows with real email addresses

### User Management
- Create test users through the app registration flow
- View/manage users in Supabase Dashboard under Authentication > Users
- RLS policies ensure data isolation between users

## 🛠️ Development Workflow

### 1. Schema Changes
1. Edit `supabase/migrations/` files
2. Apply migrations to remote development database: `supabase db push`
3. Update TypeScript types: `npm run supabase:types`

### 2. Feature Development
1. Ensure `.env` file is configured with remote Supabase credentials
2. Start Nuxt dev server: `npm run dev`
3. Use Supabase Dashboard for database inspection and testing

### 3. Production Deployment
1. Apply migrations to production: `supabase db push --linked` (with production project linked)
2. Generate production types: `supabase gen types typescript --project-id=YOUR_PRODUCTION_PROJECT_ID > app/types/database.types.ts`
3. Deploy with production environment variables configured in your hosting platform

## 🚫 Common Issues

### "Connection refused" or authentication errors
- Verify `.env` file contains correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check that your Supabase project is active and accessible
- Ensure you're using the correct project credentials (development vs production)

### Schema out of sync
- Apply pending migrations: `supabase db push`
- Check migration status in Supabase Dashboard under Database > Migrations
- Verify all migration files are present in `supabase/migrations/`

### Type errors after schema changes
- Regenerate types: `npm run supabase:types`
- Restart your IDE/TypeScript server
- Ensure your Supabase project is linked: `supabase link --project-ref your-project-ref`