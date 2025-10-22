# AI-Powered Search Engine

A full-stack intelligent search engine that combines traditional text search with AI-powered semantic understanding, built with Next.js, Express.js, Elasticsearch, and Google's Gemini API.

## 🚀 Features

- **Semantic Search**: AI-powered search using Google Gemini embeddings
- **Traditional Text Search**: Fast full-text search with Elasticsearch
- **AI Summarization**: Automatic summarization of search results
- **Smart Query Enhancement**: AI-powered query expansion and refinement
- **Search Suggestions**: Intelligent search suggestions based on context
- **Modern UI**: Beautiful, responsive interface built with Next.js and TailwindCSS
- **Multi-format Support**: Ingest documents from PDF, DOCX, HTML, JSON, CSV, and TXT files
- **Real-time Search**: Fast, responsive search experience
- **Docker Support**: Easy deployment with Docker and Docker Compose

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Elasticsearch  │
│   (Next.js)     │◄──►│   (Express)     │◄──►│    (Search)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Gemini API    │
                       │ (AI/Embeddings) │
                       └─────────────────┘
```

## 📁 Project Structure

```
ai-powered-search-engine/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # Next.js 13+ app directory
│   ├── components/          # React components
│   ├── types/              # TypeScript type definitions
│   └── package.json
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   └── server.ts       # Main server file
│   └── package.json
├── scripts/                 # Data ingestion and utility scripts
│   ├── src/
│   │   ├── services/       # Shared services
│   │   └── ingest.ts       # Main ingestion script
│   └── package.json
├── docker-compose.yml       # Docker orchestration
├── Dockerfile              # Multi-stage Docker build
└── README.md
```

## 🛠️ Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized setup)
- Google Gemini API key
- At least 4GB RAM (for Elasticsearch)

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd ai-powered-search-engine
   cp .env.example .env
   ```

2. **Configure environment variables**:
   Edit `.env` file and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ELASTICSEARCH_URL=http://localhost:9200
   BACKEND_PORT=3001
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Ingest sample data**:
   ```bash
   docker-compose --profile ingestion up data-ingestion
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Elasticsearch: http://localhost:9200
   - Kibana (optional): http://localhost:5601

### Option 2: Manual Setup

1. **Install Elasticsearch**:
   ```bash
   # Using Docker
   docker run -d \
     --name elasticsearch \
     -p 9200:9200 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:8.11.0
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**:
   ```bash
   npm run install:all
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev

   # Terminal 3: Ingest sample data
   cd scripts && npm run ingest -- --sample
   ```

## 📊 API Endpoints

### Search API
- `POST /api/search` - Main search endpoint
- `GET /api/search/suggestions?q=query` - Get search suggestions
- `POST /api/search/analyze` - Analyze search intent
- `GET /api/search/stats` - Get search statistics

### Health API
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with service status
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe

### Example Search Request
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence machine learning",
    "size": 10,
    "useSemanticSearch": true
  }'
```

## 📝 Data Ingestion

The project includes powerful data ingestion scripts that support multiple file formats:

### Supported Formats
- **Text files** (.txt)
- **PDF documents** (.pdf)
- **Word documents** (.docx)
- **HTML files** (.html, .htm)
- **JSON files** (.json)
- **CSV files** (.csv)

### Ingestion Commands

```bash
# Ingest sample data for testing
cd scripts && npm run ingest -- --sample

# Ingest from a directory
cd scripts && npm run ingest -- --directory /path/to/documents

# Ingest a single file
cd scripts && npm run ingest -- --file /path/to/document.pdf

# Ingest with specific format filter
cd scripts && npm run ingest -- --directory /path/to/docs --format pdf

# Skip embedding generation (faster for testing)
cd scripts && npm run ingest -- --directory /path/to/docs --skip-embeddings

# Batch processing with custom batch size
cd scripts && npm run ingest -- --directory /path/to/docs --batch-size 5
```

### Ingestion Options
- `--directory <path>`: Directory containing documents
- `--file <path>`: Single file to ingest
- `--sample`: Ingest sample data for testing
- `--format <format>`: Filter by file format (txt,pdf,docx,html,json,csv)
- `--batch-size <size>`: Batch size for processing (default: 10)
- `--skip-embeddings`: Skip generating embeddings (faster for testing)
- `--overwrite`: Overwrite existing documents

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `ELASTICSEARCH_URL` | Elasticsearch connection URL | `http://localhost:9200` |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username | Optional |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password | Optional |
| `BACKEND_PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3001` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Scaling Services
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer (requires additional configuration)
docker-compose up -d --scale backend=3 --scale frontend=2
```

## 🔍 Search Features

### 1. Semantic Search
- Uses Google Gemini embeddings for understanding context
- Finds relevant documents even with different terminology
- Combines semantic similarity with traditional text matching

### 2. Query Enhancement
- AI-powered query expansion
- Automatic spelling correction
- Context-aware suggestions

### 3. Result Summarization
- AI-generated summaries of search results
- Key point extraction
- Contextual insights

### 4. Search Analytics
- Search intent analysis
- Query performance metrics
- Usage statistics

## 🧪 Testing

### Backend Tests
```bash
cd backend && npm test
```

### Frontend Tests
```bash
cd frontend && npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run tests/load-test.yml
```

## 📈 Monitoring

### Health Checks
- Backend: `http://localhost:3001/api/health`
- Elasticsearch: `http://localhost:9200/_cluster/health`

### Metrics
- Search response times
- Elasticsearch cluster status
- API endpoint performance
- Error rates and logs

### Logging
Logs are structured and include:
- Request/response details
- Search queries and results
- Error traces
- Performance metrics

## 🔒 Security

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Input validation with Joi
- Helmet.js security headers

### Data Security
- No sensitive data in logs
- Environment variable protection
- Secure Elasticsearch configuration

### Best Practices
- Regular dependency updates
- Security scanning
- Access control policies
- Data encryption in transit

## 🚀 Performance Optimization

### Frontend
- Next.js static generation
- Component lazy loading
- Image optimization
- Bundle size optimization

### Backend
- Connection pooling
- Response caching
- Compression middleware
- Database query optimization

### Elasticsearch
- Index optimization
- Query performance tuning
- Cluster scaling
- Memory management

## 🛠️ Development

### Code Style
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Consistent naming conventions

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-search-feature

# Make changes and commit
git add .
git commit -m "feat: add semantic search enhancement"

# Push and create PR
git push origin feature/new-search-feature
```

### Debugging
- VS Code debug configurations
- Chrome DevTools integration
- Server-side logging
- Error tracking

## 📚 API Documentation

Detailed API documentation is available at:
- Swagger UI: `http://localhost:3001/api-docs` (when running)
- OpenAPI spec: `./docs/api-spec.yaml`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Elasticsearch connection failed**
```bash
# Check if Elasticsearch is running
curl http://localhost:9200

# Restart Elasticsearch
docker restart elasticsearch
```

**Gemini API errors**
- Verify API key is correct
- Check API quota and billing
- Ensure proper network connectivity

**Frontend build errors**
```bash
# Clear Next.js cache
cd frontend && rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Memory issues**
- Increase Docker memory allocation
- Optimize Elasticsearch heap size
- Monitor system resources

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review logs in `docker-compose logs`
- Join our [Discord community](https://discord.gg/your-server)

## 🎯 Roadmap

- [ ] Advanced search filters
- [ ] User authentication and profiles
- [ ] Search history and bookmarks
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Enterprise features
- [ ] Plugin system

---

**Built with ❤️ using Next.js, Express.js, Elasticsearch, and Google Gemini AI**
# Fractal
