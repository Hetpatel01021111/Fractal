#!/bin/bash

echo "🧪 Testing AI-Powered Search Engine Integration"
echo "=============================================="

# Check if backend is running
echo "1️⃣ Checking backend status..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it with: cd backend && npm run dev"
    exit 1
fi

# Check if frontend is running
echo "2️⃣ Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend is not running. Start it with: cd frontend && npm run dev"
fi

# Test data ingestion
echo "3️⃣ Testing data ingestion..."
cd scripts

# Ingest a simple Wikipedia article
echo "📄 Ingesting Wikipedia article about Machine Learning..."
npm run ingest-data urls "https://en.wikipedia.org/wiki/Machine_learning" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Data ingestion successful"
else
    echo "❌ Data ingestion failed"
    exit 1
fi

cd ..

# Test search functionality
echo "4️⃣ Testing search functionality..."

# Test BM25 text search
echo "🔍 Testing BM25 text search..."
SEARCH_RESULT=$(curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning", "size": 1, "useSemanticSearch": false}' | jq -r '.results[0].title // "No results"')

if [ "$SEARCH_RESULT" != "No results" ] && [ "$SEARCH_RESULT" != "null" ]; then
    echo "✅ BM25 search working - Found: $SEARCH_RESULT"
else
    echo "❌ BM25 search failed"
fi

# Test search with different queries
echo "🔍 Testing search with different queries..."
QUERIES=("artificial intelligence" "machine learning" "deep learning" "neural networks")

for query in "${QUERIES[@]}"; do
    RESULT_COUNT=$(curl -s -X POST http://localhost:3001/api/search \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"$query\", \"size\": 5, \"useSemanticSearch\": false}" | jq -r '.total // 0')
    
    echo "   Query: '$query' → $RESULT_COUNT results"
done

# Test search statistics
echo "5️⃣ Testing search statistics..."
STATS=$(curl -s http://localhost:3001/api/search/stats | jq -r '.totalDocuments // 0')
echo "📊 Total documents in index: $STATS"

# Test health check
echo "6️⃣ Testing detailed health check..."
HEALTH=$(curl -s http://localhost:3001/api/health/detailed | jq -r '.status // "unknown"')
echo "🏥 System health: $HEALTH"

echo ""
echo "🎉 Integration Test Complete!"
echo ""
echo "🌐 Access your search engine:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo ""
echo "🔍 Try searching for:"
echo "   - 'artificial intelligence'"
echo "   - 'machine learning'"
echo "   - 'neural networks'"
echo "   - 'deep learning'"
echo ""
echo "📊 API Endpoints:"
echo "   - Search: POST http://localhost:3001/api/search"
echo "   - Health: GET http://localhost:3001/api/health"
echo "   - Stats: GET http://localhost:3001/api/search/stats"
