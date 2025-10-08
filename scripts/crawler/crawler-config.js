/**
 * Web Crawler Configuration
 * 
 * Predefined configurations for different types of websites
 * and crawling scenarios.
 */

const configs = {
  // News websites configuration
  news: {
    selectors: {
      title: 'h1, .headline, .article-title, .post-title',
      content: 'article, .article-content, .post-content, .entry-content',
      author: '.author, .byline, [rel="author"]',
      publishDate: '.publish-date, .date, time[datetime]',
      category: '.category, .section, .tag'
    },
    keywords: {
      extractFromHeadings: true,
      extractFromTags: true,
      minLength: 3,
      maxLength: 30
    },
    crawling: {
      respectRobots: true,
      delayMs: 2000,
      maxDepth: 2,
      followPagination: true
    }
  },

  // Blog configuration
  blog: {
    selectors: {
      title: 'h1, .post-title, .entry-title',
      content: '.post-content, .entry-content, .blog-content',
      author: '.author, .post-author, .by-author',
      publishDate: '.post-date, .published, time',
      tags: '.tags, .post-tags, .categories'
    },
    keywords: {
      extractFromTags: true,
      extractFromCategories: true,
      includeHashtags: true
    },
    crawling: {
      delayMs: 1500,
      maxDepth: 3,
      followArchives: true
    }
  },

  // E-commerce/Product pages
  ecommerce: {
    selectors: {
      title: 'h1, .product-title, .item-title',
      content: '.product-description, .item-description, .product-details',
      price: '.price, .cost, .amount',
      rating: '.rating, .stars, .review-score',
      availability: '.availability, .stock, .in-stock',
      brand: '.brand, .manufacturer',
      category: '.breadcrumb, .category, .department'
    },
    keywords: {
      extractFromBrand: true,
      extractFromCategory: true,
      extractFromSpecs: true
    },
    crawling: {
      delayMs: 3000, // Be more polite to e-commerce sites
      maxDepth: 2,
      followCategories: true
    }
  },

  // Documentation sites
  documentation: {
    selectors: {
      title: 'h1, .page-title, .doc-title',
      content: '.content, .documentation, .doc-content, main',
      navigation: '.nav, .sidebar, .toc',
      codeBlocks: 'pre, code, .highlight'
    },
    keywords: {
      extractFromCode: true,
      extractFromAPI: true,
      technicalTerms: true
    },
    crawling: {
      delayMs: 1000,
      maxDepth: 4,
      followNavigation: true
    }
  },

  // YouTube/Video metadata
  youtube: {
    selectors: {
      title: 'meta[property="og:title"], #watch-headline-title',
      description: 'meta[property="og:description"], #watch-description-text',
      duration: 'meta[property="video:duration"]',
      uploadDate: 'meta[property="video:release_date"]',
      channel: '#owner-name, .ytd-channel-name',
      views: '#count .view-count',
      likes: '#top-level-buttons .like-button'
    },
    keywords: {
      extractFromTags: true,
      extractFromTranscript: false, // Requires additional API
      extractFromComments: false
    },
    crawling: {
      delayMs: 2000,
      maxDepth: 1, // Don't crawl too deep on YouTube
      respectRateLimit: true
    }
  },

  // Academic/Research papers
  academic: {
    selectors: {
      title: 'h1, .article-title, .paper-title',
      abstract: '.abstract, .summary',
      authors: '.authors, .author-list',
      publishDate: '.publish-date, .publication-date',
      journal: '.journal, .publication',
      doi: '.doi, [data-doi]',
      citations: '.citations, .references'
    },
    keywords: {
      extractFromAbstract: true,
      extractFromKeywords: true,
      scientificTerms: true
    },
    crawling: {
      delayMs: 2500,
      maxDepth: 2,
      followReferences: false // Usually behind paywalls
    }
  }
};

// Site-specific configurations
const siteConfigs = {
  'reddit.com': {
    selectors: {
      title: '.title a, h1',
      content: '.usertext-body, .md',
      author: '.author',
      score: '.score',
      comments: '.comments'
    },
    crawling: {
      delayMs: 3000,
      maxDepth: 1,
      respectRateLimit: true
    }
  },

  'stackoverflow.com': {
    selectors: {
      title: 'h1[itemprop="name"]',
      content: '.post-text, .answer',
      tags: '.post-tag',
      votes: '.vote-count-post',
      accepted: '.accepted-answer'
    },
    crawling: {
      delayMs: 2000,
      maxDepth: 1,
      followQuestions: true
    }
  },

  'github.com': {
    selectors: {
      title: '.repository-content h1, .markdown-title',
      content: '.markdown-body, .readme',
      language: '.language-color',
      stars: '#repo-stars-counter-star',
      description: '.repository-content p'
    },
    crawling: {
      delayMs: 1500,
      maxDepth: 2,
      followReadme: true
    }
  },

  'medium.com': {
    selectors: {
      title: 'h1[data-testid="storyTitle"]',
      content: 'article section',
      author: '[data-testid="authorName"]',
      publishDate: '[data-testid="storyPublishDate"]',
      claps: '[data-testid="clapCount"]'
    },
    crawling: {
      delayMs: 2500,
      maxDepth: 1,
      respectPaywall: true
    }
  }
};

