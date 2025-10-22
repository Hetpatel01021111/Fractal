#!/bin/bash

echo "🔍 Setting up Elasticsearch for Fractal Search Engine..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is required but not installed. Please install Docker Compose first."
    exit 1
fi

# Create Elasticsearch Docker Compose file
cat > docker-compose.elasticsearch.yml << 'EOF'
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: fractal-elasticsearch
    environment:
      - node.name=fractal-es-node
      - cluster.name=fractal-search-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - fractal_es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - fractal-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: fractal-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - SERVER_NAME=fractal-kibana
    ports:
      - "5601:5601"
    networks:
      - fractal-network
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  fractal_es_data:
    driver: local

networks:
  fractal-network:
    driver: bridge
EOF

echo "📁 Created docker-compose.elasticsearch.yml"

# Start Elasticsearch
echo "🚀 Starting Elasticsearch..."
docker-compose -f docker-compose.elasticsearch.yml up -d

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
timeout=120
counter=0

while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:9200/_cluster/health >/dev/null 2>&1; then
        echo "✅ Elasticsearch is ready!"
        break
    fi
    
    echo "⏳ Waiting... ($counter/$timeout seconds)"
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Elasticsearch failed to start within $timeout seconds"
    echo "📋 Check logs with: docker-compose -f docker-compose.elasticsearch.yml logs elasticsearch"
    exit 1
fi

# Test Elasticsearch connection
echo "🔍 Testing Elasticsearch connection..."
response=$(curl -s http://localhost:9200)
if echo "$response" | grep -q "elasticsearch"; then
    echo "✅ Elasticsearch is running successfully!"
    echo "📊 Cluster info:"
    curl -s http://localhost:9200 | jq '.'
else
    echo "❌ Failed to connect to Elasticsearch"
    exit 1
fi

# Create environment file
echo "📝 Creating .env.local file..."
cat > frontend/.env.local << 'EOF'
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200

# Application Configuration
NEXT_PUBLIC_APP_NAME=Fractal Search Engine
NEXT_PUBLIC_API_URL=http://localhost:3000

# Development
NODE_ENV=development
EOF

echo "✅ Created frontend/.env.local"

echo ""
echo "🎉 Elasticsearch setup complete!"
echo ""
echo "📋 What's running:"
echo "   • Elasticsearch: http://localhost:9200"
echo "   • Kibana (optional): http://localhost:5601"
echo ""
echo "🔧 Next steps:"
echo "   1. cd frontend && npm install"
echo "   2. npm run dev"
echo "   3. Visit http://localhost:3000/admin"
echo "   4. Start scraping data!"
echo ""
echo "📊 Useful commands:"
echo "   • Check status: curl http://localhost:9200/_cluster/health"
echo "   • View logs: docker-compose -f docker-compose.elasticsearch.yml logs"
echo "   • Stop: docker-compose -f docker-compose.elasticsearch.yml down"
echo "   • Stop & remove data: docker-compose -f docker-compose.elasticsearch.yml down -v"
echo ""
echo "🔍 Your search engine now has persistent Elasticsearch storage!"
