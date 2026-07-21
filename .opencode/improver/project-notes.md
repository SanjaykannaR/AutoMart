# Project Notes - automart

## Docker Storage (2026-07-21)
- Docker data root changed from C: to D:\Docker via `daemon.json`
- Old Docker data (20GB) cleaned from `C:\Users\DELL\AppData\Local\Docker`
- Created `scripts/docker-cleanup.sh` and `scripts/docker-cleanup.bat` for pre-test cleanup
- Workflow: run cleanup script before `docker compose up` to keep disk clean

## Project Structure
- Multi-service: api-gateway, auth, inventory, mcp-server, notification, order, product, search
- Frontend: apps/web
- Docker Compose files: docker-compose.yml (prod), docker-compose.dev.yml (dev)
