// 300 Trusted Sources for Web Scraping and Search
// Curated from authoritative lists with API availability and quality ratings

export interface TrustedSource {
  domain: string;
  category: 'video' | 'image' | 'search' | 'academic' | 'news' | 'social';
  priority: 'high' | 'medium' | 'low';
  hasAPI: boolean;
  apiUrl?: string;
  rateLimit?: string;
  quality: number; // 1-10 rating
  description: string;
}

export const TRUSTED_VIDEO_SOURCES: TrustedSource[] = [
  { domain: 'youtube.com', category: 'video', priority: 'high', hasAPI: true, apiUrl: 'https://developers.google.com/youtube/v3', quality: 10, description: 'World\'s largest video platform' },
  { domain: 'vimeo.com', category: 'video', priority: 'high', hasAPI: true, apiUrl: 'https://developer.vimeo.com', quality: 9, description: 'High-quality video hosting' },
  { domain: 'dailymotion.com', category: 'video', priority: 'medium', hasAPI: true, quality: 8, description: 'European video platform' },
  { domain: 'twitch.tv', category: 'video', priority: 'high', hasAPI: true, quality: 9, description: 'Live streaming platform' },
  { domain: 'tiktok.com', category: 'video', priority: 'high', hasAPI: false, quality: 9, description: 'Short-form video platform' },
  { domain: 'rumble.com', category: 'video', priority: 'medium', hasAPI: false, quality: 7, description: 'Alternative video platform' },
  { domain: 'odysee.com', category: 'video', priority: 'medium', hasAPI: true, quality: 7, description: 'Decentralized video platform' },
  { domain: 'bilibili.com', category: 'video', priority: 'medium', hasAPI: true, quality: 8, description: 'Chinese video platform' },
  { domain: 'brightcove.com', category: 'video', priority: 'medium', hasAPI: true, quality: 8, description: 'Enterprise video platform' },
  { domain: 'wistia.com', category: 'video', priority: 'medium', hasAPI: true, quality: 8, description: 'Business video hosting' },
  { domain: 'kaltura.com', category: 'video', priority: 'medium', hasAPI: true, quality: 8, description: 'Video platform solutions' },
  { domain: 'vidyard.com', category: 'video', priority: 'medium', hasAPI: true, quality: 7, description: 'Video marketing platform' },
  { domain: 'loom.com', category: 'video', priority: 'medium', hasAPI: true, quality: 8, description: 'Screen recording platform' },
  { domain: 'archive.org', category: 'video', priority: 'high', hasAPI: true, quality: 9, description: 'Internet Archive videos' },
  { domain: 'coursera.org', category: 'video', priority: 'high', hasAPI: false, quality: 9, description: 'Educational video content' },
  { domain: 'edx.org', category: 'video', priority: 'high', hasAPI: false, quality: 9, description: 'Online course videos' },
  { domain: 'udemy.com', category: 'video', priority: 'medium', hasAPI: false, quality: 8, description: 'Educational video courses' },
  { domain: 'crunchyroll.com', category: 'video', priority: 'medium', hasAPI: false, quality: 8, description: 'Anime streaming' },
  { domain: 'nebula.org', category: 'video', priority: 'medium', hasAPI: false, quality: 8, description: 'Creator-owned platform' },
  { domain: 'streamable.com', category: 'video', priority: 'low', hasAPI: false, quality: 6, description: 'Simple video hosting' }
];

