import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private textModel: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.textModel = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro' 
      });
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null && this.textModel !== null;
  }

  async generateWebsiteDescription(title: string, url: string, existingContent?: string): Promise<string> {
    if (!this.isConfigured()) {
      return this.getFallbackDescription(title, url);
    }

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

      const result = await this.textModel!.generateContent(prompt);
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

      return cleanDescription || this.getFallbackDescription(title, url);
    } catch (error) {
      console.error('Failed to generate website description:', error);
      return this.getFallbackDescription(title, url);
    }
  }

  private getFallbackDescription(title: string, url: string): string {
    // Extract domain name for context
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    
    // Generate fallback based on title and domain
    if (title.toLowerCase().includes('machine learning') || title.toLowerCase().includes('ai')) {
      return 'Explore AI and machine learning concepts, techniques, and applications.';
    } else if (title.toLowerCase().includes('tutorial') || title.toLowerCase().includes('guide')) {
      return 'Comprehensive tutorial and guide with step-by-step instructions.';
    } else if (title.toLowerCase().includes('research') || title.toLowerCase().includes('study')) {
      return 'Research findings and academic insights on the latest developments.';
    } else if (domain.includes('wikipedia')) {
      return 'Comprehensive encyclopedia article with detailed information.';
    } else if (domain.includes('github')) {
      return 'Open source project with code, documentation, and resources.';
    } else if (domain.includes('stackoverflow')) {
      return 'Programming questions and answers from the developer community.';
    } else {
      return 'Discover valuable information and resources on this topic.';
    }
  }

  async generateBatchDescriptions(items: Array<{title: string, url: string, content?: string}>): Promise<string[]> {
    if (!this.isConfigured()) {
      return items.map(item => this.getFallbackDescription(item.title, item.url));
    }

    // Process in batches to avoid rate limits
    const batchSize = 3;
    const results: string[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => 
        this.generateWebsiteDescription(item.title, item.url, item.content)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Batch description generation failed:', error);
        // Add fallback descriptions for failed batch
        results.push(...batch.map(item => this.getFallbackDescription(item.title, item.url)));
      }
    }

    return results;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
