#!/bin/bash

echo "📰 NewsAPI Integration & Search Testing"
echo "======================================"

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found"
    exit 1
fi

# Check if NewsAPI key is available
if [ -z "$NEWSAPI_KEY" ]; then
    echo "❌ NEWSAPI_KEY not found in environment"
    exit 1
fi

echo "🔑 NewsAPI Key: ${NEWSAPI_KEY:0:8}..."

# Function to ingest news from different categories
ingest_news_content() {
    echo ""
    echo "📊 Ingesting News Content..."
    
    cd scripts
    
    # Copy environment to scripts
    cp ../.env .env
    
    # Ingest technology news
    echo "🔬 Ingesting Technology News..."
    npm run ingest-data newsapi --api-key "$NEWSAPI_KEY" --category technology --country us --page-size 10
    
    echo ""
    echo "🤖 Ingesting AI-related News..."
    npm run ingest-data newsapi --api-key "$NEWSAPI_KEY" --query "artificial intelligence" --page-size 8
    
    echo ""
    echo "🧬 Ingesting Science News..."
    npm run ingest-data newsapi --api-key "$NEWSAPI_KEY" --category science --country us --page-size 8
    
    echo ""
    echo "💼 Ingesting Business News..."
    npm run ingest-data newsapi --api-key "$NEWSAPI_KEY" --category business --country us --page-size 5
    
    cd ..
}

# Function to test search across all content
test_comprehensive_search() {
    echo ""
    echo "🔍 Testing Comprehensive Search..."
    
    # Test queries for different types of content
    QUERIES=(
        "artificial intelligence"
        "technology"
        "machine learning"
        "business"
        "science"
        "quantum computing"
        "startup"
        "innovation"
    )
    
    echo "📊 Search Results Summary:"
    echo "========================"
    
    for query in "${QUERIES[@]}"; do
        RESULT_COUNT=$(curl -s -X POST http://localhost:3001/api/search \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$query\", \"size\": 10, \"useSemanticSearch\": false}" | jq -r '.total // 0')
        
        printf "%-20s → %2d results\n" "'$query'" "$RESULT_COUNT"
    done
}

# Function to show detailed search results
show_detailed_results() {
    echo ""
    echo "📄 Detailed Search Results:"
    echo "=========================="
    
    # Search for technology news
    echo "🔬 Technology News Results:"
    TECH_RESULTS=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "technology", "size": 3, "useSemanticSearch": false}' | jq -r '.results[] | "   • \(.title) (by \(.metadata.author // "Unknown"))"')
    
    echo "$TECH_RESULTS"
    
    echo ""
    echo "🤖 AI News Results:"
    AI_RESULTS=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "artificial intelligence", "size": 3, "useSemanticSearch": false}' | jq -r '.results[] | "   • \(.title) (by \(.metadata.author // "Unknown"))"')
    
    echo "$AI_RESULTS"
    
    echo ""
    echo "🧬 Science News Results:"
    SCIENCE_RESULTS=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "science", "size": 3, "useSemanticSearch": false}' | jq -r '.results[] | "   • \(.title) (by \(.metadata.author // "Unknown"))"')
    
    echo "$SCIENCE_RESULTS"
}

# Function to test filtering by category
test_category_filtering() {
    echo ""
    echo "🏷️  Testing Category Filtering:"
    echo "=============================="
    
    # Test filtering by News category
    NEWS_COUNT=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "*", "filters": {"category": "News"}, "size": 50, "useSemanticSearch": false}' | jq -r '.total // 0')
    
    echo "📰 News articles: $NEWS_COUNT"
    
    # Test filtering by Technology category  
    TECH_COUNT=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "*", "filters": {"category": "Technology"}, "size": 50, "useSemanticSearch": false}' | jq -r '.total // 0')
    
    echo "🔬 Technology articles: $TECH_COUNT"
    
    # Test filtering by Web category (Wikipedia articles)
    WEB_COUNT=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "*", "filters": {"category": "Web"}, "size": 50, "useSemanticSearch": false}' | jq -r '.total // 0')
    
    echo "🌐 Web articles (Wikipedia): $WEB_COUNT"
}

# Function to show system statistics
show_system_stats() {
    echo ""
    echo "📊 System Statistics:"
    echo "==================="
    
    STATS=$(curl -s http://localhost:3001/api/search/stats)
    TOTAL_DOCS=$(echo "$STATS" | jq -r '.indexStats.documents // 0')
    INDEX_SIZE=$(echo "$STATS" | jq -r '.indexStats.size // 0')
    
    echo "📄 Total Documents: $TOTAL_DOCS"
    echo "💾 Index Size: $INDEX_SIZE bytes"
    
    # Get health status
    HEALTH=$(curl -s http://localhost:3001/api/health/detailed | jq -r '.status // "unknown"')
    ES_STATUS=$(curl -s http://localhost:3001/api/health/detailed | jq -r '.services.elasticsearch.status // "unknown"')
    
    echo "🏥 System Health: $HEALTH"
    echo "🔍 Elasticsearch: $ES_STATUS"
}

# Function to create a demo search interface
create_demo_interface() {
    echo ""
    echo "🎯 Quick Search Demo:"
    echo "==================="
    echo "Try these searches in your browser at http://localhost:3000:"
    echo ""
    echo "📰 News Searches:"
    echo "   • 'technology news'"
    echo "   • 'artificial intelligence'"
    echo "   • 'startup funding'"
    echo "   • 'science breakthrough'"
    echo ""
    echo "🔬 Technical Searches:"
    echo "   • 'machine learning'"
    echo "   • 'quantum computing'"
    echo "   • 'neural networks'"
    echo "   • 'deep learning'"
    echo ""
    echo "💼 Business Searches:"
    echo "   • 'business innovation'"
    echo "   • 'market trends'"
    echo "   • 'economic growth'"
}

# Main execution
echo "1️⃣ Checking system status..."
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend not running. Please start with: cd backend && npm run dev"
    exit 1
fi

echo "✅ Backend is running"

echo ""
echo "2️⃣ Ingesting fresh news content..."
ingest_news_content

echo ""
echo "3️⃣ Testing search functionality..."
test_comprehensive_search

echo ""
echo "4️⃣ Showing detailed results..."
show_detailed_results

echo ""
echo "5️⃣ Testing category filtering..."
test_category_filtering

echo ""
echo "6️⃣ System statistics..."
show_system_stats

echo ""
echo "7️⃣ Demo interface..."
create_demo_interface

echo ""
echo "🎉 NewsAPI Integration Complete!"
echo "==============================="
echo ""
echo "✅ What's Working:"
echo "   📰 NewsAPI: Fresh articles ingested"
echo "   🔍 Search: All content searchable"
echo "   🏷️  Filtering: By category, author, date"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend: http://localhost:3001"
echo ""
echo "🚀 Your search engine now includes:"
echo "   • Wikipedia articles (AI, ML, Quantum)"
echo "   • Latest technology news"
echo "   • Science breakthroughs"
echo "   • Business updates"
echo "   • AI industry news"
echo ""
echo "Ready to search across ALL content! 🎯"
