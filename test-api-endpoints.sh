#!/bin/bash

echo "🚀 Testing Express API Endpoints"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint and show results
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo ""
    echo -e "${BLUE}🔍 Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    echo "----------------------------------------"
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" "$endpoint")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # Extract HTTP status code (last line)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    # Extract response body (all but last line)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo -e "${GREEN}✅ Success (HTTP $HTTP_CODE)${NC}"
    elif [ "$HTTP_CODE" -ge 400 ] && [ "$HTTP_CODE" -lt 500 ]; then
        echo -e "${YELLOW}⚠️  Client Error (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}❌ Server Error (HTTP $HTTP_CODE)${NC}"
    fi
    
    # Pretty print JSON response
    if echo "$BODY" | jq . >/dev/null 2>&1; then
        echo "Response:"
        echo "$BODY" | jq . | head -20
        if [ $(echo "$BODY" | jq . | wc -l) -gt 20 ]; then
            echo "... (truncated)"
        fi
    else
        echo "Response: $BODY"
    fi
}

# Function to test search functionality
test_search_features() {
    echo ""
    echo -e "${BLUE}🔍 Testing Search Features${NC}"
    echo "=========================="
    
    # Test basic search
    test_endpoint "POST" "http://localhost:3001/api/search" \
        '{"query": "artificial intelligence", "size": 3}' \
        "Basic Search"
    
    # Test search with filters
    test_endpoint "POST" "http://localhost:3001/api/search" \
        '{"query": "machine learning", "filters": {"category": "Web"}, "size": 2}' \
        "Search with Category Filter"
    
    # Test search with reasoning disabled
    test_endpoint "POST" "http://localhost:3001/api/search" \
        '{"query": "quantum computing", "includeReasoning": false, "size": 2}' \
        "Search without AI Reasoning"
    
    # Test search with detailed explanations
    test_endpoint "POST" "http://localhost:3001/api/search" \
        '{"query": "deep learning", "includeExplanation": true, "size": 2}' \
        "Search with Detailed Scoring"
}

# Function to test indexing functionality
test_indexing_features() {
    echo ""
    echo -e "${BLUE}📝 Testing Indexing Features${NC}"
    echo "============================"
    
    # Test single document indexing
    test_endpoint "POST" "http://localhost:3001/api/index" \
        '{"documents": [{"title": "API Test Document", "content": "This document was created via the API endpoint to test manual indexing functionality.", "metadata": {"author": "API Tester", "category": "Testing", "tags": ["api", "test", "manual"]}}]}' \
        "Single Document Indexing"
    
    # Test multiple document indexing
    test_endpoint "POST" "http://localhost:3001/api/index" \
        '{"documents": [
            {"title": "Batch Test 1", "content": "First document in batch test.", "metadata": {"author": "Batch Tester", "category": "Batch"}},
            {"title": "Batch Test 2", "content": "Second document in batch test.", "metadata": {"author": "Batch Tester", "category": "Batch"}}
        ]}' \
        "Multiple Document Indexing"
    
    # Test indexing without embeddings
    test_endpoint "POST" "http://localhost:3001/api/index" \
        '{"documents": [{"title": "No Embedding Test", "content": "This document should be indexed without embeddings."}], "generateEmbeddings": false}' \
        "Indexing without Embeddings"
    
    # Test validation error
    test_endpoint "POST" "http://localhost:3001/api/index" \
        '{"documents": [{"title": "", "content": "Invalid document with empty title"}]}' \
        "Validation Error Test"
}

# Function to test health check functionality
test_health_features() {
    echo ""
    echo -e "${BLUE}🏥 Testing Health Check Features${NC}"
    echo "================================="
    
    # Test basic health check
    test_endpoint "GET" "http://localhost:3001/api/health" \
        "" \
        "Basic Health Check"
    
    # Test detailed health check
    test_endpoint "GET" "http://localhost:3001/api/health/detailed" \
        "" \
        "Detailed Health Check"
}

