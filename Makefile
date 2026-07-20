.PHONY: dev build up down logs clean

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

up:
	docker compose -f docker-compose.yml up -d

down:
	docker compose -f docker-compose.yml down

build:
	docker compose -f docker-compose.yml build

logs:
	docker compose logs -f

clean:
	docker compose -f docker-compose.yml down -v
	rm -rf services/*/node_modules apps/*/node_modules e2e/node_modules
	rm -rf services/*/dist apps/*/.next
