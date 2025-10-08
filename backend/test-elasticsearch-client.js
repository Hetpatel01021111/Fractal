// Simple test script to demonstrate the new ElasticsearchClient functionality
const { ElasticsearchClient } = require('./dist/elasticsearchClient');

async function testElasticsearchClient() {
  console.log('🧪 Testing ElasticsearchClient functionality...\n');
  
  const client = new ElasticsearchClient('test-index');
  
  try {
    // Initialize
    await client.initialize();
    console.log('✅ Client initialized\n');
    
    // Test indexing a document
    const testDoc = {
      id: 'test-doc-1',
      title: 'Test Document for ElasticsearchClient',
      content: 'This is a test document to demonstrate the new ElasticsearchClient functionality with BM25 search, vector search, and CRUD operations.',
      metadata: {
        author: 'Test Author',
        category: 'Testing',
        tags: ['test', 'elasticsearch', 'demo'],
        date: '2024-10-02'
      }
    };
    
    console.log('📝 Indexing test document...');
    await client.indexDocument(testDoc);
    console.log('✅ Document indexed\n');
    
    // Test BM25 search
    console.log('🔍 Testing BM25 search...');
    const searchResults = await client.searchDocuments('elasticsearch functionality', {
      size: 5,
      highlight: true
    });
    console.log(`✅ Found ${searchResults.results.length} results`);
    console.log(`   Title: ${searchResults.results[0]?.title}`);
    console.log(`   Score: ${searchResults.results[0]?.score}`);
    console.log(`   Highlights: ${searchResults.results[0]?.highlights?.length || 0}\n`);
    
    // Test getting document by ID
    console.log('📄 Testing get document by ID...');
    const retrievedDoc = await client.getDocument('test-doc-1');
    console.log(`✅ Retrieved document: ${retrievedDoc?.title}\n`);
    
    // Test updating document
    console.log('✏️  Testing document update...');
    await client.updateDocument('test-doc-1', {
      content: 'This is an UPDATED test document with new content for testing purposes.'
    });
    console.log('✅ Document updated\n');
    
    // Test search with filters
    console.log('🔍 Testing filtered search...');
    const filteredResults = await client.searchDocuments('test', {
      filters: {
        category: 'Testing',
        tags: ['test']
      },
      size: 5
    });
    console.log(`✅ Filtered search found ${filteredResults.results.length} results\n`);
    
    // Test index stats
    console.log('📊 Testing index statistics...');
    const stats = await client.getIndexStats();
    console.log(`✅ Index stats retrieved`);
    console.log(`   Documents: ${stats.indices?.['test-index']?.total?.docs?.count || 'N/A'}`);
    console.log(`   Size: ${stats.indices?.['test-index']?.total?.store?.size_in_bytes || 'N/A'} bytes\n`);
    
    // Clean up - delete test document
    console.log('🗑️  Cleaning up test document...');
    await client.deleteDocument('test-doc-1');
    console.log('✅ Test document deleted\n');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Client connection closed');
  }
}

// Run the test
testElasticsearchClient();
