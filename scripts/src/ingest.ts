#!/usr/bin/env ts-node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';
import ProgressBar from 'progress';
import { DataIngestionService } from './services/DataIngestionService';
import { ElasticsearchService } from './services/ElasticsearchService';
import { GeminiService } from './services/GeminiService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const program = new Command();

program
  .name('ingest')
  .description('Data ingestion tool for AI-powered search engine')
  .version('1.0.0');

program
  .option('-d, --directory <path>', 'Directory containing documents to ingest')
  .option('-f, --file <path>', 'Single file to ingest')
  .option('-s, --sample', 'Ingest sample data for testing')
  .option('--format <format>', 'File format filter (txt,pdf,docx,html,json,csv)', 'all')
  .option('--batch-size <size>', 'Batch size for processing', '10')
  .option('--skip-embeddings', 'Skip generating embeddings (faster for testing)')
  .option('--overwrite', 'Overwrite existing documents')
  .parse();

const options = program.opts();

interface IngestionStats {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
}

class IngestionOrchestrator {
  private elasticsearchService: ElasticsearchService;
  private geminiService: GeminiService;
  private dataIngestionService: DataIngestionService;
  private stats: IngestionStats;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
    this.geminiService = new GeminiService();
    this.dataIngestionService = new DataIngestionService();
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing services...');
    
    try {
      await this.elasticsearchService.initialize();
      console.log('✅ Elasticsearch connected');
      
      if (!options.skipEmbeddings) {
        await this.geminiService.initialize();
        console.log('✅ Gemini AI initialized');
      }
      
      console.log('✅ All services initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  async ingestSampleData(): Promise<void> {
    console.log('📝 Creating sample data...');
    
    const sampleDocuments = [
      {
        id: 'sample-1',
        title: 'Introduction to Artificial Intelligence',
        content: `Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. AI research has been highly successful in developing effective techniques for solving a wide range of problems, from game playing to medical diagnosis.

Key areas of AI include:
- Machine Learning: Algorithms that improve automatically through experience
- Natural Language Processing: Understanding and generating human language
- Computer Vision: Interpreting and understanding visual information
- Robotics: Creating intelligent physical agents
- Expert Systems: Computer systems that emulate human expertise

AI has applications in many fields including healthcare, finance, transportation, and entertainment. As AI technology continues to advance, it promises to transform how we work, live, and interact with technology.`,
        url: 'https://example.com/ai-intro',
        metadata: {
          author: 'Dr. Jane Smith',
          date: '2024-01-15',
          category: 'Technology',
          tags: ['artificial intelligence', 'machine learning', 'computer science'],
        },
      },
      {
        id: 'sample-2',
        title: 'Climate Change and Renewable Energy',
        content: `Climate change represents one of the most pressing challenges of our time. The increasing concentration of greenhouse gases in the atmosphere is leading to global warming and significant environmental changes.

Renewable energy sources offer a promising solution:
- Solar Power: Converting sunlight into electricity using photovoltaic cells
- Wind Energy: Harnessing wind power through turbines
- Hydroelectric Power: Generating electricity from flowing water
- Geothermal Energy: Using heat from the Earth's core
- Biomass: Converting organic materials into energy

The transition to renewable energy is essential for reducing carbon emissions and mitigating climate change. Governments and organizations worldwide are investing heavily in renewable energy infrastructure and technology development.`,
        url: 'https://example.com/climate-renewable',
        metadata: {
          author: 'Prof. Michael Green',
          date: '2024-01-10',
          category: 'Environment',
          tags: ['climate change', 'renewable energy', 'sustainability'],
        },
      },
      {
        id: 'sample-3',
        title: 'The Future of Space Exploration',
        content: `Space exploration has entered a new era with private companies joining government agencies in pushing the boundaries of human presence in space. Recent achievements include successful Mars rover missions, the development of reusable rockets, and plans for lunar bases.

Current and future space missions include:
- Mars Exploration: Searching for signs of past or present life
- Lunar Gateway: A space station orbiting the Moon
- Asteroid Mining: Extracting valuable resources from asteroids
- Deep Space Telescopes: Observing distant galaxies and exoplanets
- Interplanetary Travel: Developing technology for human missions to Mars

The commercialization of space has opened new opportunities for scientific research, resource extraction, and even space tourism. As technology advances, space exploration will continue to expand human knowledge and capabilities.`,
        url: 'https://example.com/space-exploration',
        metadata: {
          author: 'Dr. Sarah Johnson',
          date: '2024-01-05',
          category: 'Science',
          tags: ['space exploration', 'mars', 'rockets', 'astronomy'],
        },
      },
      {
        id: 'sample-4',
        title: 'Quantum Computing Fundamentals',
        content: `Quantum computing represents a revolutionary approach to computation that leverages the principles of quantum mechanics. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or qubits that can exist in multiple states simultaneously.

Key quantum computing concepts:
- Superposition: Qubits can be in multiple states at once
- Entanglement: Qubits can be correlated in ways that classical physics cannot explain
- Quantum Interference: Manipulating probability amplitudes to get desired outcomes
- Quantum Gates: Operations that manipulate qubits
- Quantum Algorithms: Algorithms designed for quantum computers

Quantum computing has potential applications in cryptography, drug discovery, financial modeling, and optimization problems. While still in early stages, quantum computers could solve certain problems exponentially faster than classical computers.`,
        url: 'https://example.com/quantum-computing',
        metadata: {
          author: 'Dr. Alex Chen',
          date: '2024-01-20',
          category: 'Technology',
          tags: ['quantum computing', 'physics', 'algorithms', 'cryptography'],
        },
      },
      {
        id: 'sample-5',
        title: 'Sustainable Agriculture and Food Security',
        content: `Sustainable agriculture is crucial for ensuring food security while protecting the environment. As the global population continues to grow, innovative farming practices are needed to increase crop yields while minimizing environmental impact.

Sustainable farming practices include:
- Precision Agriculture: Using technology to optimize crop management
- Organic Farming: Avoiding synthetic pesticides and fertilizers
- Crop Rotation: Alternating crops to maintain soil health
- Vertical Farming: Growing crops in vertically stacked layers
- Integrated Pest Management: Using biological and cultural controls

Technology plays a key role in modern agriculture through GPS-guided tractors, drone monitoring, soil sensors, and AI-powered crop analysis. These innovations help farmers make data-driven decisions to improve efficiency and sustainability.`,
        url: 'https://example.com/sustainable-agriculture',
        metadata: {
          author: 'Dr. Maria Rodriguez',
          date: '2024-01-12',
          category: 'Agriculture',
          tags: ['sustainable agriculture', 'food security', 'farming', 'technology'],
        },
      },
    ];

    await this.processBatch(sampleDocuments);
  }

  async ingestFromDirectory(directoryPath: string): Promise<void> {
    if (!await fs.pathExists(directoryPath)) {
      throw new Error(`Directory does not exist: ${directoryPath}`);
    }

    console.log(`📁 Scanning directory: ${directoryPath}`);
    
    const patterns = this.getFilePatterns(options.format);
    const files = await glob(patterns, { cwd: directoryPath });
    
    if (files.length === 0) {
      console.log('⚠️  No files found matching the specified format');
      return;
    }

    console.log(`📄 Found ${files.length} files to process\n`);
    
    const batchSize = parseInt(options.batchSize);
    const progressBar = new ProgressBar('Processing [:bar] :current/:total :percent :etas', {
      complete: '█',
      incomplete: '░',
      width: 40,
      total: files.length,
    });

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const documents = [];

      for (const file of batch) {
        try {
          const filePath = path.join(directoryPath, file);
          const document = await this.dataIngestionService.processFile(filePath);
          if (document) {
            documents.push(document);
          }
          progressBar.tick();
        } catch (error) {
          console.error(`\n❌ Failed to process file ${file}:`, error);
          this.stats.failed++;
          progressBar.tick();
        }
      }

      if (documents.length > 0) {
        await this.processBatch(documents);
      }
    }
  }

