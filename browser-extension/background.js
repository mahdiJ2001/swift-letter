// Swift Letter Browser Extension - Background Service Worker

// Configuration - Make sure these match popup.js
const CONFIG = {
    API_BASE_URL: 'https://swiftletter.vercel.app', // Update with your production URL
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here'
};

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORE_SESSION') {
        // Store session data
        chrome.storage.local.set({
            session: message.session,
            user: message.user
        }, () => {
            sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
    }

    if (message.type === 'GET_SESSION') {
        chrome.storage.local.get(['session', 'user'], (result) => {
            sendResponse(result);
        });
        return true;
    }

    if (message.type === 'CLEAR_SESSION') {
        chrome.storage.local.remove(['session', 'user'], () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === 'EXTRACT_JOB_DESCRIPTION') {
        // This is triggered from content script when user wants to auto-extract
        // Forward to popup if open
        chrome.runtime.sendMessage({
            type: 'JOB_DESCRIPTION_EXTRACTED',
            jobDescription: message.jobDescription,
            company: message.company,
            position: message.position
        });
        sendResponse({ success: true });
        return true;
    }
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Swift Letter extension installed');
    } else if (details.reason === 'update') {
        console.log('Swift Letter extension updated');
    }
});

// Listen for auth callback from web app
chrome.webNavigation?.onCompleted?.addListener(async (details) => {
    // Check if this is our auth callback page
    if (details.url.includes(`${CONFIG.API_BASE_URL}/auth/callback`) &&
        details.url.includes('extension=true')) {
        try {
            // Inject script to extract auth data
            chrome.scripting.executeScript({
                target: { tabId: details.tabId },
                function: extractAuthFromPage
            });
        } catch (error) {
            console.error('Failed to extract auth:', error);
        }
    }
}, { url: [{ urlContains: 'swiftletter' }] });

// Function injected into auth callback page to extract session
function extractAuthFromPage() {
    // Look for session data in localStorage
    const sessionKey = 'supabase.auth.token';
    const sessionData = localStorage.getItem(sessionKey);

    if (sessionData) {
        try {
            const parsed = JSON.parse(sessionData);
            // Send to extension
            chrome.runtime.sendMessage({
                type: 'AUTH_SUCCESS',
                session: parsed.currentSession,
                user: parsed.currentSession?.user
            });
        } catch (e) {
            console.error('Failed to parse session:', e);
        }
    }
}

// Context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus?.create({
        id: 'swift-letter-generate',
        title: 'Generate Cover Letter with Swift Letter',
        contexts: ['selection']
    });
});

chrome.contextMenus?.onClicked?.addListener((info, tab) => {
    if (info.menuItemId === 'swift-letter-generate' && info.selectionText) {
        // Store selected text and open popup
        chrome.storage.local.set({
            pendingJobDescription: info.selectionText
        });

        // Open extension popup
        chrome.action.openPopup();
    }
});
