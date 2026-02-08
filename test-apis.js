// Test script for waitlist and feedback APIs
// You can run this in your browser console or as a Node.js script

const BASE_URL = 'http://localhost:3000'; // Adjust for your domain

// Test Waitlist API
async function testWaitlist() {
    console.log('🧪 Testing Waitlist API...');

    try {
        // Test valid email
        const validResponse = await fetch(`${BASE_URL}/api/waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `test-${Date.now()}@example.com`,
                source: 'website'
            })
        });

        const validResult = await validResponse.json();
        console.log('✅ Valid email test:', validResult);

        // Test duplicate email
        const duplicateResponse = await fetch(`${BASE_URL}/api/waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                source: 'website'
            })
        });

        const duplicateResult = await duplicateResponse.json();
        console.log('✅ Duplicate email test:', duplicateResult);

        // Test invalid email
        const invalidResponse = await fetch(`${BASE_URL}/api/waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'invalid-email',
                source: 'website'
            })
        });

        const invalidResult = await invalidResponse.json();
        console.log('✅ Invalid email test:', invalidResult);

    } catch (error) {
        console.error('❌ Waitlist API Error:', error);
    }
}

// Test Feedback API
async function testFeedback() {
    console.log('🧪 Testing Feedback API...');

    try {
        // Test text-only feedback
        const textFormData = new FormData();
        textFormData.append('feedback', 'This is a test feedback message for the API.');
        textFormData.append('rating', '4');

        const textResponse = await fetch(`${BASE_URL}/api/feedback`, {
            method: 'POST',
            body: textFormData
        });

        const textResult = await textResponse.json();
        console.log('✅ Text feedback test:', textResult);

        // Test short feedback (should fail)
        const shortFormData = new FormData();
        shortFormData.append('feedback', 'Short');

        const shortResponse = await fetch(`${BASE_URL}/api/feedback`, {
            method: 'POST',
            body: shortFormData
        });

        const shortResult = await shortResponse.json();
        console.log('✅ Short feedback test (should fail):', shortResult);

        // Test feedback with invalid rating (should fail)
        const invalidRatingFormData = new FormData();
        invalidRatingFormData.append('feedback', 'Test feedback with bad rating');
        invalidRatingFormData.append('rating', '6'); // Invalid: > 5

        const invalidRatingResponse = await fetch(`${BASE_URL}/api/feedback`, {
            method: 'POST',
            body: invalidRatingFormData
        });

        const invalidRatingResult = await invalidRatingResponse.json();
        console.log('✅ Invalid rating test (should fail):', invalidRatingResult);

    } catch (error) {
        console.error('❌ Feedback API Error:', error);
    }
}

// Test with screenshot (if running in browser)
async function testFeedbackWithScreenshot() {
    console.log('🧪 Testing Feedback API with Screenshot...');

    if (typeof document === 'undefined') {
        console.log('⚠️ Screenshot test requires browser environment');
        return;
    }

    try {
        // Create a test canvas for image
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);

        // Convert to blob
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('feedback', 'This is a test feedback with an image attachment.');
            formData.append('rating', '5');
            formData.append('screenshot', blob, 'test-screenshot.png');

            const response = await fetch(`${BASE_URL}/api/feedback`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('✅ Screenshot feedback test:', result);
        }, 'image/png');

    } catch (error) {
        console.error('❌ Screenshot feedback error:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting API Tests...\n');

    await testWaitlist();
    console.log('\n');

    await testFeedback();
    console.log('\n');

    await testFeedbackWithScreenshot();

    console.log('\n✨ All tests completed!');
}

// Export for Node.js or run immediately in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testWaitlist, testFeedback, testFeedbackWithScreenshot, runAllTests };
} else {
    // Auto-run in browser after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
        runAllTests();
    }
}