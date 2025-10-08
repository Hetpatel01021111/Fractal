#!/bin/bash

# AI-Powered Search Engine - Web Crawler Installation Script
# This script sets up the web crawler with all dependencies and configurations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
    
    # Check if Elasticsearch is running (optional)
    if command_exists curl; then
        if curl -s http://localhost:9200 >/dev/null 2>&1; then
            print_success "Elasticsearch is running on localhost:9200"
        else
            print_warning "Elasticsearch is not running on localhost:9200"
            print_warning "You may need to start Elasticsearch or configure ELASTICSEARCH_URL"
        fi
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the crawler directory?"
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create configuration files
create_config() {
    print_status "Creating configuration files..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << 'EOF'
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
# ELASTICSEARCH_API_KEY=your-api-key-here
CRAWLER_INDEX=web-content

# Crawler Settings
CRAWLER_CONCURRENT=5
CRAWLER_DELAY=1000
CRAWLER_TIMEOUT=30000
CRAWLER_RETRIES=3
CRAWLER_MAX_PAGES=1000
CRAWLER_MAX_DEPTH=3
CRAWLER_RESPECT_ROBOTS=true
CRAWLER_USER_AGENT=AI-Search-Crawler/1.0

# Content Settings
CRAWLER_MAX_CONTENT=50000
CRAWLER_MIN_CONTENT=100
CRAWLER_SNIPPET_LENGTH=300
CRAWLER_KEYWORD_LIMIT=20

# Storage and Logging
CRAWLER_CACHE_DIR=./crawler-cache
LOG_LEVEL=info
EOF
        print_success "Created .env configuration file"
    else
        print_warning ".env file already exists, skipping creation"
    fi
    
    # Create cache directory
    mkdir -p crawler-cache
    print_success "Created cache directory"
    
    # Create logs directory
    mkdir -p logs
    print_success "Created logs directory"
}

# Make scripts executable
make_executable() {
    print_status "Making scripts executable..."
    
    chmod +x web-crawler.js
    chmod +x test-crawler.js
    chmod +x examples/crawl-examples.js
    
    print_success "Scripts are now executable"
}

# Run basic tests
run_tests() {
    print_status "Running basic tests..."
    
    if node test-crawler.js; then
        print_success "All tests passed!"
    else
        print_warning "Some tests failed. This may be due to network issues or missing Elasticsearch."
        print_warning "You can still use the crawler, but check the configuration."
    fi
}

# Create sample URL files
create_samples() {
    print_status "Creating sample files..."
    
    # Create sample URLs file
    cat > sample-urls.txt << 'EOF'
https://example.com
https://httpbin.org/html
https://jsonplaceholder.typicode.com/posts/1
EOF
    
    # Create sample sitemap
    cat > sample-sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2024-01-01</lastmod>
  </url>
  <url>
    <loc>https://example.com/page2</loc>
    <lastmod>2024-01-02</lastmod>
  </url>
</urlset>
EOF
    
    print_success "Created sample files (sample-urls.txt, sample-sitemap.xml)"
}

# Display usage information
show_usage() {
    echo ""
    echo "🕷️  AI-Powered Search Engine - Web Crawler"
    echo "=============================================="
    echo ""
    echo "Installation completed successfully!"
    echo ""
    echo "📋 Quick Start:"
    echo "  # Test the installation"
    echo "  node test-crawler.js"
    echo ""
    echo "  # Crawl a single URL"
    echo "  node web-crawler.js \"https://example.com\""
    echo ""
    echo "  # Crawl from file"
    echo "  node web-crawler.js --file sample-urls.txt"
    echo ""
    echo "  # Run examples"
    echo "  node examples/crawl-examples.js news"
    echo ""
    echo "📁 Important Files:"
    echo "  .env              - Configuration file"
    echo "  web-crawler.js    - Main crawler script"
    echo "  test-crawler.js   - Test suite"
    echo "  crawler-config.js - Site configurations"
    echo "  README.md         - Complete documentation"
    echo ""
    echo "🔧 Configuration:"
    echo "  Edit .env file to customize crawler settings"
    echo "  Set ELASTICSEARCH_URL if not using localhost:9200"
    echo "  Adjust CRAWLER_CONCURRENT and CRAWLER_DELAY for your needs"
    echo ""
    echo "📖 Documentation:"
    echo "  cat README.md     - View full documentation"
    echo "  node web-crawler.js --help  - View CLI help"
    echo ""
    echo "🧪 Testing:"
    echo "  node test-crawler.js         - Run all tests"
    echo "  node test-crawler.js --network  - Include network tests"
    echo ""
}

# Main installation process
main() {
    echo "🕷️  AI-Powered Search Engine - Web Crawler Installation"
    echo "======================================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "web-crawler.js" ]; then
        print_error "web-crawler.js not found. Please run this script from the crawler directory."
        exit 1
    fi
    
    check_requirements
    echo ""
    
    install_dependencies
    echo ""
    
    create_config
    echo ""
    
    make_executable
    echo ""
    
    create_samples
    echo ""
    
    # Ask if user wants to run tests
    read -p "$(echo -e ${BLUE}[QUESTION]${NC} Do you want to run the test suite? [y/N]: )" -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        run_tests
        echo ""
    fi
    
    show_usage
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Web Crawler Installation Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --test-only    Only run tests (skip installation)"
        echo "  --no-tests     Skip running tests"
        echo ""
        exit 0
        ;;
    --test-only)
        print_status "Running tests only..."
        run_tests
        exit 0
        ;;
    --no-tests)
        check_requirements
        install_dependencies
        create_config
        make_executable
        create_samples
        show_usage
        exit 0
        ;;
    *)
        main
        ;;
esac