  async ingestSingleFile(filePath: string): Promise<void> {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    console.log(`📄 Processing file: ${filePath}`);
    
    try {
      const document = await this.dataIngestionService.processFile(filePath);
      if (document) {
        await this.processBatch([document]);
      }
    } catch (error) {
      console.error('❌ Failed to process file:', error);
      this.stats.failed++;
    }
  }

  private async processBatch(documents: any[]): Promise<void> {
    for (const document of documents) {
      try {
        // Check if document already exists
        if (!options.overwrite) {
          // In a real implementation, you'd check if the document exists
          // For now, we'll assume it doesn't exist
        }

        // Generate embedding if not skipped
        if (!options.skipEmbeddings) {
          const embeddingText = `${document.title} ${document.content}`.substring(0, 1000);
          document.embedding = await this.geminiService.generateEmbedding(embeddingText);
        }

        // Index document
        await this.elasticsearchService.indexDocument(document);
        this.stats.successful++;
        
      } catch (error) {
        console.error(`❌ Failed to process document ${document.id}:`, error);
        this.stats.failed++;
      }
      
      this.stats.processed++;
    }
  }

  private getFilePatterns(format: string): string[] {
    const patterns: { [key: string]: string[] } = {
      all: ['**/*.txt', '**/*.pdf', '**/*.docx', '**/*.html', '**/*.json', '**/*.csv'],
      txt: ['**/*.txt'],
      pdf: ['**/*.pdf'],
      docx: ['**/*.docx'],
      html: ['**/*.html', '**/*.htm'],
      json: ['**/*.json'],
      csv: ['**/*.csv'],
    };

    return patterns[format] || patterns.all;
  }

  printStats(): void {
    this.stats.endTime = new Date();
    const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    
    console.log('\n📊 Ingestion Statistics:');
    console.log(`   Total Processed: ${this.stats.processed}`);
    console.log(`   Successful: ${this.stats.successful}`);
    console.log(`   Failed: ${this.stats.failed}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Rate: ${Math.round(this.stats.processed / (duration / 1000))} docs/sec`);
  }

  async close(): Promise<void> {
    await this.elasticsearchService.close();
  }
}

async function main() {
  const orchestrator = new IngestionOrchestrator();
  
  try {
    await orchestrator.initialize();
    
    if (options.sample) {
      await orchestrator.ingestSampleData();
    } else if (options.file) {
      await orchestrator.ingestSingleFile(options.file);
    } else if (options.directory) {
      await orchestrator.ingestFromDirectory(options.directory);
    } else {
      console.error('❌ Please specify --sample, --file, or --directory option');
      process.exit(1);
    }
    
    orchestrator.printStats();
    
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    await orchestrator.close();
  }
}

if (require.main === module) {
  main();
}
