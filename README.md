# 🏰 Family Quests

A gamified family chore management application that transforms household tasks into exciting adventures. Parents create quests (chores), children complete them to earn points, and redeem those points for rewards from the family treasury.

**Live Demo**: https://family-quests.vercel.app

## 🎮 What is Family Quests?

Family Quests reimagines household chores through the lens of a fantasy adventure game. It creates a positive, reward-based ecosystem where:

- **Children (Adventurers)** receive daily quests, complete them for points, and redeem treasures from the family treasury
- **Parents (Quest Masters)** manage quests, approve completions, define rewards, and track family progress
- **Families** collaborate together with a shared sense of accomplishment and mutual accountability

The app is designed to be simple enough for young children (4+) to use independently on mobile/tablet devices while providing powerful management tools for busy parents.

## ✨ Key Features

### For Children
- 📋 **Today's Quest Log** - Visual dashboard showing assigned daily quests
- ✅ **Quest Completion** - Submit completed quests for parent approval with celebratory animations
- 🏆 **The Treasury** - Browse and redeem rewards using earned points
- 👤 **Family Hall of Heroes** - View family members and profiles

### For Parents
- 🎯 **Quest Board** - Create, edit, and manage quests with rapid inline editing
- 📊 **Quest Lifecycle** - Set frequency (daily, weekly, etc.), point values, icons, and assignments
- ✔️ **Approval Workflow** - Review submitted quests and approve/reject with point awards
- 💎 **Treasury Management** - Create and manage rewards with point costs
- 👨‍👩‍👧‍👦 **Family Setup** - Create families, add children, manage user permissions

### Cross-Platform
- 📱 **Mobile & Tablet Optimized** - Responsive design for young users
- 🔐 **Secure Authentication** - Google OAuth for parents, unique permalinks for children
- 🖼️ **Profile Photos** - Users can upload custom profile pictures
- ⚡ **Real-Time Sync** - Parent changes reflected instantly on child devices

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Next.js 15 | Full-stack React framework |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **API** | tRPC | End-to-end type-safe APIs |
| **Database** | Prisma + PostgreSQL | Type-safe database ORM |
| **Authentication** | NextAuth.js | Secure user authentication |
| **Deployment** | Vercel | Serverless hosting |
| **File Storage** | Vercel Blob | Profile photo storage |
| **UI Components** | Radix UI + shadcn/ui | Accessible component library |

## 🏗️ Architecture

Family Quests follows the **T3 Stack** principles with:

- **Monorepo Structure**: Single Next.js application with shared types
- **Serverless API**: tRPC procedures deployed as Vercel Functions
- **Type Safety**: End-to-end types from database schema to frontend
- **Real-Time Capabilities**: Built-in support for live updates between parent and child interfaces

```
┌─────────────────────────────────────────────┐
│         User's Browser (Mobile/Web)         │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼──────┐        ┌──────▼─────┐
    │ Next.js   │        │ NextAuth.js │
    │ Frontend  │        │ (Google)    │
    └────┬──────┘        └─────────────┘
         │
    ┌────▼──────────────────────────────┐
    │   tRPC API (Vercel Functions)     │
    └────┬───────────────────┬──────────┘
         │                   │
    ┌────▼────────┐   ┌─────▼─────────┐
    │ Prisma ORM  │   │ Vercel Blob   │
    │ PostgreSQL  │   │ (Photo Store) │
    └─────────────┘   └───────────────┘
```

## 📊 Database Schema

Key models include:

- **Family** - Group of users collaborating together
- **User** - Family members (PARENT or CHILD role)
- **Quest** - Tasks/chores with point values and frequency
- **QuestAssignment** - Links quests to children
- **QuestCompletion** - Tracks submission and approval of quest completions
- **Reward** - Treasures children can redeem
- **RewardRedemption** - Tracks point redemptions and fulfillment

See [docs/prd.md](docs/prd.md) for complete functional requirements and user stories.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or use Vercel Postgres)
- Google OAuth credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/muzzamilkhan/family-quests.git
cd family-quests

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your values:
# - DATABASE_URL (PostgreSQL connection)
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# - NEXTAUTH_SECRET and NEXTAUTH_URL
# - BLOB_READ_WRITE_TOKEN (for Vercel Blob)

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Database Studio

To view and manage your database in a visual interface:

```bash
npm run db:studio
```

## 📚 Documentation

- **[Product Requirements (PRD)](docs/prd.md)** - Complete product specification, user stories, and acceptance criteria
- **[Architecture Document](docs/architecture.md)** - Technical architecture, API design, and system design
- **[UI/UX Specification](docs/ui-prompt.md)** - Design system, theme, and user interface guidelines

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to Vercel (automatic via Git)
# Push to main branch → Vercel automatically builds and deploys
```

## 🔐 Security Considerations

- ✅ Secure authentication via NextAuth.js with HTTP-only cookies
- ✅ End-to-end encryption ready for sensitive child data
- ✅ SQL injection prevention via Prisma ORM
- ✅ Child login uses cryptographically secure unguessable permalinks
- ✅ Authorization checks on all tRPC procedures to ensure family-level data isolation

## 🎨 Design Philosophy

Family Quests embraces an **adventurous, enchanted theme** with:

- Fantasy-inspired UI elements (quest scrolls, treasure chests, magic animations)
- Celebration effects on quest approval (confetti, sparkles)
- Large, colorful tap targets optimized for young children
- WCAG AA accessibility standards
- Rich color palette with easily identifiable icons for pre-readers

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm run test`)
2. Code follows TypeScript and ESLint standards
3. New features include corresponding tests
4. Documentation is updated accordingly

## 📄 License

This project is currently unlicensed. See LICENSE file for details.

## 📞 Support

For questions or issues, please open a GitHub issue or contact the maintainers.

---

**Built with ❤️ to make family chores fun!**
