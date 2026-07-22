# AutoMart ⚡🚗

**Auto parts delivery platform — order any car/bike spare part, delivered in 30 minutes.**

A full-stack microservices monorepo built for learning. 8 backend services + Next.js frontend with a dark glassmorphism UI. Features fuzzy text search with Trie autocomplete, image search via CLIP embeddings, voice search via Web Speech API, and an MCP (Model Context Protocol) server for AI agent integration.

---

## Architecture

```
                         ┌─────────────────────┐
                         │     Next.js 15      │
                         │   (React 19, RSC)   │
                         │  Dark Glassmorphism  │
                         └─────────┬───────────┘
                                   │
                         ┌─────────▼───────────┐
                         │    API Gateway       │
                         │  Rate Limit + Auth   │
                         │  (http-proxy-mw)     │
                         └─────────┬───────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
┌─────────▼─────────┐  ┌─────────▼──────────┐  ┌──────────▼─────────┐
│   Auth Service    │  │  Product Service   │  │   Search Service   │
│  JWT + bcrypt     │  │  CRUD + Categories │  │  Fuse.js + Trie    │
│  SQLite + Prisma  │  │  SQLite + Prisma   │  │  Image + Voice     │
└───────────────────┘  └────────────────────┘  └────────────────────┘
          │                        │                        │
┌─────────▼─────────┐  ┌─────────▼──────────┐  ┌──────────▼─────────┐
│  Order Service    │  │ Inventory Service  │  │ Notification Svc   │
│  Status Tracking  │  │ Reserve/Release    │  │ Email/SMS (Redis)  │
│  SQLite + Prisma  │  │ SQLite + Prisma    │  └────────────────────┘
└─────────┬─────────┘  └─────────┬──────────┘
          │                      │
          └──────────┬───────────┘
              ┌──────▼──────┐
              │  Redis 7    │
              │  Pub/Sub    │
              │  Event Bus  │
              └─────────────┘

              ┌─────────────┐
              │  MCP Server │  ◄── Claude Desktop / Cursor IDE
              │  5 AI Tools │
              └─────────────┘
```

---

## Services

| Service | Port | Tech | Database | Responsibility |
|---|---|---|---|---|
| **API Gateway** | 3000 | Express + http-proxy-middleware | — | Routing, JWT auth, rate limiting (100 req/15 min) |
| **Auth Service** | 3001 | Express + JWT + bcrypt | SQLite | Register, login, token verification |
| **Product Service** | 3002 | Express + Prisma | SQLite | Product CRUD, categories (24 products, 8 categories seeded) |
| **Search Service** | 3003 | Express + Fuse.js + Trie | — | Fuzzy text search, autocomplete, image search |
| **Order Service** | 3004 | Express + Prisma + Redis | SQLite | Order CRUD, status tracking, event publishing |
| **Inventory Service** | 3005 | Express + Prisma + Redis | SQLite | Stock reserve/release/confirm |
| **Notification Service** | 3006 | Express + Redis + Nodemailer | — | Email/SMS via Redis pub/sub |
| **MCP Server** | 3007 | Express | — | 5 AI tools for Model Context Protocol |
| **Web** | 3080 | Next.js 15, React 19, Tailwind 4 | — | Dark glassmorphism UI |

---

## Features

### Search (3 modes)
- **Text**: Fuzzy search via Fuse.js (Bitap algorithm — modified Levenshtein distance)
- **Autocomplete**: Trie data structure with insert/search/remove/insertPhrase
- **Image**: CLIP embeddings + vector similarity (stub ready, plug in real model)
- **Voice**: Web Speech API — browser-native, zero backend cost

### UI
- Dark theme with glassmorphism (`backdrop-filter: blur`) + aurora gradients
- Dark/light theme toggle with localStorage persistence
- Toast notification system (success/error/info)
- Error boundaries for graceful failure handling
- Responsive mobile-first design (Tailwind CSS 4)
- Animated with Framer Motion