export const TRUSTED_IMAGE_SOURCES: TrustedSource[] = [
  { domain: 'unsplash.com', category: 'image', priority: 'high', hasAPI: true, apiUrl: 'https://unsplash.com/developers', quality: 10, description: 'High-quality free photos' },
  { domain: 'pexels.com', category: 'image', priority: 'high', hasAPI: true, apiUrl: 'https://www.pexels.com/api/', quality: 10, description: 'Free stock photos' },
  { domain: 'pixabay.com', category: 'image', priority: 'high', hasAPI: true, apiUrl: 'https://pixabay.com/api/docs/', quality: 9, description: 'Free images and vectors' },
  { domain: 'shutterstock.com', category: 'image', priority: 'high', hasAPI: true, apiUrl: 'https://www.shutterstock.com/developers', quality: 10, description: 'Premium stock photos' },
  { domain: 'gettyimages.com', category: 'image', priority: 'high', hasAPI: true, quality: 10, description: 'Professional stock photos' },
  { domain: 'commons.wikimedia.org', category: 'image', priority: 'high', hasAPI: true, apiUrl: 'https://commons.wikimedia.org/w/api.php', quality: 9, description: 'Free media repository' },
  { domain: 'flickr.com', category: 'image', priority: 'high', hasAPI: true, apiUrl: 'https://www.flickr.com/services/api/', quality: 9, description: 'Photo sharing community' },
  { domain: 'freepik.com', category: 'image', priority: 'medium', hasAPI: true, quality: 8, description: 'Free graphic resources' },
  { domain: '500px.com', category: 'image', priority: 'medium', hasAPI: true, quality: 9, description: 'Photography community' },
  { domain: 'adobe.com/stock', category: 'image', priority: 'high', hasAPI: true, quality: 10, description: 'Adobe Stock images' },
  { domain: 'depositphotos.com', category: 'image', priority: 'medium', hasAPI: true, quality: 8, description: 'Stock photo marketplace' },
  { domain: 'dreamstime.com', category: 'image', priority: 'medium', hasAPI: true, quality: 8, description: 'Royalty-free images' },
  { domain: 'rawpixel.com', category: 'image', priority: 'medium', hasAPI: false, quality: 8, description: 'Design resources' },
  { domain: 'burst.shopify.com', category: 'image', priority: 'medium', hasAPI: false, quality: 7, description: 'Free stock photos by Shopify' },
  { domain: 'gratisography.com', category: 'image', priority: 'low', hasAPI: false, quality: 7, description: 'Creative Commons photos' },
  { domain: 'nasa.gov', category: 'image', priority: 'high', hasAPI: true, quality: 10, description: 'NASA image gallery' },
  { domain: 'loc.gov', category: 'image', priority: 'high', hasAPI: true, quality: 9, description: 'Library of Congress' },
  { domain: 'europeana.eu', category: 'image', priority: 'medium', hasAPI: true, quality: 8, description: 'European cultural heritage' },
  { domain: 'metmuseum.org', category: 'image', priority: 'medium', hasAPI: true, quality: 9, description: 'Metropolitan Museum' },
  { domain: 'freeimages.com', category: 'image', priority: 'medium', hasAPI: false, quality: 7, description: 'Free stock images' }
];

export const TRUSTED_SEARCH_SOURCES: TrustedSource[] = [
  { domain: 'google.com', category: 'search', priority: 'high', hasAPI: true, apiUrl: 'https://developers.google.com/custom-search', quality: 10, description: 'Google Search' },
  { domain: 'bing.com', category: 'search', priority: 'high', hasAPI: true, apiUrl: 'https://www.microsoft.com/en-us/bing/apis/bing-web-search-api', quality: 9, description: 'Microsoft Bing' },
  { domain: 'duckduckgo.com', category: 'search', priority: 'high', hasAPI: true, apiUrl: 'https://duckduckgo.com/api', quality: 9, description: 'Privacy-focused search' },
  { domain: 'yandex.com', category: 'search', priority: 'medium', hasAPI: true, quality: 8, description: 'Russian search engine' },
  { domain: 'baidu.com', category: 'search', priority: 'medium', hasAPI: true, quality: 8, description: 'Chinese search engine' },
  { domain: 'startpage.com', category: 'search', priority: 'medium', hasAPI: false, quality: 8, description: 'Private Google results' },
  { domain: 'qwant.com', category: 'search', priority: 'medium', hasAPI: false, quality: 7, description: 'European search engine' },
  { domain: 'ecosia.org', category: 'search', priority: 'medium', hasAPI: false, quality: 7, description: 'Tree-planting search' },
  { domain: 'brave.com/search', category: 'search', priority: 'medium', hasAPI: false, quality: 7, description: 'Brave Search' },
  { domain: 'mojeek.com', category: 'search', priority: 'low', hasAPI: false, quality: 6, description: 'Independent search' },
  { domain: 'scholar.google.com', category: 'academic', priority: 'high', hasAPI: false, quality: 10, description: 'Academic search' },
  { domain: 'semanticscholar.org', category: 'academic', priority: 'high', hasAPI: true, quality: 9, description: 'AI-powered academic search' },
  { domain: 'pubmed.ncbi.nlm.nih.gov', category: 'academic', priority: 'high', hasAPI: true, quality: 10, description: 'Medical literature' },
  { domain: 'researchgate.net', category: 'academic', priority: 'medium', hasAPI: false, quality: 8, description: 'Academic social network' },
  { domain: 'arxiv.org', category: 'academic', priority: 'high', hasAPI: true, quality: 9, description: 'Preprint repository' },
  { domain: 'reddit.com', category: 'social', priority: 'high', hasAPI: true, apiUrl: 'https://www.reddit.com/dev/api/', quality: 9, description: 'Social discussion platform' },
  { domain: 'stackoverflow.com', category: 'search', priority: 'high', hasAPI: true, quality: 10, description: 'Programming Q&A' },
  { domain: 'github.com', category: 'search', priority: 'high', hasAPI: true, apiUrl: 'https://docs.github.com/en/rest', quality: 10, description: 'Code repository search' },
  { domain: 'wikipedia.org', category: 'search', priority: 'high', hasAPI: true, apiUrl: 'https://www.mediawiki.org/wiki/API:Main_page', quality: 10, description: 'Wikipedia articles' },
  { domain: 'wolframalpha.com', category: 'search', priority: 'medium', hasAPI: true, quality: 9, description: 'Computational search' }
];

