#!/bin/bash
# Docker Pre-Test Cleanup Script
# Removes unused images, stopped containers, and build cache older than 72h
# Safe to run - never touches running containers or active images

echo "=== Docker Cleanup ==="
echo ""

# Show current usage before cleanup
echo "Disk usage BEFORE cleanup:"
docker system df 2>/dev/null
echo ""

# Remove stopped containers, dangling images, unused networks, build cache >72h
echo "Cleaning up..."
docker system prune -f --filter "until=72h" 2>/dev/null
docker volume prune -f 2>/dev/null

echo ""
echo "Disk usage AFTER cleanup:"
docker system df 2>/dev/null
echo ""
echo "=== Cleanup Done ==="
