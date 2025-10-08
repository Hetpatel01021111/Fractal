/**
 * Optimized Elasticsearch Index Configuration
 * Designed for high-performance search with relevance tuning
 */

export const optimizedIndexSettings = {
  settings: {
    // Performance optimizations
    number_of_shards: 1, // Single shard for small to medium datasets
    number_of_replicas: 0, // No replicas for development, increase for production
    refresh_interval: '5s', // Balance between real-time and performance
    
    // Memory and caching optimizations
    'index.queries.cache.enabled': true,
    'index.requests.cache.enable': true,
    'index.max_result_window': 50000, // Allow deep pagination if needed
    
    // Indexing performance
    'index.translog.flush_threshold_size': '1gb',
    'index.translog.sync_interval': '30s',
    'index.merge.policy.max_merged_segment': '5gb',
    
    analysis: {
      // Custom analyzers for better text processing
      analyzer: {
        // Enhanced analyzer for general text
        enhanced_text: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'stop_words_filter',
            'stemmer_filter',
            'synonym_filter',
            'word_delimiter_graph'
          ]
        },
        
        // Analyzer for exact matching
        exact_match: {
          type: 'custom',
          tokenizer: 'keyword',
          filter: ['lowercase', 'trim']
        },
        
        // Analyzer for autocomplete/search-as-you-type
        autocomplete: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'autocomplete_filter'
          ]
        },
        
        // Analyzer for technical content
        technical: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'technical_stop_words',
            'stemmer_filter',
            'technical_synonyms'
          ]
        }
      },
      
      // Custom filters
      filter: {
        // Enhanced stop words (including common but low-value terms)
        stop_words_filter: {
          type: 'stop',
          stopwords: [
            '_english_',
            'http', 'https', 'www', 'com', 'org', 'net',
            'said', 'says', 'according', 'also', 'however',
            'therefore', 'thus', 'furthermore', 'moreover'
          ]
        },
        
        // Stemmer for better word matching
        stemmer_filter: {
          type: 'stemmer',
          language: 'english'
        },
        
        // Synonym filter for domain-specific terms
        synonym_filter: {
          type: 'synonym',
          synonyms: [
            'ai,artificial intelligence,machine intelligence',
            'ml,machine learning',
            'dl,deep learning',
            'nlp,natural language processing',
            'cv,computer vision',
            'nn,neural network,neural networks',
            'cnn,convolutional neural network',
            'rnn,recurrent neural network',
            'lstm,long short-term memory',
            'gpt,generative pre-trained transformer',
            'llm,large language model',
            'api,application programming interface',
            'ui,user interface',
            'ux,user experience',
            'db,database',
            'js,javascript',
            'ts,typescript',
            'py,python',
            'ml,markup language',
            'css,cascading style sheets',
            'html,hypertext markup language',
            'sql,structured query language',
            'nosql,not only sql',
            'rest,representational state transfer',
            'graphql,graph query language',
            'json,javascript object notation',
            'xml,extensible markup language',
            'yaml,yet another markup language',
            'csv,comma separated values'
          ]
        },
        
        // Word delimiter for handling technical terms
        word_delimiter_graph: {
          type: 'word_delimiter_graph',
          generate_word_parts: true,
          generate_number_parts: true,
          catenate_words: true,
          catenate_numbers: true,
          catenate_all: false,
          split_on_case_change: true,
          preserve_original: true
        },
        
        // Autocomplete edge n-grams
        autocomplete_filter: {
          type: 'edge_ngram',
          min_gram: 2,
          max_gram: 20
        },
        
        // Technical stop words (less aggressive for technical content)
        technical_stop_words: {
          type: 'stop',
          stopwords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
        },
        
        // Technical synonyms
        technical_synonyms: {
          type: 'synonym',
          synonyms: [
            'algorithm,algo',
            'function,method,procedure',
            'variable,var',
            'parameter,param,argument,arg',
            'return,returns',
            'class,object',
            'interface,contract',
            'implementation,impl',
            'configuration,config',
            'environment,env',
            'development,dev',
            'production,prod',
            'testing,test',
            'debugging,debug',
            'optimization,optimize',
            'performance,perf',
            'memory,mem,ram',
            'processor,cpu',
            'graphics,gpu',
            'storage,disk,ssd,hdd'
          ]
        }
      }
    }
  },
  
  mappings: {
    // Dynamic mapping for flexibility with strict control
    dynamic: 'strict',
    
    properties: {
      // Document ID
      id: {
        type: 'keyword',
        index: true
      },
      
      // Title field with multiple analyzers for different search types
      title: {
        type: 'text',
        analyzer: 'enhanced_text',
        fields: {
          exact: {
            type: 'text',
            analyzer: 'exact_match'
          },
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete',
            search_analyzer: 'enhanced_text'
          },
          raw: {
            type: 'keyword'
          }
        },
        boost: 2.0 // Title is more important for relevance
      },
      
      // Content field with optimized analysis
      content: {
        type: 'text',
        analyzer: 'enhanced_text',
        fields: {
          technical: {
            type: 'text',
            analyzer: 'technical'
          },
          exact: {
            type: 'text',
            analyzer: 'exact_match'
          }
        },
        boost: 1.0
      },
      
      // URL for exact matching and filtering
      url: {
        type: 'keyword',
        index: true
      },
      
      // Vector embeddings for semantic search
      embedding: {
        type: 'dense_vector',
        dims: 768, // Adjust based on your embedding model
        index: true,
        similarity: 'cosine' // Use cosine similarity for embeddings
      },
      
      // Timestamp for sorting and filtering
      timestamp: {
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      },
      
      // Metadata with nested structure for complex filtering
      metadata: {
        type: 'object',
        properties: {
          author: {
            type: 'text',
            analyzer: 'enhanced_text',
            fields: {
              keyword: {
                type: 'keyword'
              }
            }
          },
          
          date: {
            type: 'date',
            format: 'strict_date_optional_time||yyyy-MM-dd||epoch_millis'
          },
          
          category: {
            type: 'keyword',
            index: true
          },
          
          tags: {
            type: 'keyword',
            index: true
          },
          
          source: {
            type: 'keyword',
            index: true
          },
          
          language: {
            type: 'keyword',
            index: true
          },
          
          // Content quality metrics
          quality_score: {
            type: 'float',
            index: true
          },
          
          // Engagement metrics
          views: {
            type: 'long',
            index: true
          },
          
          likes: {
            type: 'long',
            index: true
          },
          
          shares: {
            type: 'long',
            index: true
          },
          
          // Content length for relevance scoring
          content_length: {
            type: 'integer',
            index: true
          },
          
          // Reading time estimate
          reading_time: {
            type: 'integer',
            index: true
          }
        }
      },
      
      // Search-specific fields for analytics and optimization
      search_metadata: {
        type: 'object',
        enabled: false, // Don't index, just store
        properties: {
          indexed_at: {
            type: 'date'
          },
          last_updated: {
            type: 'date'
          },
          index_version: {
            type: 'keyword'
          },
          processing_time: {
            type: 'float'
          }
        }
      }
    }
  }
};

