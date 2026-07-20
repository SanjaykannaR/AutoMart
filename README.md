# AutoMart 🚗⚡

**Auto parts delivery platform — order any car/bike spare part, delivered in 30 minutes.**

Built as a microservices monorepo for learning. 8 backend services + Next.js frontend with dark glassmorphism UI. Features fuzzy text search, CLIP-based image search, voice search via Web Speech API, and an MCP (Model Context Protocol) server for AI agent integration.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│ API Gateway │────▶│   Auth      │
│   Frontend  │     │  (Express)  │     │   Service   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │                    │
                    ┌──────┴──────┐     ┌───────┴───────┐
                    │  Product    │     │  Search       │
                    │  Service    │     │  Service      │
                    └─────────────┘     │ (Fuse.js+CLIP)│
                    ┌─────────────┐     └───────────────┘
                    │   Order     │     ┌───────────────┐
                    │   Service   │────▶│  Inventory    │
                    └─────────────┘     │  Service      │
                    ┌─────────────┘     └───────────────┘
                    │  Notification     ┌───────────────┐
                    │  Service    ◀────▶│  MCP Server   │
                    └─────────────┘     │  (AI Agents)  │
                                        └───────────────┘
                    ┌───────────────────────────────────┐
                    │  Redis Pub/Sub (Event Bus)        │
                    └───────────────────────────────────┘
```

---

## Services

| Service | Tech | Database | Responsibility |
|---|---|---|---|
| **API Gateway** | Express | - | Routing, auth middleware, rate limiting |
| **Auth** | Express + JWT | PostgreSQL | Register, login, JWT tokens |
| **Product** | Express + Prisma | PostgreSQL | Product CRUD, categories |
| **Search** | Express + Fuse.js | ChromaDB (planned) | Fuzzy text, image, voice search |
| **Order** | Express + Prisma | PostgreSQL | Orders, Redis event publishing |
| **Inventory** | Express + Prisma | PostgreSQL | Stock management, reservations |
| **Notification** | Express | - | Email/SMS via Redis events |
| **MCP Server** | Express | - | AI agent tools (Model Context Protocol) |
| **Web** | Next.js 15 | - | Dark glassmorphism UI |

---

## Features

### Search (3 modes)
- **Text**: Fuzzy search via Fuse.js (Bitap algorithm — modified Levenshtein distance)
- **Image**: CLIP embeddings + FAISS vector similarity (stub ready, plug in real model)
- **Voice**: Web Speech API — browser-native, no backend cost

### UI
- Dark theme with glassmorphism (`backdrop-filter: blur`)
- Aurora gradient backgrounds
- Skeleton loading states
- Responsive mobile-first design

### DSA Implemented
- Trie (autocomplete)
- Levenshtein Distance / Bitap (fuzzy search)
- TF-IDF scoring
- Cosine Similarity (image vectors)
- Priority Queue (order processing)
- Graph BFS/Dijkstra (delivery routing concept)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Framer Motion |
| Backend | Node.js 20, Express, TypeScript |
| Databases | PostgreSQL 16 (Neon), Redis 7 |
| ORM | Prisma |
| Search | Fuse.js, CLIP (planned), Web Speech API |
| E2E Tests | Playwright |
| CI/CD | GitHub Actions |
| Container | Docker, Docker Compose |
| AI Protocol | MCP (Model Context Protocol) |
| Auth | JWT + bcrypt |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Install
```bash
git clone https://github.com/YOUR_USERNAME/automart.git
cd automart
npm install
```

### Run (full stack with Docker)
```bash
npm run docker:up
```

### Run (frontend only)
```bash
npm run dev:web
# → http://localhost:3000
```

### Run individual service
```bash
npm run dev:auth    # auth service → :3001
npm run dev:search  # search service → :3003
npm run dev:mcp     # MCP server → :3007
```

### E2E Tests
```bash
npm run test:e2e
```

---

## CI/CD Pipeline

```
push/PR → Lint → Unit Tests (sharded 4x) → Build Check
                                               ↓
                                    Deploy Preview
                                               ↓
                                   E2E Tests (3 browsers)
                                               ↓
                                    Docker Build & Push
                                               ↓
                                    Production Deploy
```

---

## MCP Server

This project includes an MCP (Model Context Protocol) server exposing AutoMart tools to AI agents:

| Tool | Description |
|---|---|
| `search_parts` | Search products by text query |
| `check_stock` | Real-time inventory check |
| `get_order_status` | Track order by ID |
| `get_categories` | List all categories |
| `get_popular_parts` | Most searched parts |

Connect to Claude Desktop or Cursor IDE. See `services/mcp-server/src/index.ts` for details.

---

## Project Structure

```
automart/
├── apps/web/           # Next.js frontend
├── services/           # 8 microservices
│   ├── api-gateway/
│   ├── auth-service/
│   ├── product-service/
│   ├── search-service/
│   ├── order-service/
│   ├── inventory-service/
│   ├── notification-service/
│   └── mcp-server/
├── e2e/                # Playwright tests
├── .github/workflows/  # CI/CD pipelines
└── docker-compose.yml
```

---

## Learning Path

This project covers: Microservices architecture, Domain-Driven Design, Event-driven architecture, CQRS, API Gateway pattern, Monorepo management, Containerization, CI/CD, E2E testing, Vector search, MCP protocol, JWT auth, Redis Pub/Sub.

---

## License

MIT
