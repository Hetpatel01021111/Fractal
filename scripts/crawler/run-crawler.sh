#!/bin/bash

# AI-Powered Search Engine - Web Crawler Runner Script
# Convenient wrapper script for running the web crawler with different configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Show help
show_help() {
    cat << EOF
🕷️  AI-Powered Search Engine - Web Crawler Runner

Usage: $0 [preset] [options] [urls...]

PRESETS:
  news         Optimized for news websites (slower, respectful)
  blog         Optimized for blog content (medium speed)
  docs         Optimized for documentation sites (faster)
  ecommerce    Optimized for e-commerce sites (very slow, respectful)
  fast         Fast crawling (use with caution)
  safe         Very safe crawling (slow but respectful)

OPTIONS:
  -f, --file FILE          Crawl URLs from file
  -s, --sitemap URL        Crawl from sitemap URL
  -c, --concurrent N       Set concurrent requests (default: 5)
  -d, --delay MS           Set delay between requests in ms (default: 1000)
  -m, --max-pages N        Maximum pages to crawl (default: 1000)
  --depth N                Maximum crawl depth (default: 3)
  --index NAME             Elasticsearch index name (default: web-content)
  --no-robots              Ignore robots.txt
  --debug                  Enable debug logging
  --dry-run                Show what would be crawled without actually crawling
  -h, --help               Show this help

EXAMPLES:
  # Quick news crawl
  $0 news "https://techcrunch.com" "https://arstechnica.com"
  
  # Blog crawl from file
  $0 blog --file blog-urls.txt
  
  # Fast documentation crawl
  $0 docs --concurrent 10 --delay 500 "https://docs.python.org"
  
  # E-commerce crawl (respectful)
  $0 ecommerce --sitemap "https://store.example.com/sitemap.xml"
  
  # Custom configuration
  $0 --concurrent 3 --delay 2000 --max-pages 100 "https://example.com"

ENVIRONMENT VARIABLES:
  ELASTICSEARCH_URL        Elasticsearch endpoint
  ELASTICSEARCH_API_KEY    Elasticsearch API key
  CRAWLER_USER_AGENT       Custom user agent string

EOF
}

# Preset configurations
apply_preset() {
    case "$1" in
        news)
            export CRAWLER_CONCURRENT=3
            export CRAWLER_DELAY=2000
            export CRAWLER_MAX_PAGES=500
            export CRAWLER_RESPECT_ROBOTS=true
            export CRAWLER_USER_AGENT="AI-Search-News-Crawler/1.0"
            print_status "Applied NEWS preset: Respectful crawling for news sites"
            ;;
        blog)
            export CRAWLER_CONCURRENT=4
            export CRAWLER_DELAY=1500
            export CRAWLER_MAX_PAGES=1000
            export CRAWLER_RESPECT_ROBOTS=true
            export CRAWLER_USER_AGENT="AI-Search-Blog-Crawler/1.0"
            print_status "Applied BLOG preset: Balanced crawling for blogs"
            ;;
        docs)
            export CRAWLER_CONCURRENT=8
            export CRAWLER_DELAY=800
            export CRAWLER_MAX_PAGES=2000
            export CRAWLER_MAX_DEPTH=4
            export CRAWLER_RESPECT_ROBOTS=true
            export CRAWLER_USER_AGENT="AI-Search-Docs-Crawler/1.0"
            print_status "Applied DOCS preset: Faster crawling for documentation"
            ;;
        ecommerce)
            export CRAWLER_CONCURRENT=2
            export CRAWLER_DELAY=3000
            export CRAWLER_MAX_PAGES=200
            export CRAWLER_RESPECT_ROBOTS=true
            export CRAWLER_USER_AGENT="AI-Search-Commerce-Crawler/1.0"
            print_status "Applied ECOMMERCE preset: Very respectful crawling for stores"
            ;;
        fast)
            export CRAWLER_CONCURRENT=15
            export CRAWLER_DELAY=300
            export CRAWLER_MAX_PAGES=5000
            export CRAWLER_RESPECT_ROBOTS=true
            export CRAWLER_USER_AGENT="AI-Search-Fast-Crawler/1.0"
            print_warning "Applied FAST preset: Use responsibly!"
            ;;
        safe)
            export CRAWLER_CONCURRENT=1
            export CRAWLER_DELAY=5000
            export CRAWLER_MAX_PAGES=100
            export CRAWLER_RESPECT_ROBOTS=true
            export CRAWLER_USER_AGENT="AI-Search-Safe-Crawler/1.0"
            print_status "Applied SAFE preset: Very conservative crawling"
            ;;
        *)
            print_error "Unknown preset: $1"
            echo "Available presets: news, blog, docs, ecommerce, fast, safe"
            exit 1
            ;;
    esac
}

# Parse command line arguments
parse_args() {
    PRESET=""
    URLS=()
    FILE=""
    SITEMAP=""
    DRY_RUN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            news|blog|docs|ecommerce|fast|safe)
                if [ -z "$PRESET" ]; then
                    PRESET="$1"
                    apply_preset "$1"
                else
                    URLS+=("$1")
                fi
                shift
                ;;
            -f|--file)
                FILE="$2"
                shift 2
                ;;
            -s|--sitemap)
                SITEMAP="$2"
                shift 2
                ;;
            -c|--concurrent)
                export CRAWLER_CONCURRENT="$2"
                shift 2
                ;;
            -d|--delay)
                export CRAWLER_DELAY="$2"
                shift 2
                ;;
            -m|--max-pages)
                export CRAWLER_MAX_PAGES="$2"
                shift 2
                ;;
            --depth)
                export CRAWLER_MAX_DEPTH="$2"
                shift 2
                ;;
            --index)
                export CRAWLER_INDEX="$2"
                shift 2
                ;;
            --no-robots)
                export CRAWLER_RESPECT_ROBOTS=false
                shift
                ;;
            --debug)
                export LOG_LEVEL=debug
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                print_error "Unknown option: $1"
                exit 1
                ;;
            *)
                URLS+=("$1")
                shift
                ;;
        esac
    done
}

