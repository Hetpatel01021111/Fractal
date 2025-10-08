export interface SearchResult {
  id: string
  title: string
  content: string
  url?: string
  score: number
  highlights?: string[]
  metadata?: {
    author?: string
    date?: string
    category?: string
    tags?: string[]
  }
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  took: number
  summary?: string
  suggestions?: string[]
}

export interface SearchFilters {
  category?: string
  dateRange?: {
    from: string
    to: string
  }
  tags?: string[]
}
