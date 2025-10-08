#!/bin/bash

# AI-Powered Search Engine Setup Script

set -e

echo "🚀 Setting up AI-Powered Search Engine..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your Gemini API key"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing scripts dependencies..."
cd scripts && npm install && cd ..

echo "✅ All dependencies installed"

# Check if user wants to use Docker setup
read -p "Do you want to start with Docker setup? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Starting services with Docker..."
    
    # Start Elasticsearch and other services
    docker-compose up -d elasticsearch kibana
    
    echo "⏳ Waiting for Elasticsearch to be ready..."
    sleep 30
    
    # Check Elasticsearch health
    until curl -f http://localhost:9200/_cluster/health &>/dev/null; do
        echo "⏳ Waiting for Elasticsearch..."
        sleep 5
    done
    
    echo "✅ Elasticsearch is ready"
    
    # Start backend and frontend
    docker-compose up -d backend frontend
    
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Ingest sample data
    echo "📊 Ingesting sample data..."
    docker-compose --profile ingestion up data-ingestion
    
    echo "🎉 Setup complete!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🔍 Elasticsearch: http://localhost:9200"
    echo "📊 Kibana: http://localhost:5601"
    echo ""
    echo "To stop services: docker-compose down"
    
else
    echo "📝 Manual setup selected"
    echo ""
    echo "Next steps:"
    echo "1. Start Elasticsearch: docker run -d --name elasticsearch -p 9200:9200 -e \"discovery.type=single-node\" -e \"xpack.security.enabled=false\" docker.elastic.co/elasticsearch/elasticsearch:8.11.0"
    echo "2. Edit .env file with your Gemini API key"
    echo "3. Start backend: cd backend && npm run dev"
    echo "4. Start frontend: cd frontend && npm run dev"
    echo "5. Ingest sample data: cd scripts && npm run ingest -- --sample"
fi

echo ""
echo "📚 Check README.md for detailed documentation"
echo "🆘 Need help? Check the troubleshooting section in README.md"
