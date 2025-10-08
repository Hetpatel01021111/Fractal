# Data Ingestion Scripts

This directory contains powerful data ingestion tools for the AI-powered search engine that can process content from multiple sources and automatically generate embeddings.

## 🚀 Features

- **Multi-source ingestion**: URLs, NewsAPI, RSS feeds, JSON files
- **Automatic text cleaning**: Preprocessing and normalization
- **AI embeddings**: Gemini API integration for semantic search
- **Metadata extraction**: Author, date, category, tags
- **Batch processing**: Efficient bulk operations
- **Error handling**: Robust error recovery and reporting

## 📁 Files

- `src/ingestData.ts` - Main ingestion script with CLI interface
- `src/ingest.ts` - Original sample data ingestion
- `examples/ingest-examples.sh` - Usage examples
- `README.md` - This documentation

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp ../.env.example .env
   # Edit .env and add your GEMINI_API_KEY and ELASTICSEARCH_URL
   ```

3. **Ensure services are running**:
   - Elasticsearch (local or cloud)
   - Backend API server

## 📊 Usage

### Command Line Interface

The main ingestion script supports multiple data sources:

```bash
npm run ingest-data <command> [options]
```

### Available Commands

#### 1. **NewsAPI Integration**
```bash
npm run ingest-data newsapi --api-key YOUR_KEY --query "artificial intelligence" --page-size 20
```

**Options:**
- `--api-key` (required): Your NewsAPI key
- `--query`: Search query for articles
- `--category`: News category (business, technology, etc.)
- `--country`: Country code (us, gb, etc.)
- `--language`: Language code (en, es, etc.)
- `--page-size`: Number of articles (default: 20)

#### 2. **URL Scraping**
```bash
npm run ingest-data urls "https://example.com" "https://another-site.com"
```

**Features:**
- Intelligent content extraction
- Metadata parsing (author, date, description)
- Automatic text cleaning
- Multiple URL support

#### 3. **RSS Feeds**
```bash
npm run ingest-data rss "https://feeds.example.com/rss.xml"
```

**Supported formats:**
- Standard RSS 2.0
- Atom feeds
- Dublin Core metadata

#### 4. **JSON Data**
```bash
npm run ingest-data json "data.json"
npm run ingest-data json "https://api.example.com/articles"
```

**Flexible JSON structure support:**
- Array of documents
- NewsAPI format (`{articles: [...]}`)
- Generic formats (`{items: [...]}`, `{data: [...]}`)
- Single document objects

#### 5. **Mixed Sources**
```bash
npm run ingest-data mixed \
  --newsapi-key YOUR_KEY \
  --newsapi-query "AI" \
  --urls "https://site1.com,https://site2.com" \
  --rss "https://feed1.xml,https://feed2.xml" \
  --json "data1.json,data2.json"
```

## 🔧 Advanced Configuration

### Text Cleaning Pipeline

The ingestion script includes sophisticated text preprocessing:

1. **HTML tag removal**
2. **Whitespace normalization**
3. **Special character filtering**
4. **Content extraction** from main article areas
5. **Metadata parsing** from HTML meta tags

### Embedding Generation

- **Automatic chunking** for long content (max 2000 chars)
- **Gemini API integration** for high-quality embeddings
- **Error handling** with fallback strategies
- **Rate limiting** to respect API quotas

### Metadata Extraction

Automatically extracts and structures:
- **Author information**
- **Publication dates**
- **Content categories**
- **Relevant tags** (AI-generated and extracted)
- **Source information**
- **Language detection**

## 📈 Performance & Monitoring

### Statistics Tracking

Each ingestion run provides detailed statistics:
- Total documents processed
- Success/failure rates
- Processing speed (docs/sec)
- Source breakdown
- Error summaries

### Example Output
```
📊 Ingestion Statistics:
   Total Processed: 25
   Successful: 23
   Failed: 2
   Duration: 45s
   Rate: 0.56 docs/sec

📋 Sources:
   - NewsAPI (10 articles)
   - URL: https://example.com
   - RSS: https://feeds.example.com (15 items)
```

## 🎯 Examples

### Basic Web Scraping
```bash
# Scrape Wikipedia articles about AI
npm run ingest-data urls \
  "https://en.wikipedia.org/wiki/Artificial_intelligence" \
  "https://en.wikipedia.org/wiki/Machine_learning"
```

### News Ingestion
```bash
# Get latest tech news (requires NewsAPI key)
npm run ingest-data newsapi \
  --api-key "your-key-here" \
  --category technology \
  --country us \
  --page-size 15
```

### RSS Feed Processing
```bash
# Ingest from tech blogs
npm run ingest-data rss "https://feeds.feedburner.com/oreilly/radar"
```

### JSON Data Import
```bash
# Import structured data
echo '[{"title":"Test","content":"Content","author":"Author"}]' > test.json
npm run ingest-data json test.json
```

### Comprehensive Mixed Ingestion
```bash
# Run the example script
./examples/ingest-examples.sh
```

## 🔍 Supported Data Sources

### Web Pages
- **Wikipedia articles**
- **News websites**
- **Blog posts**
- **Documentation sites**
- **Research papers** (HTML format)

### APIs
- **NewsAPI** (news.org)
- **RSS/Atom feeds**
- **Custom JSON APIs**
- **RESTful endpoints**

### File Formats
- **JSON** (various structures)
- **RSS/XML** feeds
- **HTML** documents

## 🛡️ Error Handling

The ingestion system includes robust error handling:

- **Network timeouts** with retry logic
- **Invalid content** detection and skipping
- **API rate limiting** respect
- **Partial failure** recovery
- **Detailed error logging**

## 🚀 Integration

### With Search Engine

Ingested documents are automatically:
1. **Indexed** in Elasticsearch with full-text search
2. **Embedded** using Gemini AI for semantic search
3. **Structured** with rich metadata
4. **Searchable** immediately via the web interface

### With Backend API

The ingestion script uses the same Elasticsearch client as the backend, ensuring:
- **Consistent indexing** strategies
- **Compatible document formats**
- **Unified search capabilities**
- **Shared configuration**

## 📚 Development

### Adding New Sources

To add support for new data sources:

1. **Create interface** for the data format
2. **Implement processing method** in `DataIngestionService`
3. **Add CLI command** in the program configuration
4. **Update documentation** and examples

### Custom Processing

The `DataIngestionService` class can be extended for custom processing:

```typescript
class CustomIngestionService extends DataIngestionService {
  async processCustomSource(data: any): Promise<void> {
    // Custom processing logic
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**"Failed to initialize services"**
- Check Elasticsearch connection
- Verify Gemini API key
- Ensure backend is running

**"Failed to scrape URL"**
- Check URL accessibility
- Verify network connectivity
- Some sites may block automated access

**"Embedding generation failed"**
- Check Gemini API quota
- Verify API key permissions
- Monitor rate limits

### Debug Mode

Enable verbose logging by setting:
```bash
export DEBUG=true
npm run ingest-data ...
```

## 📄 License

This project is licensed under the MIT License - see the main project LICENSE file for details.
