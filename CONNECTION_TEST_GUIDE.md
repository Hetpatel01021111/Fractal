# 🔍 How to Test Your Elastic Cloud Connection

## 🚨 **Current Status**

Based on the test results, your Elastic Cloud cluster appears to be **deleted or unavailable**:

```
Response: {"ok":false,"message":"Deleted resource."}
```

## 🔧 **How to Test Your Connection**

### **Method 1: Quick curl Test**
```bash
curl -X GET "https://7663bd30219a45e3bb5d3287403b5de6.southamerica-east1.gcp.elastic-cloud.com:443/" \
  -H "Authorization: ApiKey UmRnVW81a0I4Z05PQkF6MmExMWY6a3U5TXdNMEVtTW9sYlJZZ2NpalpoZw=="
```

**Expected Response (if working):**
```json
{
  "name" : "instance-0000000001",
  "cluster_name" : "7663bd30219a45e3bb5d3287403b5de6",
  "cluster_uuid" : "...",
  "version" : {
    "number" : "8.11.0"
  }
}
```

### **Method 2: Node.js Test Script**
```bash
node test-connection.js
```

### **Method 3: Browser Test**
Open this URL in your browser:
```
https://7663bd30219a45e3bb5d3287403b5de6.southamerica-east1.gcp.elastic-cloud.com:443/
```

### **Method 4: Test in Your App**
```bash
cd frontend
npm run dev
# Go to http://localhost:3000/admin
# Try scraping - check console for connection status
```

## 🏗️ **Setting Up a New Elastic Cloud Cluster**

Since your current cluster appears to be deleted, here's how to create a new one:

### **Option 1: Free Elastic Cloud Trial**

1. **Go to Elastic Cloud:**
   ```
   https://cloud.elastic.co/registration
   ```

2. **Create Free Trial:**
   - Sign up for 14-day free trial
   - Choose "Elasticsearch" deployment
   - Select region (closest to you)
   - Choose smallest size for testing

3. **Get Credentials:**
   - Copy the **Deployment URL**
   - Generate an **API Key**
   - Update your `.env.local` file

### **Option 2: Local Elasticsearch (Alternative)**

If you prefer local testing:

```bash
# Use our setup script
./setup-elasticsearch.sh

# Or manual Docker setup
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

## 🔄 **Update Your Configuration**

### **For New Elastic Cloud:**

**1. Update `frontend/.env.local`:**
```env
ELASTICSEARCH_URL=https://your-new-deployment.es.region.cloud.es.io:9243
ELASTICSEARCH_API_KEY=your_new_api_key_here
```

**2. Update `.env.production`:**
```env
ELASTICSEARCH_URL=https://your-new-deployment.es.region.cloud.es.io:9243
ELASTICSEARCH_API_KEY=your_new_api_key_here
```

### **For Local Elasticsearch:**

**1. Update `frontend/.env.local`:**
```env
ELASTICSEARCH_URL=http://localhost:9200
# Remove ELASTICSEARCH_API_KEY line
```

## 🧪 **Testing Steps**

### **1. Test Basic Connection:**
```bash
# For Elastic Cloud
curl -X GET "YOUR_ELASTICSEARCH_URL" \
  -H "Authorization: ApiKey YOUR_API_KEY"

# For Local
curl -X GET "http://localhost:9200"
```

### **2. Test from Your App:**
```bash
cd frontend
npm run dev
```

Go to `http://localhost:3000/admin` and check:
- Console logs for connection status
- Try scraping some data
- Check if data persists

### **3. Test Search Functionality:**
```bash
# Go to http://localhost:3000
# Search for any term
# Check console for Elasticsearch responses
```

## 📊 **Connection Status Indicators**

### **In Admin Panel:**
- ✅ **Green indicators** = Elasticsearch connected
- ⚠️ **Yellow indicators** = Using fallback data
- ❌ **Red indicators** = Connection failed

### **In Console Logs:**
```
✅ Elasticsearch connection established
✅ Indexed 5 documents in Elasticsearch
✅ Elasticsearch search completed: 10 results
```

### **In API Responses:**
```json
{
  "searchInfo": {
    "searchType": "elasticsearch_hybrid_search",
    "elasticsearchConnected": true,
    "searchSource": "elasticsearch"
  }
}
```

## 🚀 **Quick Setup Options**

### **Option A: New Elastic Cloud (Recommended)**
```bash
# 1. Create new cluster at https://cloud.elastic.co
# 2. Update environment files with new credentials
# 3. Test connection
node test-connection.js
# 4. Start your app
cd frontend && npm run dev
```

### **Option B: Local Development**
```bash
# 1. Setup local Elasticsearch
./setup-elasticsearch.sh
# 2. Start your app
cd frontend && npm run dev
```

### **Option C: Use Fallback Mode**
```bash
# 1. Remove Elasticsearch config from .env.local
# 2. App will use in-memory storage
cd frontend && npm run dev
```

## 🎯 **What Each Option Gives You**

| Option | Persistence | Scalability | Setup | Cost |
|--------|-------------|-------------|-------|------|
| **Elastic Cloud** | ✅ Permanent | ✅ Unlimited | Easy | Free trial |
| **Local Docker** | ✅ Local only | ⚠️ Limited | Medium | Free |
| **Fallback Mode** | ❌ Temporary | ❌ Limited | None | Free |

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Deleted resource" error**
   - Cluster was deleted or expired
   - Create new cluster

2. **Connection timeout**
   - Check internet connection
   - Verify URL and credentials

3. **API key invalid**
   - Generate new API key
   - Check for typos in credentials

4. **Version mismatch**
   - Update Elasticsearch client
   - Use compatible API calls

## 🎉 **Next Steps**

1. **Choose your setup option** (Cloud vs Local vs Fallback)
2. **Update configuration files** with correct credentials
3. **Test connection** using the methods above
4. **Start your app** and begin scraping data!

Your Fractal Search Engine will work with any of these options! 🚀
