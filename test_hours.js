// Test script to verify if hours field is being saved
const http = require('http');

const testData = {
  name: 'Test',
  last_name: 'Employee',
  middle_name: 'Middle',
  national_id: '12345678',
  social_code: '987654',
  email: 'test@example.com',
  position_id: 1,
  hire_date: '2024-01-01',
  required_hours_biweekly: 80,
  status: 'active'
};

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/employee/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();
