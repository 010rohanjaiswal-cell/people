class NetworkTestService {
  constructor() {
    this.apiUrls = [
      'http://192.168.1.49:3001', // New port
      'http://localhost:3001',
      'http://10.0.2.2:3001', // Android emulator localhost
      'http://127.0.0.1:3001',
      'http://192.168.1.49:10000', // Old port as fallback
      'http://localhost:10000'
    ];
  }

  async testAllConnections() {
    console.log('🌐 Testing network connectivity...');
    
    for (const url of this.apiUrls) {
      try {
        console.log(`🌐 Testing: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${url} - SUCCESS:`, data);
          return { success: true, workingUrl: url };
        } else {
          console.log(`❌ ${url} - HTTP Error: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${url} - Failed: ${error.message}`);
      }
    }
    
    console.log('❌ No working connections found');
    return { success: false, workingUrl: null };
  }

  async testSpecificUrl(url) {
    try {
      console.log(`🌐 Testing specific URL: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${url} - SUCCESS:`, data);
        return { success: true, data };
      } else {
        console.log(`❌ ${url} - HTTP Error: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.log(`❌ ${url} - Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

export default new NetworkTestService();
