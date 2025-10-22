import { NextRequest, NextResponse } from 'next/server';
import { googleBulkSearch } from '@/lib/google-bulk-search';

// Unified search endpoint with 100+ Google results, Elasticsearch storage, and advanced ranking
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'all'; // all, images, videos, web

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Query parameter "q" is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Bulk search for: "${query}" (fetching 100+ results from Google)`);

    // Perform bulk search with 100+ results from Google APIs
    const bulkSearchResults = await googleBulkSearch.performBulkSearch(query);
    
    // Filter results based on type requested
    let filteredResults: any = {
      success: true,
      query: query,
      type: type,
      images: [],
      videos: [],
      web: [],
      total: 0,
      took: 0,
      bulkSearchInfo: {
        totalFetched: bulkSearchResults.total,
        elasticsearchSaved: bulkSearchResults.elasticsearchSaved,
        searchSource: bulkSearchResults.searchSource,
        ranking: bulkSearchResults.ranking
      }
    };

    // Get top ranked results based on type
    if (type === 'all') {
      // Return top results from each category
      filteredResults.web = bulkSearchResults.ranking.topResults
        .filter(r => r.contentType === 'web')
        .slice(0, Math.ceil(limit / 3));
      
      filteredResults.images = bulkSearchResults.ranking.topResults
        .filter(r => r.contentType === 'image')
        .slice(0, Math.ceil(limit / 3));
      
      filteredResults.videos = bulkSearchResults.ranking.topResults
        .filter(r => r.contentType === 'video')
        .slice(0, Math.ceil(limit / 3));
    } else if (type === 'web') {
      filteredResults.web = bulkSearchResults.ranking.topResults
        .filter(r => r.contentType === 'web')
        .slice(0, limit);
    } else if (type === 'images') {
      filteredResults.images = bulkSearchResults.ranking.topResults
        .filter(r => r.contentType === 'image')
        .slice(0, limit);
    } else if (type === 'videos') {
      filteredResults.videos = bulkSearchResults.ranking.topResults
        .filter(r => r.contentType === 'video')
        .slice(0, limit);
    }

    console.log(`✅ Filtered results: ${filteredResults.web.length} web, ${filteredResults.images.length} images, ${filteredResults.videos.length} videos`);

    // Calculate totals
    filteredResults.total = filteredResults.images.length + filteredResults.videos.length + filteredResults.web.length;
    filteredResults.took = Date.now() - startTime;

    // Add comprehensive search info
    filteredResults.searchInfo = {
      query: query,
      type: type,
      limit: limit,
      totalImages: filteredResults.images.length,
      totalVideos: filteredResults.videos.length,
      totalWeb: filteredResults.web.length,
      totalResults: filteredResults.total,
      bulkSearch: {
        totalFetched: bulkSearchResults.total,
        elasticsearchSaved: bulkSearchResults.elasticsearchSaved,
        searchSource: bulkSearchResults.searchSource,
        averageRankingScore: bulkSearchResults.ranking.averageScore,
        totalProcessed: bulkSearchResults.ranking.totalProcessed
      },
      averageImageScore: filteredResults.images.length > 0 ? 
        filteredResults.images.reduce((sum: number, img: any) => sum + (img.ranking?.finalScore || 0), 0) / filteredResults.images.length : 0,
      averageVideoScore: filteredResults.videos.length > 0 ? 
        filteredResults.videos.reduce((sum: number, vid: any) => sum + (vid.ranking?.finalScore || 0), 0) / filteredResults.videos.length : 0,
      averageWebScore: filteredResults.web.length > 0 ? 
        filteredResults.web.reduce((sum: number, web: any) => sum + (web.ranking?.finalScore || 0), 0) / filteredResults.web.length : 0,
      responseTime: filteredResults.took
    };

    console.log(`🎉 Bulk search completed: ${bulkSearchResults.total} fetched → ${filteredResults.total} returned in ${filteredResults.took}ms`);

    return NextResponse.json(filteredResults);

  } catch (error) {
    console.error('❌ Unified search error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
