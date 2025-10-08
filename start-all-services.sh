#!/bin/bash

echo "🚀 Starting All AI Search Engine Services"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is not running on port $port${NC}"
        return 1
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local service=$2
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service is responding at $url${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is not responding at $url${NC}"
        return 1
    fi
}

echo ""
echo -e "${BLUE}📊 Checking Current Service Status:${NC}"
echo "===================================="

# Check Backend API (Port 3001)
if check_port 3001 "Backend API"; then
    test_endpoint "http://localhost:3001/api/health" "Backend Health Check"
    test_endpoint "http://localhost:3001/api/analytics" "Analytics API"
else
    echo -e "${YELLOW}⚠️ Starting Backend API...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
    sleep 5
fi

# Check Frontend UI (Port 3002)
if check_port 3002 "Frontend UI"; then
    test_endpoint "http://localhost:3002" "Frontend Homepage"
else
    echo -e "${YELLOW}⚠️ Starting Frontend UI...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    cd ..
    sleep 5
fi

echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "================"
echo ""
echo -e "${GREEN}🔍 Main Search Interface:${NC}"
echo "   http://localhost:3002"
echo ""
echo -e "${GREEN}📊 Admin Analytics Dashboard:${NC}"
echo "   http://localhost:3002/admin"
echo ""
echo -e "${GREEN}🔧 Backend API:${NC}"
echo "   http://localhost:3001/api/health"
echo "   http://localhost:3001/api/search"
echo "   http://localhost:3001/api/analytics"
echo "   http://localhost:3001/api/index"

echo ""
echo -e "${BLUE}🧪 Testing All Endpoints:${NC}"
echo "=========================="

# Test Backend Endpoints
echo ""
echo "🔧 Backend API Tests:"
test_endpoint "http://localhost:3001/api/health" "Health Check"
test_endpoint "http://localhost:3001/api/analytics" "Analytics"

# Test a sample search
echo ""
echo "🔍 Testing Search Functionality:"
SEARCH_RESULT=$(curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "size": 1}' | jq -r '.success // false')

if [ "$SEARCH_RESULT" = "true" ]; then
    echo -e "${GREEN}✅ Search API is working${NC}"
else
    echo -e "${RED}❌ Search API is not working${NC}"
fi

# Test Frontend
echo ""
echo "🌐 Frontend Tests:"
test_endpoint "http://localhost:3002" "Main Search Page"
test_endpoint "http://localhost:3002/admin" "Admin Dashboard"

echo ""
echo -e "${BLUE}📊 System Status Summary:${NC}"
echo "=========================="

# Get process information
BACKEND_PROCESSES=$(ps aux | grep -E "(nodemon|ts-node).*server" | grep -v grep | wc -l)
FRONTEND_PROCESSES=$(ps aux | grep -E "next dev" | grep -v grep | wc -l)

echo ""
echo -e "${GREEN}🔧 Backend Processes:${NC} $BACKEND_PROCESSES running"
echo -e "${GREEN}🌐 Frontend Processes:${NC} $FRONTEND_PROCESSES running"

# Show running processes
echo ""
echo -e "${BLUE}🔍 Active Node.js Processes:${NC}"
ps aux | grep -E "(node|npm)" | grep -E "(dev|server)" | grep -v grep | while read line; do
    echo "   $line"
done

echo ""
echo -e "${BLUE}💾 Memory Usage:${NC}"
echo "================"
ps aux | grep -E "(node|npm)" | grep -E "(dev|server)" | grep -v grep | awk '{print "   " $11 ": " $4 "% CPU, " $6/1024 " MB RAM"}'

echo ""
echo -e "${BLUE}🌟 Quick Access Links:${NC}"
echo "======================"
echo ""
echo -e "${GREEN}🔍 Search Engine:${NC}"
echo "   • Main Interface: http://localhost:3002"
echo "   • Try searching for: 'artificial intelligence'"
echo "   • Use voice search (click microphone icon)"
echo "   • Test advanced filters"
echo ""
echo -e "${GREEN}📊 Analytics Dashboard:${NC}"
echo "   • Admin Panel: http://localhost:3002/admin"
echo "   • View search statistics and trends"
echo "   • Monitor performance metrics"
echo "   • Analyze user behavior"
echo ""
echo -e "${GREEN}🔧 API Endpoints:${NC}"
echo "   • Health: http://localhost:3001/api/health"
echo "   • Search: POST http://localhost:3001/api/search"
echo "   • Analytics: http://localhost:3001/api/analytics"
echo "   • Index: POST http://localhost:3001/api/index"

echo ""
echo -e "${BLUE}🛠️ Development Commands:${NC}"
echo "========================"
echo ""
echo "📊 View Logs:"
echo "   Backend: cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "🔄 Restart Services:"
echo "   pkill -f 'nodemon\\|next dev'"
echo "   ./start-all-services.sh"
echo ""
echo "🧪 Test APIs:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3001/api/analytics"

echo ""
if check_port 3001 "Backend" >/dev/null && check_port 3002 "Frontend" >/dev/null; then
    echo -e "${GREEN}🎉 ALL SERVICES ARE RUNNING SUCCESSFULLY! 🚀${NC}"
    echo "=========================================="
    echo ""
    echo -e "${GREEN}✅ Ready to use:${NC}"
    echo "   🔍 Search Engine: http://localhost:3002"
    echo "   📊 Analytics: http://localhost:3002/admin"
    echo "   🔧 API: http://localhost:3001"
    echo ""
    echo -e "${BLUE}🌟 Your AI-Powered Search Engine is fully operational!${NC}"
else
    echo -e "${YELLOW}⚠️ Some services may need time to start up.${NC}"
    echo "Please wait a moment and run this script again."
fi

echo ""
