// Test Authentication Flow
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');

    // Test 1: Register a new user
    console.log('1️⃣ Testing Registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'Student'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.success);
    console.log('User ID:', registerResponse.data.data.user.id);
    console.log('Access Token:', registerResponse.data.data.accessToken.substring(0, 20) + '...\n');

    // Test 2: Login with the registered user
    console.log('2️⃣ Testing Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const loginResponse = await axios.post(`${BASE_URL}/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data.success);
    console.log('User ID:', loginResponse.data.data.user.id);
    console.log('Access Token:', loginResponse.data.data.accessToken.substring(0, 20) + '...\n');

    // Test 3: Get user profile
    console.log('3️⃣ Testing Get Profile...');
    const accessToken = loginResponse.data.data.accessToken;
    const profileResponse = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get Profile successful:', profileResponse.data.success);
    console.log('User Name:', profileResponse.data.data.user.name);
    console.log('User Email:', profileResponse.data.data.user.email);
    console.log('User Role:', profileResponse.data.data.user.role);
    console.log('Last Login:', profileResponse.data.data.user.lastLogin);
    console.log('Created At:', profileResponse.data.data.user.createdAt);
    console.log('\n');

    // Test 4: Test invalid login
    console.log('4️⃣ Testing Invalid Login...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      });
    } catch (error) {
      console.log('✅ Invalid login correctly rejected:', error.response.data.error);
      console.log('\n');
    }

    // Test 5: Test duplicate registration
    console.log('5️⃣ Testing Duplicate Registration...');
    try {
      await axios.post(`${BASE_URL}/register`, registerData);
    } catch (error) {
      console.log('✅ Duplicate registration correctly rejected:', error.response.data.error);
      console.log('\n');
    }

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Error details:', error.response?.data);
  }
}

// Run the test
testAuth();
