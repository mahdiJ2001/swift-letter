# Swift Letter - Cover Letter Generator

A modern Next.js application for generating personalized cover letters using AI, built with Supabase backend.

## Features

- ✨ AI-powered cover letter generation
- 🔐 Authentication with Supabase Auth
- 👤 User profile management
- 💳 Credit-based pricing system
- 📱 Responsive design inspired by NaturalWrite
- 🗄️ Database management with Supabase
- 📝 Feedback system for user input

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **UI Components**: Lucide React icons
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd swift-letter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up the database:
Run the SQL migration in your Supabase dashboard:
```sql
-- Run the contents of supabase/migrations/001_initial_schema.sql
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
swift-letter/
├── app/                    # Next.js 13+ app router
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile page
│   ├── pricing/           # Pricing page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
├── supabase/             # Database migrations
└── public/               # Static assets
```

## Database Schema

### Tables

- **user_profiles**: User information and profile data
- **generated_letters**: Stored cover letters
- **user_feedback**: User feedback and ratings
- **stats**: Application statistics

### Key Features

- Row Level Security (RLS) enabled
- Automatic timestamp updates
- User type restrictions
- Credit system for letter generation

## Supabase Configuration

The application uses Supabase for:
- User authentication
- Database operations
- Row-level security
- Real-time subscriptions

Make sure to:
1. Enable RLS on all tables
2. Set up the authentication policies
3. Configure email authentication
4. Add the provided SQL migration

## Development

### Running the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Database Operations

```bash
# Generate TypeScript types from Supabase schema
npm run db:generate
```

## Deployment

1. Deploy to Vercel, Netlify, or your preferred platform
2. Set environment variables in your deployment platform
3. Make sure your Supabase project is configured for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@swiftletter.com or create an issue on GitHub.# swift-letter
