import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Query parameter is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Direct search for: "${query}"`);

    // Direct Elasticsearch query using fetch
    const esQuery = {
      query: {
        multi_match: {
          query: query,
          fields: ['title^2', 'content', 'metadata.tags'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size: 20,
      sort: [
        { 'metadata.aiScore': { order: 'desc' } },
        { _score: { order: 'desc' } }
      ],
      highlight: {
        fields: {
          title: {},
          content: { fragment_size: 150, number_of_fragments: 3 }
        }
      }
    };

    console.log('📊 Elasticsearch query:', JSON.stringify(esQuery, null, 2));

    // Direct fetch to Elasticsearch
    const esResponse = await fetch('http://localhost:9200/fractal-documents/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(esQuery)
    });

    if (!esResponse.ok) {
      throw new Error(`Elasticsearch error: ${esResponse.status} ${esResponse.statusText}`);
    }

    const esData = await esResponse.json();
    console.log(`✅ Elasticsearch returned ${esData.hits.total.value} documents`);

    // Format results
    const documents = esData.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      title: hit._source.title,
      content: hit._source.content.substring(0, 500) + '...',
      url: hit._source.url,
      score: hit._score,
      metadata: hit._source.metadata,
      highlights: hit.highlight || {}
    }));

    // Search images
    const imageQuery = {
      query: {
        multi_match: {
          query: query,
          fields: ['title', 'alt', 'metadata.tags'],
          fuzziness: 'AUTO'
        }
      },
      size: 10,
      sort: [
        { 'metadata.aiScore': { order: 'desc' } }
      ]
    };

    const imageResponse = await fetch('http://localhost:9200/fractal-images/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageQuery)
    });

    let images = [];
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      images = imageData.hits.hits.map((hit: any) => ({
        id: hit._source.id,
        title: hit._source.title,
        url: hit._source.url,
        sourceUrl: hit._source.sourceUrl,
        alt: hit._source.alt,
        score: hit._score,
        metadata: hit._source.metadata
      }));
    }

    const responseTime = Date.now() - startTime;

    const response = {
      success: true,
      results: documents,
      images: images,
      total: esData.hits.total.value,
      took: responseTime,
      searchInfo: {
        query: query,
        bm25Results: documents.length,
        vectorResults: documents.length,
        combinedResults: documents.length,
        imageResults: images.length,
        enhancedQuery: query,
        searchType: 'direct_elasticsearch',
        searchSource: 'direct_fetch',
        elasticsearchConnected: true,
        aiScoring: {
          averageDocumentScore: documents.reduce((sum: number, r: any) => sum + (r.metadata?.aiScore || 0), 0) / documents.length || 0,
          averageImageScore: images.reduce((sum: number, r: any) => sum + (r.metadata?.aiScore || 0), 0) / images.length || 0,
          totalResults: documents.length + images.length
        }
      }
    };

    console.log(`🎉 Direct search completed: ${documents.length} documents, ${images.length} images`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Direct search error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
