#!/bin/bash

# Example usage of the advanced data ingestion script
# Make sure you have set up your .env file with GEMINI_API_KEY, ELASTICSEARCH_URL, and NEWSAPI_KEY

echo "🚀 AI-Powered Search Engine - Data Ingestion Examples"
echo "=================================================="

# Load environment variables
if [ -f "../../.env" ]; then
    export $(grep -v '^#' ../../.env | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  .env file not found. Please create it with your API keys."
fi

# Example 1: Ingest from URLs (Web Scraping)
echo "📄 Example 1: Ingesting from URLs..."
npm run ingest-data urls \
  "https://en.wikipedia.org/wiki/Artificial_intelligence" \
  "https://en.wikipedia.org/wiki/Machine_learning" \
  "https://en.wikipedia.org/wiki/Deep_learning"

echo "✅ URL ingestion completed!"
echo ""

# Example 2: Ingest from RSS feeds
echo "📡 Example 2: Ingesting from RSS feeds..."
npm run ingest-data rss "https://feeds.bbci.co.uk/news/technology/rss.xml"

echo "✅ RSS ingestion completed!"
echo ""

# Example 3: Ingest from NewsAPI (requires API key)
echo "📰 Example 3: Ingesting from NewsAPI..."
if [ -n "$NEWSAPI_KEY" ]; then
    npm run ingest-data newsapi --api-key "$NEWSAPI_KEY" --query "artificial intelligence" --page-size 10
else
    echo "⚠️  NEWSAPI_KEY not found in environment. Skipping NewsAPI ingestion."
fi

# Example 4: Mixed ingestion from multiple sources
echo "🔄 Example 4: Mixed ingestion from multiple sources..."
if [ -n "$NEWSAPI_KEY" ]; then
    npm run ingest-data mixed \
      --newsapi-key "$NEWSAPI_KEY" \
      --newsapi-query "technology" \
      --urls "https://en.wikipedia.org/wiki/Quantum_computing,https://en.wikipedia.org/wiki/Blockchain" \
      --rss "https://feeds.feedburner.com/oreilly/radar"
else
    npm run ingest-data mixed \
      --urls "https://en.wikipedia.org/wiki/Quantum_computing,https://en.wikipedia.org/wiki/Blockchain" \
      --rss "https://feeds.feedburner.com/oreilly/radar"
fi

echo "✅ Mixed ingestion completed!"
echo ""

# Example 5: Ingest from JSON file
echo "📋 Example 5: Creating and ingesting JSON data..."

# Create a sample JSON file
cat > sample-data.json << EOF
[
  {
    "title": "The Future of AI in Healthcare",
    "content": "Artificial intelligence is revolutionizing healthcare by enabling more accurate diagnoses, personalized treatments, and efficient drug discovery. Machine learning algorithms can analyze medical images, predict patient outcomes, and assist in surgical procedures.",
    "author": "Dr. Sarah Johnson",
    "category": "Healthcare",
    "tags": ["AI", "healthcare", "machine learning", "medical technology"],
    "date": "2024-10-02"
  },
  {
    "title": "Sustainable Energy Technologies",
    "content": "The transition to renewable energy sources is accelerating with advances in solar panel efficiency, wind turbine technology, and energy storage solutions. Smart grids and AI-powered energy management systems are optimizing energy distribution and consumption.",
    "author": "Prof. Michael Green",
    "category": "Energy",
    "tags": ["renewable energy", "sustainability", "solar power", "smart grid"],
    "date": "2024-10-01"
  }
]
EOF

npm run ingest-data json sample-data.json

echo "✅ JSON ingestion completed!"
echo ""

# Clean up
rm -f sample-data.json

echo "🎉 All ingestion examples completed!"
echo "You can now search for the ingested content using your AI-powered search engine at http://localhost:3000"