// Content type detection patterns
const contentTypePatterns = {
  news: [
    /news|article|story|report/i,
    /\/news\/|\/articles\/|\/story\//,
    /breaking|headline|latest/i
  ],
  
  blog: [
    /blog|post|entry/i,
    /\/blog\/|\/post\/|\/entry\//,
    /wordpress|blogger|medium/i
  ],
  
  product: [
    /product|item|shop|store/i,
    /\/product\/|\/item\/|\/p\//,
    /buy|price|cart|checkout/i
  ],
  
  documentation: [
    /docs|documentation|manual|guide/i,
    /\/docs\/|\/documentation\/|\/guide\//,
    /api|reference|tutorial/i
  ],
  
  video: [
    /youtube|vimeo|video/i,
    /watch\?v=|\/video\/|\.mp4/,
    /play|stream|media/i
  ],
  
  academic: [
    /paper|research|study|journal/i,
    /arxiv|pubmed|scholar|doi/i,
    /abstract|citation|reference/i
  ]
};

// Language detection patterns
const languagePatterns = {
  en: /english|en-us|en-gb/i,
  es: /spanish|español|es-es|es-mx/i,
  fr: /french|français|fr-fr|fr-ca/i,
  de: /german|deutsch|de-de/i,
  it: /italian|italiano|it-it/i,
  pt: /portuguese|português|pt-br|pt-pt/i,
  ru: /russian|русский|ru-ru/i,
  zh: /chinese|中文|zh-cn|zh-tw/i,
  ja: /japanese|日本語|ja-jp/i,
  ko: /korean|한국어|ko-kr/i
};

/**
 * Get configuration for a specific site or content type
 */
function getConfig(url, contentType = null) {
  const domain = new URL(url).hostname.replace('www.', '');
  
  // Check for site-specific config first
  if (siteConfigs[domain]) {
    return { ...configs.news, ...siteConfigs[domain] }; // Merge with base config
  }
  
  // Detect content type if not provided
  if (!contentType) {
    contentType = detectContentType(url);
  }
  
  return configs[contentType] || configs.news; // Default to news config
}

/**
 * Detect content type from URL and patterns
 */
function detectContentType(url) {
  const urlLower = url.toLowerCase();
  
  for (const [type, patterns] of Object.entries(contentTypePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(urlLower)) {
        return type;
      }
    }
  }
  
  return 'news'; // Default
}

/**
 * Detect language from URL or content
 */
function detectLanguage(url, htmlContent = '') {
  const urlLower = url.toLowerCase();
  const contentLower = htmlContent.toLowerCase();
  
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(urlLower) || pattern.test(contentLower)) {
      return lang;
    }
  }
  
  return 'en'; // Default to English
}

/**
 * Get robots.txt delay for specific site
 */
function getRobotDelay(domain) {
  const delays = {
    'reddit.com': 3000,
    'twitter.com': 5000,
    'facebook.com': 5000,
    'instagram.com': 4000,
    'linkedin.com': 3000,
    'pinterest.com': 2000,
    'amazon.com': 4000,
    'ebay.com': 3000,
    'wikipedia.org': 1000,
    'stackoverflow.com': 2000,
    'github.com': 1500
  };
  
  return delays[domain] || 1000;
}

/**
 * Check if URL should be skipped based on patterns
 */
function shouldSkipUrl(url) {
  const skipPatterns = [
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)$/i,
    /\.(jpg|jpeg|png|gif|bmp|svg|webp|ico)$/i,
    /\.(mp3|mp4|avi|mov|wmv|flv|webm)$/i,
    /\.(css|js|json|xml|rss)$/i,
    /\/wp-admin\/|\/admin\/|\/login\/|\/register\//i,
    /\/api\/|\/ajax\/|\/json\//i,
    /\?.*utm_|#.*|javascript:|mailto:|tel:/i,
    /\/search\?|\/filter\?|\/sort\?/i
  ];
  
  return skipPatterns.some(pattern => pattern.test(url));
}

module.exports = {
  configs,
  siteConfigs,
  contentTypePatterns,
  languagePatterns,
  getConfig,
  detectContentType,
  detectLanguage,
  getRobotDelay,
  shouldSkipUrl
};
