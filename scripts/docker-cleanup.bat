@echo off
echo === Docker Cleanup ===
echo.

echo Disk usage BEFORE cleanup:
docker system df
echo.

echo Cleaning up...
docker system prune -f --filter "until=72h"
docker volume prune -f

echo.
echo Disk usage AFTER cleanup:
docker system df
echo.
echo === Cleanup Done ===
