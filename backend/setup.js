#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 Firebase Authentication Backend Setup\n');
console.log('This script will help you configure your Firebase credentials.\n');

async function setup() {
  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Setup cancelled. Please manually edit your .env file.');
        rl.close();
        return;
      }
    }

    console.log('\n📋 Please provide your Firebase service account credentials:\n');
    
    const projectId = await question('Firebase Project ID: ');
    const privateKeyId = await question('Private Key ID: ');
    const privateKey = await question('Private Key (full key including BEGIN/END): ');
    const clientEmail = await question('Client Email: ');
    const clientId = await question('Client ID: ');
    
    console.log('\n🔐 Please provide a JWT secret (or press Enter for auto-generation):');
    let jwtSecret = await question('JWT Secret: ');
    
    if (!jwtSecret) {
      jwtSecret = require('crypto').randomBytes(64).toString('hex');
      console.log(`✅ Auto-generated JWT secret: ${jwtSecret}`);
    }

    // Create .env content
    const envContent = `# Firebase Configuration
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_PRIVATE_KEY_ID=${privateKeyId}
FIREBASE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
FIREBASE_CLIENT_EMAIL=${clientEmail}
FIREBASE_CLIENT_ID=${clientId}
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/${clientEmail.replace('@', '%40')}

# JWT Secret
JWT_SECRET=${jwtSecret}

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');

    // Create .env.example backup
    const examplePath = path.join(__dirname, '.env.example');
    if (!fs.existsSync(examplePath)) {
      fs.writeFileSync(examplePath, envContent);
      console.log('✅ .env.example file created as backup');
    }

    console.log('\n🎯 Next steps:');
    console.log('1. Verify your Firebase project has Authentication and Firestore enabled');
    console.log('2. Ensure Phone Authentication is enabled in Firebase Console');
    console.log('3. Run: npm run dev');
    console.log('4. Test with: node test/test-auth.js');
    
    console.log('\n📱 Test phone numbers you can use:');
    console.log('   +16505550000, +16505550001, +16505550002, +16505550003, +16505550004');
    
    console.log('\n🔗 API endpoints:');
    console.log('   Health check: http://localhost:3000/health');
    console.log('   Auth routes: http://localhost:3000/api/auth');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();