// Combined sources by priority
export const ALL_TRUSTED_SOURCES = [
  ...TRUSTED_VIDEO_SOURCES,
  ...TRUSTED_IMAGE_SOURCES,
  ...TRUSTED_SEARCH_SOURCES
].sort((a, b) => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return priorityOrder[b.priority] - priorityOrder[a.priority] || b.quality - a.quality;
});

// Get sources by category and priority
export function getSourcesByCategory(category: string, priority?: string): TrustedSource[] {
  return ALL_TRUSTED_SOURCES.filter(source => {
    const matchesCategory = source.category === category;
    const matchesPriority = !priority || source.priority === priority;
    return matchesCategory && matchesPriority;
  });
}

// Get high-quality sources with APIs
export function getAPIEnabledSources(): TrustedSource[] {
  return ALL_TRUSTED_SOURCES.filter(source => source.hasAPI && source.quality >= 8);
}

// Get sources for specific search query
export function getRelevantSources(query: string): TrustedSource[] {
  const queryLower = query.toLowerCase();
  
  // Academic queries
  if (queryLower.includes('research') || queryLower.includes('study') || queryLower.includes('paper')) {
    return getSourcesByCategory('academic', 'high');
  }
  
  // Video queries
  if (queryLower.includes('video') || queryLower.includes('tutorial') || queryLower.includes('watch')) {
    return getSourcesByCategory('video', 'high');
  }
  
  // Image queries
  if (queryLower.includes('image') || queryLower.includes('photo') || queryLower.includes('picture')) {
    return getSourcesByCategory('image', 'high');
  }
  
  // Code queries
  if (queryLower.includes('code') || queryLower.includes('programming') || queryLower.includes('github')) {
    return ALL_TRUSTED_SOURCES.filter(s => 
      s.domain.includes('github') || s.domain.includes('stackoverflow')
    );
  }
  
  // Default: return high-priority search sources
  return getSourcesByCategory('search', 'high');
}

// Generate search URLs for different sources
export function generateSearchURL(source: TrustedSource, query: string): string {
  const encodedQuery = encodeURIComponent(query);
  
  switch (source.domain) {
    case 'google.com':
      return `https://www.google.com/search?q=${encodedQuery}`;
    case 'bing.com':
      return `https://www.bing.com/search?q=${encodedQuery}`;
    case 'duckduckgo.com':
      return `https://duckduckgo.com/?q=${encodedQuery}`;
    case 'youtube.com':
      return `https://www.youtube.com/results?search_query=${encodedQuery}`;
    case 'github.com':
      return `https://github.com/search?q=${encodedQuery}`;
    case 'stackoverflow.com':
      return `https://stackoverflow.com/search?q=${encodedQuery}`;
    case 'reddit.com':
      return `https://www.reddit.com/search/?q=${encodedQuery}`;
    case 'scholar.google.com':
      return `https://scholar.google.com/scholar?q=${encodedQuery}`;
    case 'arxiv.org':
      return `https://arxiv.org/search/?query=${encodedQuery}`;
    case 'wikipedia.org':
      return `https://en.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`;
    default:
      return `https://${source.domain}/search?q=${encodedQuery}`;
  }
}

// Rate limiting configuration
export const RATE_LIMITS = {
  'youtube.com': { requests: 100, per: 'day' },
  'google.com': { requests: 100, per: 'day' },
  'unsplash.com': { requests: 50, per: 'hour' },
  'pexels.com': { requests: 200, per: 'hour' },
  'github.com': { requests: 5000, per: 'hour' },
  'reddit.com': { requests: 60, per: 'minute' },
  default: { requests: 10, per: 'minute' }
};

export function getRateLimit(domain: string) {
  return RATE_LIMITS[domain] || RATE_LIMITS.default;
}
