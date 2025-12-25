// Swift Letter Browser Extension - Background Service Worker

// Configuration - Dynamically get from website
let CONFIG = {
    API_BASE_URL: 'http://localhost:3001', // Fallback for development
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
    WEBSITE_URL: 'https://swiftletter.online' // Production website URL
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
    
    if (message.type === 'SWIFT_LETTER_AUTH_SUCCESS') {
        // Store the session data when we get it from auth callback
        chrome.storage.local.set({
            session: message.session,
            user: message.user
        }, () => {
            // Notify popup if it's open
            chrome.runtime.sendMessage({
                type: 'AUTH_UPDATE',
                session: message.session,
                user: message.user
            }).catch(() => {
                // Popup might not be open, that's okay
            });
            
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
        }).catch(() => {
            // Popup might not be open, store for later
            chrome.storage.local.set({
                pendingJobDescription: message.jobDescription,
                pendingCompany: message.company,
                pendingPosition: message.position
            });
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
    if (details.url.includes(`${CONFIG.API_BASE_URL}/auth/callback/extension`)) {
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

// Also listen for messages from auth callback page
chrome.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
    if (message.type === 'SWIFT_LETTER_AUTH_SUCCESS') {
        // Forward to popup
        chrome.runtime.sendMessage({
            type: 'AUTH_SUCCESS',
            session: message.session,
            user: message.user
        });
        sendResponse({ success: true });
    }
});

// Function injected into auth callback page to extract session
function extractAuthFromPage() {
    // Try multiple possible session storage keys
    const possibleKeys = [
        'sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token',
        'supabase.auth.token',
        'sb-auth-token'
    ];

    let sessionData = null;
    for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
            sessionData = data;
            break;
        }
    }

    // Also try to get from the URL params (common in auth callbacks)
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (sessionData) {
        try {
            const parsed = JSON.parse(sessionData);
            chrome.runtime.sendMessage({
                type: 'AUTH_SUCCESS',
                session: parsed,
                user: parsed.user
            });
        } catch (e) {
            console.error('Failed to parse session:', e);
        }
    } else if (accessToken) {
        // Create session from URL params
        chrome.runtime.sendMessage({
            type: 'AUTH_SUCCESS',
            session: {
                access_token: accessToken,
                refresh_token: refreshToken
            },
            user: null // Will be fetched later
        });
    } else {
        // Try to trigger Supabase auth state change
        setTimeout(() => {
            window.postMessage({ type: 'EXTENSION_AUTH_REQUEST' }, '*');
        }, 1000);
    }

    // Listen for messages from the auth callback page
    window.addEventListener('message', function (event) {
        if (event.data.type === 'SWIFT_LETTER_AUTH_SUCCESS') {
            chrome.runtime.sendMessage({
                type: 'AUTH_SUCCESS',
                session: event.data.session,
                user: event.data.user
            });
        }
    });
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
