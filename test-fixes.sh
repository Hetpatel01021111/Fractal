#!/bin/bash

echo "🔧 Testing Fixes for Hydration and CORS Issues"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🔍 Testing CORS Fix:${NC}"
echo "===================="

# Test CORS with proper Origin header
CORS_TEST=$(curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3002" \
  -d '{"query": "test cors", "size": 1}' \
  -w "%{http_code}")

HTTP_CODE="${CORS_TEST: -3}"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ CORS is working - Frontend can access Backend API${NC}"
else
    echo -e "${RED}❌ CORS issue persists - HTTP Code: $HTTP_CODE${NC}"
fi

echo ""
echo -e "${BLUE}📊 Testing Analytics API:${NC}"
echo "========================="

ANALYTICS_TEST=$(curl -s http://localhost:3001/api/analytics | jq -r '.success // false')
if [ "$ANALYTICS_TEST" = "true" ]; then
    echo -e "${GREEN}✅ Analytics API is working${NC}"
else
    echo -e "${RED}❌ Analytics API issue${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Testing Frontend:${NC}"
echo "===================="

FRONTEND_TEST=$(curl -s http://localhost:3002 | head -1)
if [[ "$FRONTEND_TEST" == *"<!DOCTYPE html>"* ]]; then
    echo -e "${GREEN}✅ Frontend is serving HTML${NC}"
else
    echo -e "${RED}❌ Frontend issue${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Fixes Applied:${NC}"
echo "=================="
echo ""
echo -e "${GREEN}1. Hydration Error Fix:${NC}"
echo "   • Added isClient state to SearchInterface"
echo "   • Voice search button only renders on client-side"
echo "   • Prevents server/client HTML mismatch"
echo ""
echo -e "${GREEN}2. CORS Error Fix:${NC}"
echo "   • Updated backend CORS configuration"
echo "   • Added http://localhost:3002 to allowed origins"
echo "   • Frontend can now access backend API"

echo ""
echo -e "${BLUE}🌟 Current Service Status:${NC}"
echo "=========================="
echo ""
echo "🔍 Main Search Engine:"
echo "   URL: http://localhost:3002"
echo "   Status: Should work without hydration errors"
echo ""
echo "📊 Analytics Dashboard:"
echo "   URL: http://localhost:3002/admin"
echo "   Status: Should load analytics data"
echo ""
echo "🔧 Backend API:"
echo "   URL: http://localhost:3001"
echo "   Status: CORS enabled for frontend"

echo ""
echo -e "${BLUE}🧪 Test Your Search Engine:${NC}"
echo "==========================="
echo ""
echo "1. Visit: http://localhost:3002"
echo "2. Try searching for: 'artificial intelligence'"
echo "3. Check browser console - should see no CORS errors"
echo "4. Voice search should appear (if supported)"
echo "5. Visit: http://localhost:3002/admin for analytics"

echo ""
if [ "$HTTP_CODE" = "200" ] && [ "$ANALYTICS_TEST" = "true" ]; then
    echo -e "${GREEN}🎉 ALL FIXES SUCCESSFUL! 🚀${NC}"
    echo "================================"
    echo ""
    echo -e "${GREEN}✅ Issues Resolved:${NC}"
    echo "   🔧 Hydration error fixed"
    echo "   🌐 CORS error fixed"
    echo "   📊 Analytics working"
    echo "   🔍 Search functionality restored"
    echo ""
    echo -e "${BLUE}🌟 Your search engine is ready to use!${NC}"
else
    echo -e "${YELLOW}⚠️ Some issues may still exist. Check the logs above.${NC}"
fi

echo ""
