#!/bin/bash
# ===========================================
# GMG Uganda - Docker Production Startup
# ===========================================
# This script starts all services with proper health checks
# Usage: ./docker-start.sh [--build] [--clean] [--logs]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 GMG Uganda - Docker Production Startup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Parse arguments
BUILD=false
CLEAN=false
LOGS=false

for arg in "$@"; do
    case $arg in
        --build|-b)
            BUILD=true
            ;;
        --clean|-c)
            CLEAN=true
            ;;
        --logs|-l)
            LOGS=true
            ;;
        --help|-h)
            echo "Usage: ./docker-start.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build, -b    Rebuild Docker images"
            echo "  --clean, -c    Remove volumes and start fresh"
            echo "  --logs, -l     Follow logs after startup"
            echo "  --help, -h     Show this help message"
            exit 0
            ;;
    esac
done

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Determine docker-compose command
if docker compose version &> /dev/null 2>&1; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# Check .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found, copying from .env.docker${NC}"
    if [ -f .env.docker ]; then
        cp .env.docker .env
    else
        echo -e "${RED}❌ No .env.docker file found${NC}"
        exit 1
    fi
fi

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning up existing containers and volumes...${NC}"
    $COMPOSE down -v --remove-orphans 2>/dev/null || true
    docker volume rm gmg_mysql_data gmg_redis_data 2>/dev/null || true
fi

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
$COMPOSE down --remove-orphans 2>/dev/null || true

# Build if requested
if [ "$BUILD" = true ]; then
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    $COMPOSE build --no-cache
fi

# Start database and redis first
echo -e "${BLUE}🗄️  Starting MySQL and Redis...${NC}"
$COMPOSE up -d mysql redis

# Wait for MySQL to be healthy
echo -e "${BLUE}⏳ Waiting for MySQL to be ready...${NC}"
RETRIES=30
until $COMPOSE exec -T mysql mysqladmin ping -h localhost -u root -pgmg_secure_2025 --silent 2>/dev/null; do
    RETRIES=$((RETRIES-1))
    if [ $RETRIES -eq 0 ]; then
        echo -e "${RED}❌ MySQL failed to start${NC}"
        $COMPOSE logs mysql
        exit 1
    fi
    echo -e "${YELLOW}   Waiting for MySQL... ($RETRIES attempts remaining)${NC}"
    sleep 2
done
echo -e "${GREEN}✅ MySQL is ready${NC}"

# Wait for Redis to be healthy
echo -e "${BLUE}⏳ Waiting for Redis to be ready...${NC}"
RETRIES=10
until $COMPOSE exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
    RETRIES=$((RETRIES-1))
    if [ $RETRIES -eq 0 ]; then
        echo -e "${RED}❌ Redis failed to start${NC}"
        exit 1
    fi
    sleep 1
done
echo -e "${GREEN}✅ Redis is ready${NC}"

# Start API
echo -e "${BLUE}🚀 Starting API server...${NC}"
$COMPOSE up -d api

# Wait for API to be healthy
echo -e "${BLUE}⏳ Waiting for API to be ready...${NC}"
RETRIES=30
until curl -sf http://localhost:3010/health > /dev/null 2>&1; do
    RETRIES=$((RETRIES-1))
    if [ $RETRIES -eq 0 ]; then
        echo -e "${RED}❌ API failed to start${NC}"
        $COMPOSE logs api
        exit 1
    fi
    echo -e "${YELLOW}   Waiting for API... ($RETRIES attempts remaining)${NC}"
    sleep 3
done
echo -e "${GREEN}✅ API is ready${NC}"

# Start Nginx
echo -e "${BLUE}🌐 Starting Nginx reverse proxy...${NC}"
$COMPOSE up -d nginx

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ GMG Uganda is running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "   Web Frontend:  http://localhost"
echo "   API Server:    http://localhost:3010"
echo "   API Health:    http://localhost:3010/health"
echo "   Admin Panel:   http://localhost/admin.html"
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
$COMPOSE ps
echo ""
echo -e "${BLUE}📋 Quick Commands:${NC}"
echo "   View logs:     $COMPOSE logs -f"
echo "   Stop all:      $COMPOSE down"
echo "   Restart API:   $COMPOSE restart api"
echo "   MySQL shell:   $COMPOSE exec mysql mysql -u root -pgmg_secure_2025 gmg_uganda"
echo "   Redis CLI:     $COMPOSE exec redis redis-cli"
echo ""

# Follow logs if requested
if [ "$LOGS" = true ]; then
    echo -e "${BLUE}📜 Following logs (Ctrl+C to exit)...${NC}"
    $COMPOSE logs -f
fi
