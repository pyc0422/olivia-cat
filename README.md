# Cat Club

Next.js app for the Cat Club site with shared data storage planned on Supabase and deployment on Vercel.

## Local dev

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3001` after the dev server starts.

## Environment variables

Create a local `.env.local` file from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase setup

1. Create a new Supabase project.
2. Run the migration in `supabase/migrations/0001_init.sql`.
3. Enable email confirmation if you want signup verification by email.
4. Keep the member allow-list limited to the names already in the project.

## Vercel setup

1. Import this GitHub repository into Vercel.
2. Add the Supabase URL and anon key as environment variables.
3. Deploy the `main` branch.

## Data rules

- Profiles, messages, drawings, and videos are shared through Supabase.
- Message, drawing, and video tables prune old content after 30 days.
- User profile data is kept even when older content is removed.