### Backend
- Structured error responses: `{ code, message, hint }` across all 8 services
- Input validation via Zod schemas
- SQLite for local dev (zero config), easily swappable to PostgreSQL
- Prisma ORM with database-per-service pattern
- Redis pub/sub for event-driven communication

### DSA Implemented
- **Trie** — autocomplete search suggestions (10/10 unit tests passing)
- **Levenshtein Distance / Bitap** — fuzzy string matching (Fuse.js)
- **TF-IDF** — term frequency scoring concept
- **Cosine Similarity** — vector comparison (image search)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| Backend | Node.js 20, Express, TypeScript |
| Database | SQLite (local dev) / PostgreSQL (production) |
| ORM | Prisma 5 |
| Cache/Events | Redis 7 |
| Search | Fuse.js (Bitap), Trie (custom), Web Speech API |
| Auth | JWT + bcryptjs |
| E2E Tests | Playwright |
| Unit Tests | Vitest (Trie) |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |
| AI Protocol | MCP (Model Context Protocol) |

---

## Getting Started

### Prerequisites
- Node.js 20+ (check: `node -v`)
- npm 10+ (check: `npm -v`)
- Docker & Docker Compose (optional, for full stack)

### Quick Start (local dev)
```bash
git clone https://github.com/SanjaykannaR/AutoMart.git
cd AutoMart
npm install

# Initialize databases
npx prisma migrate dev --schema=services/auth-service/prisma/schema.prisma
npx prisma migrate dev --schema=services/product-service/prisma/schema.prisma
npx prisma migrate dev --schema=services/order-service/prisma/schema.prisma
npx prisma migrate dev --schema=services/inventory-service/prisma/schema.prisma

# Seed data
node services/auth-service/prisma/seed.js
node services/product-service/prisma/seed.js

# Start frontend
npm run dev:web
# → http://localhost:3000
```

### Run with Docker (full stack)
```bash
docker compose up --build
# Frontend: http://localhost:3080
# API Gateway: http://localhost:3000
```

### Run individual services
```bash
npm run dev:auth         # Auth Service → :3001
npm run dev:products     # Product Service → :3002
npm run dev:search       # Search Service → :3003
npm run dev:orders       # Order Service → :3004
npm run dev:inventory    # Inventory Service → :3005
npm run dev:notifications # Notification Service → :3006
npm run dev:gateway      # API Gateway → :3000
npm run dev:mcp          # MCP Server → :3007
```

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Create account (name, email, password, role) |
| POST | `/login` | No | Login → returns JWT token |
| GET | `/me` | Yes | Get current user profile |

### Products (`/api/products`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | No | List products (filters: category, brand, price, vehicle) |
| GET | `/products/:id` | No | Get product by ID |
| POST | `/products` | No | Create product |
| GET | `/categories` | No | List all categories with product counts |

### Search (`/api/search`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q=...` | No | Fuzzy text search |
| GET | `/autocomplete?q=...` | No | Trie autocomplete suggestions |
| POST | `/search/image` | No | Image-based search (multipart) |

### Orders (`/api/orders`) — requires JWT
| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create order (items, address, phone) |
| GET | `/orders` | List user's orders |
| GET | `/orders/:id` | Get order details |
| PATCH | `/orders/:id/status` | Update order status |

### MCP Server (`/mcp`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/mcp/tools` | List available tools |
| POST | `/mcp/tools/:name/call` | Execute a tool |
| GET | `/mcp/resources` | List available resources |

---

## MCP Tools

The MCP server exposes AutoMart's capabilities to AI agents (Claude Desktop, Cursor IDE):

| Tool | Description | Parameters |
|---|---|---|
| `search_parts` | Search auto parts by text | `query`, `category?`, `maxPrice?`, `limit?` |
| `check_stock` | Check real-time stock availability | `productId` |
| `get_order_status` | Get order status and tracking | `orderId` |
| `get_categories` | List all product categories | — |
| `get_popular_parts` | Get popular parts | `limit?` |

