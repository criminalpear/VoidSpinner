# Overview

Voidspinner is an idle/incremental game that combines economic simulation, RNG-based loot grinding, and a sophisticated crafting system. Players operate a mysterious "Voidspinner" device that pulls fragments from a chaotic dimension called the "Void." The core gameplay loop involves spinning for fragments, managing resources (Flux), and strategically crafting or selling items to progress toward increasingly rare and powerful equipment. The game features exponential progression mechanics with astronomically low odds for the rarest items, creating a "numbers go up" experience driven by probability management and the excitement of rare discoveries.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system for consistent, accessible interface elements
- **Styling**: Tailwind CSS with custom CSS variables for theming, including dark mode support and custom fonts (Cinzel for serif, Inter for sans-serif, JetBrains Mono for monospace)
- **State Management**: TanStack Query (React Query) for server state management, with local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Animation**: Framer Motion for smooth animations and transitions, particularly for the spinning device and fragment discovery effects

## Backend Architecture
- **Runtime**: Node.js with Express.js as the web framework
- **Language**: TypeScript throughout the entire stack for type safety
- **Session Management**: Express sessions with in-memory storage for anonymous user handling
- **API Design**: RESTful endpoints for game actions (spin, shatter, upgrade) with JSON responses
- **Game Logic**: Custom RNG system with seeded random number generation for consistent, reproducible results
- **Error Handling**: Centralized error handling with proper HTTP status codes and descriptive error messages

## Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM with type-safe queries
- **Schema**: Relational design with tables for users, game states, fragments, and marketplace listings
- **Migration System**: Drizzle Kit for database schema management and migrations
- **Development Storage**: In-memory storage implementation for development/testing with the same interface as the database layer
- **Connection**: Neon serverless PostgreSQL for cloud deployment

## Authentication and Authorization
- **Authentication**: Session-based anonymous users for simplified onboarding - no registration required
- **Session Storage**: Express session middleware with configurable session secrets
- **User Management**: Automatic anonymous user creation on first visit, stored in session data
- **Security**: Basic session security with configurable HTTPS settings for production

## External Dependencies
- **Database**: Neon PostgreSQL serverless database for production data storage
- **UI Components**: Radix UI primitives for accessible, unstyled UI components
- **Styling**: Tailwind CSS for utility-first styling with PostCSS for processing
- **Development**: Replit-specific plugins for runtime error handling, cartography, and development banners
- **Build Tools**: ESBuild for server bundling, Vite for client-side development and building
- **Type Safety**: Zod for runtime type validation and schema generation from database models

The architecture prioritizes type safety across the full stack, uses modern React patterns with hooks and functional components, and implements a clean separation between game logic, data persistence, and user interface concerns. The RNG system is designed to be deterministic and testable while still providing the excitement of rare discoveries that drive the game's progression mechanics.