#!/bin/bash

echo "🔍 Checking Gemini API Quota Status"
echo "==================================="

# Test embedding generation directly
echo "🧪 Testing embedding generation..."

cd scripts

# Create a minimal test
cat > quota-test.json << 'EOF'
{
    "title": "Quota Test",
    "content": "Testing if Gemini API quota has reset for embedding generation."
}
EOF

echo "📊 Attempting to generate embeddings..."
OUTPUT=$(npm run ingest-data json quota-test.json 2>&1)

if echo "$OUTPUT" | grep -q "Embedding generation failed"; then
    echo "❌ Quota still exceeded"
    echo ""
    echo "📅 Gemini API Free Tier Limits:"
    echo "   - Embedding requests: Limited per day"
    echo "   - Resets: Daily (usually midnight UTC)"
    echo "   - Current status: Quota exceeded"
    echo ""
    echo "💡 Options:"
    echo "   1. Wait for daily quota reset"
    echo "   2. Upgrade to paid plan at https://ai.google.dev/pricing"
    echo "   3. Use BM25 search (works perfectly without embeddings)"
    
elif echo "$OUTPUT" | grep -q "✅ Indexed"; then
    echo "✅ QUOTA RESET! Embeddings working!"
    echo ""
    echo "🎉 Your Gemini API is now working with embeddings!"
    echo "   - Semantic search: ✅ Available"
    echo "   - AI-powered features: ✅ Working"
    echo "   - Full functionality: ✅ Restored"
    
    # Test semantic search
    cd ..
    echo ""
    echo "🔍 Testing semantic search..."
    RESULT=$(curl -s -X POST http://localhost:3001/api/search \
        -H "Content-Type: application/json" \
        -d '{"query": "quota test", "size": 1, "useSemanticSearch": true}' | jq -r '.results[0].title // "No results"')
    
    if [ "$RESULT" != "No results" ]; then
        echo "✅ Semantic search working: Found '$RESULT'"
    fi
    
else
    echo "❓ Unexpected result - check manually"
fi

# Clean up
rm -f quota-test.json
cd ..

echo ""
echo "📊 Current System Status:"
DOCS=$(curl -s http://localhost:3001/api/search/stats | jq -r '.indexStats.documents // 0')
echo "   Documents indexed: $DOCS"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