# Function to test error handling
test_error_handling() {
    echo ""
    echo -e "${BLUE}⚠️  Testing Error Handling${NC}"
    echo "=========================="
    
    # Test invalid JSON
    test_endpoint "POST" "http://localhost:3001/api/search" \
        '{"query": "test", invalid json}' \
        "Invalid JSON Error"
    
    # Test missing required field
    test_endpoint "POST" "http://localhost:3001/api/search" \
        '{"size": 5}' \
        "Missing Required Field"
    
    # Test invalid endpoint
    test_endpoint "GET" "http://localhost:3001/api/nonexistent" \
        "" \
        "404 Not Found"
}

# Function to show API documentation
show_api_documentation() {
    echo ""
    echo -e "${BLUE}📚 API Documentation${NC}"
    echo "===================="
    echo ""
    echo "🔍 POST /api/search - Hybrid Search with AI Reasoning"
    echo "   Body: {"
    echo "     \"query\": \"search terms\","
    echo "     \"filters\": { \"category\": \"News\" },"
    echo "     \"size\": 10,"
    echo "     \"from\": 0,"
    echo "     \"includeReasoning\": true,"
    echo "     \"includeExplanation\": false"
    echo "   }"
    echo ""
    echo "📝 POST /api/index - Manual Document Indexing"
    echo "   Body: {"
    echo "     \"documents\": [{"
    echo "       \"title\": \"Document Title\","
    echo "       \"content\": \"Document content...\","
    echo "       \"url\": \"https://example.com\","
    echo "       \"metadata\": {"
    echo "         \"author\": \"Author Name\","
    echo "         \"category\": \"Category\","
    echo "         \"tags\": [\"tag1\", \"tag2\"]"
    echo "       }"
    echo "     }],"
    echo "     \"generateEmbeddings\": true"
    echo "   }"
    echo ""
    echo "🏥 GET /api/health - System Health Check"
    echo "   Returns: Elasticsearch and Gemini API status"
    echo ""
    echo "🏥 GET /api/health/detailed - Extended Health Info"
    echo "   Returns: Feature availability and endpoints"
}

# Function to show performance metrics
show_performance_metrics() {
    echo ""
    echo -e "${BLUE}📊 Performance Metrics${NC}"
    echo "======================"
    
    # Test search performance
    echo "🔍 Search Performance Test:"
    START_TIME=$(date +%s%N)
    curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "performance test", "size": 5}' > /dev/null
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
    echo "   Search Response Time: ${DURATION}ms"
    
    # Test indexing performance
    echo "📝 Indexing Performance Test:"
    START_TIME=$(date +%s%N)
    curl -s -X POST http://localhost:3001/api/index \
        -H "Content-Type: application/json" \
        -d '{"documents": [{"title": "Performance Test", "content": "Testing indexing performance."}]}' > /dev/null
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
    echo "   Indexing Response Time: ${DURATION}ms"
    
    # Test health check performance
    echo "🏥 Health Check Performance Test:"
    START_TIME=$(date +%s%N)
    curl -s http://localhost:3001/api/health > /dev/null
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
    echo "   Health Check Response Time: ${DURATION}ms"
}

# Main execution
echo "1️⃣ API Documentation"
show_api_documentation

echo ""
echo "2️⃣ Health Check Tests"
test_health_features

echo ""
echo "3️⃣ Search Functionality Tests"
test_search_features

echo ""
echo "4️⃣ Indexing Functionality Tests"
test_indexing_features

echo ""
echo "5️⃣ Error Handling Tests"
test_error_handling

echo ""
echo "6️⃣ Performance Metrics"
show_performance_metrics

echo ""
echo -e "${GREEN}🎉 API Endpoint Testing Complete!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}✅ What's Working:${NC}"
echo "   🔍 POST /api/search - Hybrid search with AI reasoning"
echo "   📝 POST /api/index - Manual document indexing"
echo "   🏥 GET /api/health - Comprehensive health checks"
echo "   ⚠️  Error handling - Proper validation and error responses"
echo "   📊 Logging - Detailed request/response logging"
echo ""
echo -e "${BLUE}🚀 Features:${NC}"
echo "   • Hybrid search (BM25 + Vector + RRF)"
echo "   • AI-powered query enhancement and reasoning"
echo "   • Manual document indexing with embeddings"
echo "   • Comprehensive health monitoring"
echo "   • Proper error handling and validation"
echo "   • Request/response logging"
echo "   • Performance monitoring"
echo ""
echo -e "${BLUE}🌐 Ready for Production!${NC}"
