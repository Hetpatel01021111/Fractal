// Re-export the Gemini service from the backend for scripts
// This allows scripts to use the same service implementation

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize embedding model
      this.embeddingModel = this.genAI.getGenerativeModel({ 
        model: 'embedding-001' 
      });
      
      console.log('✅ Gemini AI embedding model initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if too long (Gemini has input limits)
      const truncatedText = text.length > 2000 ? text.substring(0, 2000) : text;
      
      const result = await this.embeddingModel.embedContent(truncatedText);
      return result.embedding.values;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<{ embedding: number[]; text: string }[]> {
    const results = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (text) => {
        try {
          const embedding = await this.generateEmbedding(text);
          return { embedding, text };
        } catch (error) {
          console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
          // Return null embedding on failure
          return { embedding: new Array(768).fill(0), text };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}
