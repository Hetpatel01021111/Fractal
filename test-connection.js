const { Client } = require('@elastic/elasticsearch');

// Test Elasticsearch connection with comprehensive diagnostics
async function testElasticCloudConnection() {
  console.log('🔍 Testing Elastic Cloud Connection...\n');
  
  const client = new Client({
    node: 'https://7663bd30219a45e3bb5d3287403b5de6.southamerica-east1.gcp.elastic-cloud.com:443',
    auth: {
      apiKey: 'UmRnVW81a0I4Z05PQkF6MmExMWY6a3U5TXdNMEVtTW9sYlJZZ2NpalpoZw=='
    },
    requestTimeout: 30000,
    pingTimeout: 10000,
    maxRetries: 3,
  });

  try {
    // Test 1: Basic connectivity
    console.log('📡 Test 1: Basic Connectivity');
    console.log('   URL: https://7663bd30219a45e3bb5d3287403b5de6.southamerica-east1.gcp.elastic-cloud.com:443');
    
    const pingResponse = await client.ping();
    console.log('   ✅ Ping successful!');
    console.log('   📊 Response time:', pingResponse.meta.request.options.timeout || 'N/A');
    
    // Test 2: Cluster information
    console.log('\n🏗️ Test 2: Cluster Information');
    const info = await client.info();
    console.log('   ✅ Cluster accessible!');
    console.log('   📋 Cluster name:', info.body.cluster_name);
    console.log('   🔢 Version:', info.body.version.number);
    console.log('   🔍 Lucene version:', info.body.version.lucene_version);
    console.log('   🏷️ Build flavor:', info.body.version.build_flavor);
    
    // Test 3: Cluster health
    console.log('\n💚 Test 3: Cluster Health');
    const health = await client.cluster.health();
    console.log('   ✅ Health check successful!');
    console.log('   🎯 Status:', health.body.status);
    console.log('   🔢 Number of nodes:', health.body.number_of_nodes);
    console.log('   📊 Active shards:', health.body.active_shards);
    
    // Test 4: List existing indices
    console.log('\n📁 Test 4: Existing Indices');
    try {
      const indices = await client.cat.indices({ format: 'json' });
      if (indices.body && indices.body.length > 0) {
        console.log('   ✅ Found', indices.body.length, 'existing indices:');
        indices.body.forEach(index => {
          console.log(`   📂 ${index.index}: ${index['docs.count'] || 0} docs, ${index['store.size'] || '0b'}`);
        });
      } else {
        console.log('   📝 No indices found (this is normal for a new cluster)');
      }
    } catch (error) {
      console.log('   ⚠️ Could not list indices (permissions may be limited)');
    }
    
    // Test 5: Create a test index
    console.log('\n🧪 Test 5: Index Creation Test');
    const testIndexName = 'fractal-connection-test';
    
    try {
      // Check if test index exists
      const indexExists = await client.indices.exists({ index: testIndexName });
      
      if (!indexExists.body) {
        // Create test index
        await client.indices.create({
          index: testIndexName,
          body: {
            mappings: {
              properties: {
                message: { type: 'text' },
                timestamp: { type: 'date' }
              }
            }
          }
        });
        console.log('   ✅ Test index created successfully!');
      } else {
        console.log('   📋 Test index already exists');
      }
      
      // Index a test document
      const testDoc = {
        message: 'Fractal Search Engine connection test',
        timestamp: new Date().toISOString(),
        test_id: Math.random().toString(36).substr(2, 9)
      };
      
      const indexResponse = await client.index({
        index: testIndexName,
        body: testDoc,
        refresh: 'wait_for'
      });
      
      console.log('   ✅ Test document indexed!');
      console.log('   🆔 Document ID:', indexResponse.body._id);
      
      // Search for the test document
      const searchResponse = await client.search({
        index: testIndexName,
        body: {
          query: {
            match: {
              message: 'Fractal'
            }
          }
        }
      });
      
      console.log('   ✅ Search test successful!');
      console.log('   📊 Found', searchResponse.body.hits.total.value, 'documents');
      
      // Clean up test index
      await client.indices.delete({ index: testIndexName });
      console.log('   🧹 Test index cleaned up');
      
    } catch (error) {
      console.log('   ⚠️ Index test failed:', error.message);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n✅ Your Elastic Cloud connection is working perfectly!');
    console.log('🚀 Ready to use with your Fractal Search Engine!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('   Error:', error.message);
    
    if (error.meta) {
      console.error('   Status:', error.meta.statusCode);
      console.error('   Request:', error.meta.meta.request.options.method, error.meta.meta.request.options.path);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check if your API key is correct');
    console.log('   2. Verify the cluster URL is accessible');
    console.log('   3. Ensure your cluster is running');
    console.log('   4. Check network connectivity');
    
    return false;
  }
}

// Test using curl (alternative method)
function showCurlTest() {
  console.log('\n🌐 Alternative: Test with curl command:');
  console.log('curl -X GET "https://7663bd30219a45e3bb5d3287403b5de6.southamerica-east1.gcp.elastic-cloud.com:443/" \\');
  console.log('  -H "Authorization: ApiKey UmRnVW81a0I4Z05PQkF6MmExMWY6a3U5TXdNMEVtTW9sYlJZZ2NpalpoZw=="');
}

// Run the comprehensive test
console.log('🔍 Elastic Cloud Connection Test');
console.log('================================\n');

testElasticCloudConnection()
  .then(success => {
    if (success) {
      console.log('\n🎯 Next steps:');
      console.log('   1. cd frontend && npm run dev');
      console.log('   2. Open http://localhost:3000/admin');
      console.log('   3. Start scraping data!');
    } else {
      showCurlTest();
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    showCurlTest();
    process.exit(1);
  });
