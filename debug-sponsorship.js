// Debug script to test sponsorship creation flow
console.log('=== SPONSORSHIP CREATION DEBUG SCRIPT ===');

// Test 1: Check localStorage demo user
const demoUser = localStorage.getItem('sponsorconnect_user');
console.log('1. Demo user check:', demoUser ? 'FOUND' : 'NOT FOUND');
if (demoUser) {
    console.log('   Demo user data:', JSON.parse(demoUser));
}

// Test 2: Check existing sponsorship requests
const existingRequests = JSON.parse(localStorage.getItem('sponsorconnect_requests') || '[]');
console.log('2. Existing requests count:', existingRequests.length);
if (existingRequests.length > 0) {
    console.log('   Sample request:', existingRequests[0]);
}

// Test 3: Create a test sponsorship request to see if it works
const testSponsorshipData = {
    id: `debug_test_${Date.now()}`,
    title: 'Debug Test Sponsorship',
    description: 'This is a test sponsorship created by the debug script',
    category: 'equipment',
    amount: 500,
    urgency: 'medium',
    deadline: '',
    benefits: 'Test benefits',
    location: 'Test Location',
    clubId: 'debug_club',
    clubName: 'Debug Club',
    status: 'active',
    createdAt: { seconds: Date.now() / 1000 },
    updatedAt: { seconds: Date.now() / 1000 },
    viewCount: 0,
    interestedBusinesses: []
};

console.log('3. Creating test sponsorship...');
existingRequests.push(testSponsorshipData);
localStorage.setItem('sponsorconnect_requests', JSON.stringify(existingRequests));
console.log('   ✓ Test sponsorship created successfully');
console.log('   New total requests:', existingRequests.length);

// Test 4: Verify the data was saved
const updatedRequests = JSON.parse(localStorage.getItem('sponsorconnect_requests') || '[]');
console.log('4. Verification - requests after creation:', updatedRequests.length);

console.log('=== DEBUG SCRIPT COMPLETE ===');