// Production-optimized settings
export const productionIndexSettings = {
  ...optimizedIndexSettings,
  settings: {
    ...optimizedIndexSettings.settings,
    number_of_replicas: 1, // Add replica for production
    refresh_interval: '30s', // Less frequent refresh for better performance
    
    // Additional production optimizations
    'index.codec': 'best_compression', // Better compression for storage
    'index.merge.policy.max_merge_at_once': 5,
    'index.merge.policy.segments_per_tier': 5,
    'index.translog.durability': 'async', // Async for better performance
    
    // Allocation settings for production cluster
    'index.routing.allocation.total_shards_per_node': 2,
    'index.unassigned.node_left.delayed_timeout': '5m'
  }
};

// Development-optimized settings (faster indexing, less optimization)
export const developmentIndexSettings = {
  ...optimizedIndexSettings,
  settings: {
    ...optimizedIndexSettings.settings,
    number_of_replicas: 0, // No replicas for development
    refresh_interval: '1s', // More frequent refresh for development
    
    // Development optimizations
    'index.translog.flush_threshold_size': '512mb',
    'index.merge.policy.max_merged_segment': '2gb'
  }
};

// Index template for automatic application to new indices
export const indexTemplate = {
  name: 'ai-search-template',
  index_patterns: ['ai-search-*'],
  template: {
    ...optimizedIndexSettings,
    settings: {
      ...optimizedIndexSettings.settings,
      // Template-specific settings
      'index.lifecycle.name': 'ai-search-policy',
      'index.lifecycle.rollover_alias': 'ai-search'
    }
  },
  priority: 100,
  version: 1,
  _meta: {
    description: 'Template for AI search engine indices',
    created_by: 'ai-search-engine',
    version: '1.0.0'
  }
};

// Index lifecycle policy for managing index size and performance
export const indexLifecyclePolicy = {
  policy: {
    phases: {
      hot: {
        actions: {
          rollover: {
            max_size: '10gb',
            max_age: '30d',
            max_docs: 1000000
          },
          set_priority: {
            priority: 100
          }
        }
      },
      warm: {
        min_age: '7d',
        actions: {
          set_priority: {
            priority: 50
          },
          allocate: {
            number_of_replicas: 0
          },
          forcemerge: {
            max_num_segments: 1
          }
        }
      },
      cold: {
        min_age: '30d',
        actions: {
          set_priority: {
            priority: 0
          },
          allocate: {
            number_of_replicas: 0
          }
        }
      },
      delete: {
        min_age: '365d'
      }
    }
  }
};

// Search templates for common query patterns
export const searchTemplates = {
  // Hybrid search template
  hybrid_search: {
    script: {
      lang: 'mustache',
      source: {
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    {
                      multi_match: {
                        query: '{{query}}',
                        fields: [
                          'title^2',
                          'content',
                          'title.exact^3',
                          'content.exact^1.5'
                        ],
                        type: 'best_fields',
                        fuzziness: 'AUTO',
                        prefix_length: 2
                      }
                    },
                    {
                      knn: {
                        field: 'embedding',
                        query_vector: '{{embedding}}',
                        k: '{{k|10}}',
                        num_candidates: '{{num_candidates|100}}'
                      }
                    }
                  ]
                }
              }
            ],
            filter: '{{#filters}}{{.}}{{/filters}}'
          }
        },
        highlight: {
          fields: {
            title: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
              number_of_fragments: 1
            },
            content: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
              fragment_size: 150,
              number_of_fragments: 3
            }
          }
        },
        size: '{{size|10}}',
        from: '{{from|0}}',
        sort: [
          '_score',
          {
            'metadata.date': {
              order: 'desc',
              missing: '_last'
            }
          }
        ]
      }
    }
  },
  
  // Autocomplete search template
  autocomplete_search: {
    script: {
      lang: 'mustache',
      source: {
        query: {
          bool: {
            should: [
              {
                match: {
                  'title.autocomplete': {
                    query: '{{query}}',
                    boost: 3
                  }
                }
              },
              {
                match: {
                  'content.autocomplete': {
                    query: '{{query}}',
                    boost: 1
                  }
                }
              }
            ]
          }
        },
        size: '{{size|5}}',
        _source: ['title', 'url', 'metadata.category']
      }
    }
  }
};
