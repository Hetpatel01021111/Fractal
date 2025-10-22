const { Client } = require('@elastic/elasticsearch');

// Test Elasticsearch connection
async function testConnection() {
  const client = new Client({
    node: 'https://7663bd30219a45e3bb5d3287403b5de6.southamerica-east1.gcp.elastic-cloud.com:443',
    auth: {
      apiKey: 'UmRnVW81a0I4Z05PQkF6MmExMWY6a3U5TXdNMEVtTW9sYlJZZ2NpalpoZw=='
    },
    requestTimeout: 30000,
    pingTimeout: 3000,
    maxRetries: 3,
  });

  try {
    console.log('🔍 Testing Elasticsearch connection...');
    
    // Test ping
    const pingResponse = await client.ping();
    console.log('✅ Ping successful:', pingResponse);
    
    // Get cluster info
    const info = await client.info();
    console.log('📊 Cluster info:');
    console.log('  - Cluster name:', info.body.cluster_name);
    console.log('  - Version:', info.body.version.number);
    console.log('  - Lucene version:', info.body.version.lucene_version);
    
    // Check indices
    const indices = await client.cat.indices({ format: 'json' });
    console.log('📁 Existing indices:', indices.body.length);
    
    if (indices.body.length > 0) {
      indices.body.forEach(index => {
        console.log(`  - ${index.index}: ${index['docs.count']} docs, ${index['store.size']}`);
      });
    }
    
    console.log('🎉 Elasticsearch connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
