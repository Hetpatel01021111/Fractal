import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;
  private textModel: any;

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
      
      // Initialize text generation model
      this.textModel = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro' 
      });
      
      console.log('✅ Gemini AI models initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const results = await Promise.all(
        texts.map(async (text) => {
          const embedding = await this.generateEmbedding(text);
          return { embedding, text };
        })
      );
      return results;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }

  async summarizeSearchResults(query: string, results: any[]): Promise<SummaryResult> {
    try {
      const context = results
        .slice(0, 5) // Use top 5 results
        .map((result, index) => `${index + 1}. ${result.title}\n${result.content}`)
        .join('\n\n');

      const prompt = `
Based on the search query "${query}" and the following search results, provide a comprehensive summary and key insights:

${context}

Please provide:
1. A concise summary (2-3 sentences) that directly answers the query
2. 3-5 key points that highlight the most important information

Format your response as JSON with the following structure:
{
  "summary": "Your summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}
`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Try to parse as JSON
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || 'No summary available',
          keyPoints: parsed.keyPoints || [],
        };
      } catch (parseError) {
        // If JSON parsing fails, extract manually
        const lines = text.split('\n').filter((line: string) => line.trim());
        const summary = lines.find((line: string) => line.includes('summary')) || 'No summary available';
        const keyPoints = lines.filter((line: string) => line.match(/^\d+\./)).slice(0, 5);
        
        return {
          summary: summary.replace(/.*summary[":]*\s*/i, '').replace(/[",]/g, ''),
          keyPoints: keyPoints.map((point: string) => point.replace(/^\d+\.\s*/, '').replace(/[",]/g, '')),
        };
      }
    } catch (error) {
      console.error('Failed to summarize search results:', error);
      return {
        summary: 'Unable to generate summary at this time.',
        keyPoints: [],
      };
    }
  }

  async generateSearchSuggestions(query: string): Promise<string[]> {
    try {
      const prompt = `
Given the search query "${query}", suggest 5 related search queries that might be helpful to the user. 
The suggestions should be:
1. More specific variations of the original query
2. Related topics that might interest the user
3. Different angles or perspectives on the same topic

Provide only the search suggestions, one per line, without numbering or additional text.
`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const suggestions = text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0 && !line.match(/^\d+\./))
        .slice(0, 5);

      return suggestions;
    } catch (error) {
      console.error('Failed to generate search suggestions:', error);
      return [];
    }
  }

  async enhanceQuery(query: string): Promise<string> {
    try {
      const prompt = `
Enhance the following search query to make it more effective for semantic search while preserving the user's intent:
"${query}"

Rules:
1. Expand abbreviations and acronyms
2. Add relevant synonyms and related terms
3. Maintain the original meaning
4. Keep it concise (max 2x original length)
5. Return only the enhanced query, no explanation

Enhanced query:`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const enhancedQuery = response.text().trim();

      // Fallback to original query if enhancement fails or is too long
      if (enhancedQuery.length > query.length * 3 || enhancedQuery.length < 3) {
        return query;
      }

      return enhancedQuery;
    } catch (error) {
      console.error('Failed to enhance query:', error);
      return query;
    }
  }

  async generateWebsiteDescription(title: string, url: string, existingContent?: string): Promise<string> {
    try {
      const prompt = `
Generate a short, descriptive summary (1-2 sentences, max 120 characters) for this website:

Title: "${title}"
URL: "${url}"
${existingContent ? `Content: "${existingContent.substring(0, 200)}..."` : ''}

The description should:
1. Be concise and informative
2. Explain what the website/page is about
3. Use clear, professional language
4. Be under 120 characters
5. Not include the website name (it's already in the title)

Return only the description, no additional text or formatting.
`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const description = response.text().trim();

      // Clean up the description
      const cleanDescription = description
        .replace(/['"]/g, '') // Remove quotes
        .replace(/^Description:\s*/i, '') // Remove "Description:" prefix
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .trim();

      // Ensure it's not too long
      if (cleanDescription.length > 120) {
        return cleanDescription.substring(0, 117) + '...';
      }

      return cleanDescription || 'Informative website with valuable content and resources.';
    } catch (error) {
      console.error('Failed to generate website description:', error);
      // Return a generic fallback description
      return 'Discover valuable information and resources on this website.';
    }
  }

  async analyzeSearchIntent(query: string): Promise<{
    intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const prompt = `
Analyze the search intent of this query: "${query}"

Classify it as one of:
- informational: seeking knowledge/information
- navigational: looking for a specific website/page
- transactional: wanting to perform an action/purchase
- commercial: researching before a potential purchase

Provide confidence level (0-1) and 2-3 suggestions to improve the search.

Format as JSON:
{
  "intent": "category",
  "confidence": 0.8,
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return {
          intent: parsed.intent || 'informational',
          confidence: parsed.confidence || 0.5,
          suggestions: parsed.suggestions || [],
        };
      } catch (parseError) {
        return {
          intent: 'informational',
          confidence: 0.5,
          suggestions: [],
        };
      }
    } catch (error) {
      console.error('Failed to analyze search intent:', error);
      return {
        intent: 'informational',
        confidence: 0.5,
        suggestions: [],
      };
    }
  }
}