# Validate configuration
validate_config() {
    # Check if web-crawler.js exists
    if [ ! -f "web-crawler.js" ]; then
        print_error "web-crawler.js not found. Please run from the crawler directory."
        exit 1
    fi
    
    # Check if we have something to crawl
    if [ ${#URLS[@]} -eq 0 ] && [ -z "$FILE" ] && [ -z "$SITEMAP" ]; then
        print_error "No URLs provided. Use URLs, --file, or --sitemap option."
        echo "Run '$0 --help' for usage information."
        exit 1
    fi
    
    # Check if file exists
    if [ -n "$FILE" ] && [ ! -f "$FILE" ]; then
        print_error "File not found: $FILE"
        exit 1
    fi
    
    # Validate numeric parameters
    if [ -n "$CRAWLER_CONCURRENT" ] && ! [[ "$CRAWLER_CONCURRENT" =~ ^[0-9]+$ ]]; then
        print_error "Concurrent requests must be a number"
        exit 1
    fi
    
    if [ -n "$CRAWLER_DELAY" ] && ! [[ "$CRAWLER_DELAY" =~ ^[0-9]+$ ]]; then
        print_error "Delay must be a number"
        exit 1
    fi
}

# Show configuration summary
show_config() {
    echo ""
    echo "🔧 Crawler Configuration:"
    echo "  Concurrent Requests: ${CRAWLER_CONCURRENT:-5}"
    echo "  Delay Between Requests: ${CRAWLER_DELAY:-1000}ms"
    echo "  Max Pages: ${CRAWLER_MAX_PAGES:-1000}"
    echo "  Max Depth: ${CRAWLER_MAX_DEPTH:-3}"
    echo "  Respect Robots.txt: ${CRAWLER_RESPECT_ROBOTS:-true}"
    echo "  Index: ${CRAWLER_INDEX:-web-content}"
    echo "  Log Level: ${LOG_LEVEL:-info}"
    echo ""
    
    if [ ${#URLS[@]} -gt 0 ]; then
        echo "📋 URLs to crawl:"
        for url in "${URLS[@]}"; do
            echo "  - $url"
        done
        echo ""
    fi
    
    if [ -n "$FILE" ]; then
        echo "📄 URL file: $FILE"
        if [ -f "$FILE" ]; then
            local count=$(wc -l < "$FILE")
            echo "  Contains $count URLs"
        fi
        echo ""
    fi
    
    if [ -n "$SITEMAP" ]; then
        echo "🗺️  Sitemap: $SITEMAP"
        echo ""
    fi
}

# Estimate crawl time
estimate_time() {
    local total_urls=0
    local delay=${CRAWLER_DELAY:-1000}
    local concurrent=${CRAWLER_CONCURRENT:-5}
    
    # Count URLs
    total_urls=${#URLS[@]}
    
    if [ -n "$FILE" ] && [ -f "$FILE" ]; then
        local file_urls=$(wc -l < "$FILE")
        total_urls=$((total_urls + file_urls))
    fi
    
    if [ $total_urls -gt 0 ]; then
        local time_per_batch=$((delay / 1000))
        local batches=$(((total_urls + concurrent - 1) / concurrent))
        local estimated_seconds=$((batches * time_per_batch))
        local estimated_minutes=$((estimated_seconds / 60))
        
        echo "⏱️  Estimated crawl time: ${estimated_minutes}m ${estimated_seconds}s (for $total_urls URLs)"
        echo ""
    fi
}

# Run the crawler
run_crawler() {
    local args=()
    
    # Build arguments
    if [ -n "$FILE" ]; then
        args+=("--file" "$FILE")
    elif [ -n "$SITEMAP" ]; then
        args+=("$SITEMAP")
    else
        args+=("${URLS[@]}")
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_status "DRY RUN - Would execute:"
        echo "node web-crawler.js ${args[*]}"
        echo ""
        echo "Environment variables:"
        env | grep CRAWLER_ | sort
        return 0
    fi
    
    print_status "Starting web crawler..."
    echo ""
    
    # Run the crawler
    if node web-crawler.js "${args[@]}"; then
        print_success "Crawling completed successfully!"
    else
        print_error "Crawling failed!"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_warning "package.json not found. Dependencies may not be installed."
        print_status "Run: npm install"
    fi
}

# Main function
main() {
    echo "🕷️  AI-Powered Search Engine - Web Crawler Runner"
    echo "=================================================="
    echo ""
    
    check_prerequisites
    parse_args "$@"
    validate_config
    show_config
    estimate_time
    
    # Confirm before running (unless dry run)
    if [ "$DRY_RUN" = false ]; then
        read -p "$(echo -e ${BLUE}[QUESTION]${NC} Proceed with crawling? [Y/n]: )" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_status "Crawling cancelled."
            exit 0
        fi
        echo ""
    fi
    
    run_crawler
}

# Handle no arguments
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Run main function
main "$@"
