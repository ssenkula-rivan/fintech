#!/bin/bash

# GMG Uganda - Development & Production Startup Script
# Connects all services: MySQL, Redis, API, Web Frontend, Mobile

set -e

echo "🚀 Starting GMG Uganda Application..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists in root, if not check api folder
if [ -f .env ]; then
    source .env
elif [ -f api/.env ]; then
    source api/.env
else
    echo -e "${YELLOW}⚠️  No .env file found, using defaults${NC}"
fi

# Set defaults if not provided
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_PASSWORD=${DB_PASSWORD:-gmg_secure_password_2025}
DB_NAME=${DB_NAME:-gmg_uganda}
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
API_PORT=${PORT:-3000}
JWT_SECRET=${JWT_SECRET:-k8Xp2mN9vQ4wR7tY1uI0oP3aS6dF8gH2jK5lZ7xC9vB4nM1qW6eR3tY8uI0oP5aS2dF7gH4jK9lZ}

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "   Redis: $REDIS_HOST:$REDIS_PORT"
echo "   API Port: $API_PORT"

# Function to check if a service is running
check_service() {
    local host=$1
    local port=$2
    local name=$3
    
    if nc -z "$host" "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ $name is running on $host:$port${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running on $host:$port${NC}"
        return 1
    fi
}

# Check if Docker is available and user wants to use it
USE_DOCKER=false
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    if [ "$1" == "--docker" ] || [ "$1" == "-d" ]; then
        USE_DOCKER=true
    fi
fi

if [ "$USE_DOCKER" = true ]; then
    echo -e "${BLUE}🐳 Starting with Docker Compose...${NC}"
    
    # Stop existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Start services
    docker-compose up -d mysql redis
    
    echo "⏳ Waiting for database to be ready..."
    sleep 15
    
    # Start API
    docker-compose up -d api
    
    echo "⏳ Waiting for API to start..."
    sleep 10
    
    # Start Nginx
    docker-compose up -d nginx
    
    echo ""
    echo -e "${GREEN}✅ All Docker services started!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Service URLs:${NC}"
    echo "   Web Frontend: http://localhost"
    echo "   API Server:   http://localhost:3010"
    echo "   Admin Panel:  http://localhost/admin.html"
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose ps
    
else
    echo -e "${BLUE}📦 Starting in development mode (no Docker)...${NC}"
    echo ""
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js 18+ to run the application"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo -e "${GREEN}✅ Node.js v$(node -v | cut -d'v' -f2) detected${NC}"
    
    # Check MySQL
    echo ""
    echo -e "${BLUE}🔍 Checking services...${NC}"
    
    MYSQL_RUNNING=false
    if check_service "$DB_HOST" "$DB_PORT" "MySQL"; then
        MYSQL_RUNNING=true
    else
        echo -e "${YELLOW}   Start MySQL with: brew services start mysql (macOS)${NC}"
        echo -e "${YELLOW}   Or: sudo systemctl start mysql (Linux)${NC}"
    fi
    
    # Check Redis
    REDIS_RUNNING=false
    if check_service "$REDIS_HOST" "$REDIS_PORT" "Redis"; then
        REDIS_RUNNING=true
    else
        echo -e "${YELLOW}   Start Redis with: brew services start redis (macOS)${NC}"
        echo -e "${YELLOW}   Or: sudo systemctl start redis (Linux)${NC}"
        echo -e "${YELLOW}   Note: Redis is optional for development${NC}"
    fi
    
    if [ "$MYSQL_RUNNING" = false ]; then
        echo ""
        echo -e "${RED}❌ MySQL is required. Please start MySQL and try again.${NC}"
        exit 1
    fi
    
    # Install API dependencies
    echo ""
    echo -e "${BLUE}📦 Installing API dependencies...${NC}"
    cd api
    npm install --silent
    
    # Start API server
    echo ""
    echo -e "${BLUE}🚀 Starting API server on port $API_PORT...${NC}"
    PORT=$API_PORT npm start &
    API_PID=$!
    
    # Wait for API to start
    sleep 3
    
    # Start frontend server
    cd ..
    echo -e "${BLUE}🌐 Starting web frontend on port 8080...${NC}"
    
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8080 &
        FRONTEND_PID=$!
    elif command -v python &> /dev/null; then
        python -m SimpleHTTPServer 8080 &
        FRONTEND_PID=$!
    else
        echo -e "${YELLOW}⚠️  Python not found, skipping frontend server${NC}"
        FRONTEND_PID=""
    fi
    
    echo ""
    echo -e "${GREEN}✅ GMG Uganda is running!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Service URLs:${NC}"
    echo "   Web Frontend:  http://localhost:8080"
    echo "   API Server:    http://localhost:$API_PORT"
    echo "   API Health:    http://localhost:$API_PORT/health"
    echo "   Admin Panel:   http://localhost:8080/admin.html"
    echo ""
    echo -e "${BLUE}📱 Mobile App:${NC}"
    echo "   cd mobile && npx expo start"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Cleanup function
    cleanup() {
        echo ""
        echo -e "${BLUE}🛑 Stopping services...${NC}"
        [ -n "$API_PID" ] && kill $API_PID 2>/dev/null
        [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Services stopped${NC}"
        exit 0
    }
    
    trap cleanup INT TERM
    
    # Wait for processes
    wait
fi