# Chazon

A full-featured Chazon app built with Next.js, Prisma, and modern web technologies. This platform connects customers with skilled service providers (Stewards) for various everyday tasks.

## 🚀 Features 

### For Customers
- **Service Discovery**: Browse and search through various service categories
- **Steward Profiles**: View detailed profiles with ratings, reviews, and portfolios
- **Booking System**: Schedule services with preferred Stewards
- **Real-time Messaging**: Communicate with Stewards before and during tasks
- **Secure Payments**: Integrated Stripe payment processing
- **Review System**: Rate and review completed services
- **Order Tracking**: Track booking status in real-time

### For Stewards
- **Profile Management**: Create detailed professional profiles
- **Service Listings**: List and manage offered services
- **Availability Management**: Set working hours and availability
- **Earnings Dashboard**: Track income and completed tasks
- **Customer Communication**: Built-in messaging system
- **Portfolio Showcase**: Display work samples and certifications

### Platform Features
- **Authentication**: Multi-provider auth (Google, GitHub, Email/Password)
- **Responsive Design**: Mobile-first, fully responsive UI
- **Real-time Notifications**: Push notifications for important updates
- **Admin Dashboard**: Platform management and analytics
- **Search & Filters**: Advanced search with location and category filters
- **Trust & Safety**: Background checks and verification system

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zustand** - State management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Prisma Studio** - Database GUI

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
No backend services required.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd chazon-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

No environment configuration is necessary for frontend-only mode.

### 4. Mock Data
The app uses in-repo mock data under `data/` and simple client-side stores under `store/`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
chazon-app/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── services/          # Service pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── home/             # Homepage components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users**: Customer and Steward profiles
- **Categories**: Service categories
- **Services**: Individual service listings
- **Bookings**: Service bookings and appointments
- **Reviews**: Customer reviews and ratings
- **Messages**: In-app messaging system
- **Payments**: Payment transactions
- **Notifications**: System notifications

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
```

## 🔐 Authentication

The app uses Clerk for UI and session management, with route protection handled by a Next.js proxy.

- Pages
  - Sign in: `/auth/signin` → [app/auth/signin/[[...index]]/page.tsx](app/auth/signin/[[...index]]/page.tsx)
  - Sign up: `/auth/signup` → [app/auth/signup/[[...index]]/page.tsx](app/auth/signup/[[...index]]/page.tsx)
- Post-auth redirects
  - After sign-in: `/dashboard`
  - After sign-up: `/dashboard`
- Route guards
  - Guarded routes via `proxy.ts`: `/dashboard`, `/settings`, `/profile`, `/admin`, `/bookings`
  - Unauthenticated access redirects to the sign-in page
- Auth page behavior
  - If already authenticated, visiting `/auth/*` redirects to `/dashboard`
- Configuration notes
  - ClerkProvider is initialized in `app/layout.tsx`
  - Authorized callback (lib/auth.config.ts) and helper middleware (lib/supabase/middleware.ts) align with the `/dashboard` landing

### Testing the flow
1. Sign-out and open a private window.
2. Visit `/auth/signin` and complete auth → redirected to `/dashboard`.
3. Visit `/dashboard` while signed out → redirected to `/auth/signin`.
4. Attempt `/auth/signin` while signed in → redirected to `/dashboard`.

## 💳 Payment Integration
Not applicable in frontend-only mode.

## 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- [Shadcn/ui](https://ui.shadcn.com) for UI components
- [Lucide](https://lucide.dev) for icons
- [Unsplash](https://unsplash.com) for sample images

## ⭐ Featured Stewards Criteria

Stewards must meet the following criteria to appear in the "Featured Stewards" section on the homepage:

1. **Background Check Status**: Must be `CLEARED` (verified stewards only)
2. **Minimum Rating**: Must have a rating of **4.0 or higher** (default, configurable via API)
3. **Completed Tasks**: Must have completed at least **10 tasks** (default, configurable via API)

Stewards are sorted by:
- Rating (highest first)
- Completed tasks (most first)
- Creation date (newest first, as fallback)

**API Endpoint**: `/api/stewards`
- Query parameters:
  - `limit` (default: 4) - Number of stewards to return
  - `minRating` (default: 4.0) - Minimum rating threshold
  - `minCompletedTasks` (default: 10) - Minimum completed tasks required

## 📞 Support

If you have any questions or need help with setup, please open an issue or contact the development team.

---

**Note**: This is an educational project and is not affiliated with any existing platform.
