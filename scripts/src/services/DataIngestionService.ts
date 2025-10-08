import fs from 'fs-extra';
import path from 'path';
import csv from 'csv-parser';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from './uuid';

export interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  metadata?: {
    author?: string;
    date?: string;
    category?: string;
    tags?: string[];
    fileType?: string;
    filePath?: string;
    fileSize?: number;
    pages?: number;
    description?: string;
    rows?: number;
    columns?: number;
  };
}

export class DataIngestionService {
  async processFile(filePath: string): Promise<Document | null> {
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, extension);
    const stats = await fs.stat(filePath);

    const baseDocument: Partial<Document> = {
      id: uuidv4(),
      title: fileName,
      metadata: {
        fileType: extension.substring(1),
        filePath: filePath,
        fileSize: stats.size,
        date: stats.mtime.toISOString(),
      },
    };

    try {
      switch (extension) {
        case '.txt':
          return await this.processTxtFile(filePath, baseDocument);
        case '.pdf':
          return await this.processPdfFile(filePath, baseDocument);
        case '.docx':
          return await this.processDocxFile(filePath, baseDocument);
        case '.html':
        case '.htm':
          return await this.processHtmlFile(filePath, baseDocument);
        case '.json':
          return await this.processJsonFile(filePath, baseDocument);
        case '.csv':
          return await this.processCsvFile(filePath, baseDocument);
        default:
          console.warn(`Unsupported file type: ${extension}`);
          return null;
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return null;
    }
  }

  private async processTxtFile(filePath: string, baseDocument: Partial<Document>): Promise<Document> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Try to extract title from first line if it looks like a title
    const lines = content.split('\n').filter(line => line.trim());
    let title = baseDocument.title || '';
    let actualContent = content;

    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // If first line is short and doesn't end with punctuation, treat as title
      if (firstLine.length < 100 && !firstLine.match(/[.!?]$/)) {
        title = firstLine;
        actualContent = lines.slice(1).join('\n').trim();
      }
    }

    return {
      id: baseDocument.id!,
      title: title || baseDocument.title!,
      content: actualContent,
      metadata: baseDocument.metadata,
    };
  }

  private async processPdfFile(filePath: string, baseDocument: Partial<Document>): Promise<Document> {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    return {
      id: baseDocument.id!,
      title: data.info?.Title || baseDocument.title!,
      content: data.text,
      metadata: {
        ...baseDocument.metadata,
        author: data.info?.Author,
        // Add PDF-specific metadata
        pages: data.numpages,
      },
    };
  }

  private async processDocxFile(filePath: string, baseDocument: Partial<Document>): Promise<Document> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return {
      id: baseDocument.id!,
      title: baseDocument.title!,
      content: result.value,
      metadata: baseDocument.metadata,
    };
  }

  private async processHtmlFile(filePath: string, baseDocument: Partial<Document>): Promise<Document> {
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text() || $('h1').first().text() || baseDocument.title!;

    // Remove script and style tags
    $('script, style').remove();

    // Extract main content (try to find main content areas)
    let content = '';
    const contentSelectors = ['main', 'article', '.content', '#content', '.post', '.entry'];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body content if no main content found
    if (!content) {
      content = $('body').text();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    // Extract metadata
    const author = $('meta[name="author"]').attr('content') || 
                  $('meta[property="article:author"]').attr('content');
    const description = $('meta[name="description"]').attr('content');
    const keywords = $('meta[name="keywords"]').attr('content');

    return {
      id: baseDocument.id!,
      title: title,
      content: content,
      metadata: {
        ...baseDocument.metadata,
        author: author,
        description: description,
        tags: keywords ? keywords.split(',').map(tag => tag.trim()) : undefined,
      },
    };
  }

  private async processJsonFile(filePath: string, baseDocument: Partial<Document>): Promise<Document> {
    const jsonContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Handle different JSON structures
    let title = baseDocument.title!;
    let content = '';
    let metadata = { ...baseDocument.metadata };

    if (Array.isArray(data)) {
      // Array of objects - combine them
      title = `${baseDocument.title} (${data.length} items)`;
      content = data.map((item, index) => {
        if (typeof item === 'object') {
          return `Item ${index + 1}: ${JSON.stringify(item, null, 2)}`;
        }
        return `Item ${index + 1}: ${item}`;
      }).join('\n\n');
    } else if (typeof data === 'object') {
      // Single object
      if (data.title) title = data.title;
      if (data.content) content = data.content;
      if (data.body) content = data.body;
      if (data.text) content = data.text;
      
      // If no content field found, stringify the entire object
      if (!content) {
        content = JSON.stringify(data, null, 2);
      }

      // Extract metadata from JSON
      if (data.author) metadata.author = data.author;
      if (data.date) metadata.date = data.date;
      if (data.category) metadata.category = data.category;
      if (data.tags) metadata.tags = Array.isArray(data.tags) ? data.tags : [data.tags];
    } else {
      // Primitive value
      content = String(data);
    }

    return {
      id: baseDocument.id!,
      title: title,
      content: content,
      metadata: metadata,
    };
  }

  private async processCsvFile(filePath: string, baseDocument: Partial<Document>): Promise<Document> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          try {
            const title = `${baseDocument.title} (${rows.length} rows)`;
            
            // Convert CSV data to readable text
            let content = '';
            if (rows.length > 0) {
              const headers = Object.keys(rows[0]);
              content = `Headers: ${headers.join(', ')}\n\n`;
              
              // Add sample rows (first 10)
              const sampleRows = rows.slice(0, 10);
              content += sampleRows.map((row, index) => {
                const rowText = headers.map(header => `${header}: ${row[header]}`).join(', ');
                return `Row ${index + 1}: ${rowText}`;
              }).join('\n');
              
              if (rows.length > 10) {
                content += `\n... and ${rows.length - 10} more rows`;
              }
            }

            resolve({
              id: baseDocument.id!,
              title: title,
              content: content,
              metadata: {
                ...baseDocument.metadata,
                rows: rows.length,
                columns: rows.length > 0 ? Object.keys(rows[0]).length : 0,
              },
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  // Utility method to clean and normalize text
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  // Utility method to extract tags from text
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtags = text.match(/#[\w]+/g);
    if (hashtags) {
      tags.push(...hashtags.map(tag => tag.substring(1).toLowerCase()));
    }

    // Extract common keywords (this is a simple implementation)
    const commonKeywords = [
      'artificial intelligence', 'machine learning', 'deep learning',
      'climate change', 'renewable energy', 'sustainability',
      'space exploration', 'quantum computing', 'blockchain',
      'cybersecurity', 'data science', 'cloud computing'
    ];

    const lowerText = text.toLowerCase();
    for (const keyword of commonKeywords) {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }
}
