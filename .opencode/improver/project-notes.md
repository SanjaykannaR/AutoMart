# Project Notes - automart

## Agent Optimization (2026-07-23)
- Created shared `AGENTS.md` with common instructions (Git discipline, output formats, quality gates)
- Trimmed all agent files to reference AGENTS.md, reducing token usage by ~40-60%
- Specialist agents (backend, frontend, general, hermes, testing, explore) now focus on domain-specific content only
- Created `MULTI_AGENT_GUIDE.md` for using the multi-agent system effectively
- Key benefit: faster development through parallel agent usage, better token efficiency

## Docker Storage (2026-07-21)
- Docker data root changed from C: to D:\Docker via `daemon.json`
- Old Docker data (20GB) cleaned from `C:\Users\DELL\AppData\Local\Docker`
- Created `scripts/docker-cleanup.sh` and `scripts/docker-cleanup.bat` for pre-test cleanup
- Workflow: run cleanup script before `docker compose up` to keep disk clean

## Project Structure
- Multi-service: api-gateway, auth, inventory, mcp-server, notification, order, product, search
- Frontend: apps/web
- Docker Compose files: docker-compose.yml (prod), docker-compose.dev.yml (dev)