---

## Project Structure

```
automart/
├── apps/
│   └── web/                        # Next.js 15 frontend
│       └── src/
│           ├── app/                 # App Router pages
│           │   ├── page.tsx         # Landing page (hero + categories)
│           │   ├── login/           # Login with toast notifications
│           │   ├── register/        # Registration with role selector
│           │   ├── search/          # Search with filters + autocomplete
│           │   ├── products/[id]/   # Product detail + add to cart
│           │   ├── cart/            # Shopping cart (localStorage)
│           │   ├── checkout/        # Order placement
│           │   ├── orders/          # Order history + tracking
│           │   └── error.tsx        # Error boundary page
│           └── components/
│               ├── Toast.tsx        # Toast notification system
│               ├── ThemeToggle.tsx  # Dark/light theme switcher
│               ├── ErrorBoundary.tsx # React error boundary
│               ├── SearchBar.tsx    # Search + voice + image upload
│               ├── ProductCard.tsx  # Product display card
│               └── GlassCard.tsx    # Reusable glassmorphism card
├── services/
│   ├── api-gateway/                # Routing + auth + rate limiting
│   ├── auth-service/               # JWT authentication
│   ├── product-service/            # Product CRUD + categories
│   ├── search-service/             # Fuzzy search + Trie + image
│   │   └── src/search/
│   │       ├── trie.ts             # Trie DSA (insert/search/remove)
│   │       ├── trie.test.ts        # 10/10 unit tests (Vitest)
│   │       ├── textSearch.ts       # Fuse.js + Trie integration
│   │       ├── imageSearch.ts      # CLIP-based image search
│   │       └── voiceSearch.ts      # Voice transcription
│   ├── order-service/              # Orders + Redis events
│   ├── inventory-service/          # Stock management
│   ├── notification-service/       # Email/SMS via Redis pub/sub
│   └── mcp-server/                 # AI agent tools (MCP)
├── e2e/                            # Playwright E2E tests
│   ├── pages/                      # Page Object Models (6 pages)
│   └── tests/                      # Test specs (auth, product, order)
├── docker-compose.yml              # Full stack with Docker
├── .github/workflows/ci.yml       # CI pipeline
└── TODOS.md                       # Development roadmap
```

---

## CI/CD Pipeline

GitHub Actions workflow (`ci.yml`):
- **Backend**: Parallel build matrix for all 8 services (`tsc --noEmit`)
- **Frontend**: `next build` with `NEXT_WORKER_COUNT=1` (Windows compat)
- **E2E**: Playwright tests (when Docker stack available)

---

## Error Handling

Every service returns structured errors:
```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Incorrect password for \"admin@automart.com\".",
  "hint": "Double-check your password. If you forgot it, contact support."
}
```

Error categories: validation (400), authentication (401), not found (404), conflict (409), rate limit (429), server error (500).

---

## Learning Outcomes

This project demonstrates:
- **Microservices architecture** with database-per-service pattern
- **Event-driven architecture** via Redis Pub/Sub
- **API Gateway pattern** with routing, auth middleware, and rate limiting
- **Monorepo management** with npm workspaces
- **Containerization** with multi-stage Docker builds
- **CI/CD** with GitHub Actions
- **E2E testing** with Playwright (Page Object Model)
- **DSA**: Trie, Levenshtein Distance, Bitap Algorithm
- **AI integration** via Model Context Protocol (MCP)
- **JWT authentication** with bcrypt password hashing
- **Structured error handling** across all services

---

## Test Accounts

After seeding, use these credentials:

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | admin@automart.com | Password123! | shop |
| Raj Kumar | raj@mechanic.com | Password123! | mechanic |
| Priya Sharma | priya@example.com | Password123! | individual |
| AutoZone Parts | autozone@shop.com | Password123! | shop |

---

## License

MIT
