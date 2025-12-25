// Swift Letter Browser Extension - Main Popup Script

// Configuration - Dynamically get from website
let CONFIG = {
    API_BASE_URL: 'http://localhost:3000', // Updated to match current server
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
    WEBSITE_URL: 'https://swiftletter.online' // Production website URL
};

// Function to detect environment and set config
async function detectConfig() {
    try {
        // First try localhost for development
        let configResponse;
        try {
            configResponse = await fetch('http://localhost:3000/api/config', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
        } catch {
            // If localhost fails, try production
            configResponse = await fetch(`${CONFIG.WEBSITE_URL}/api/config`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
        }

        if (configResponse && configResponse.ok) {
            const config = await configResponse.json();
            CONFIG.API_BASE_URL = config.baseUrl || (configResponse.url.includes('localhost') ? 'http://localhost:3000' : CONFIG.WEBSITE_URL);
            CONFIG.SUPABASE_URL = config.supabaseUrl;
            CONFIG.SUPABASE_ANON_KEY = config.supabaseAnonKey;
            console.log('Config loaded:', CONFIG);
        } else {
            // Fallback to localhost for development
            CONFIG.API_BASE_URL = 'http://localhost:3000';
            console.log('Using fallback config');
        }
    } catch (error) {
        console.log('Using fallback config for development:', error);
        CONFIG.API_BASE_URL = 'http://localhost:3000';
    }
}

// State
let state = {
    user: null,
    session: null,
    profile: null,
    hasResume: false,
    credits: 0,
    isLoading: false,
    generatedLetter: '',
    generatedLatex: '',
    pdfUrl: '',
    editableContent: {
        recipient: '',
        company: '',
        position: '',
        subject: '',
        body: ''
    }
};

// DOM Elements
const elements = {};

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Listen for auth updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_UPDATE') {
        // Auth was successful, update state
        state.session = message.session;
        state.user = message.user;

        loadUserProfile().then(() => {
            showMainContent();
            showSuccess('Successfully signed in!');
        });
    }
});

async function init() {
    console.log('Extension initializing...');
    try {
        cacheElements();
        attachEventListeners();

        // Initialize visual feedback for token input
        if (elements.authTokenInput) {
            validateTokenInput();

            // Add CSS classes dynamically if they don't exist
            const style = document.createElement('style');
            style.textContent = `
                .token-warning { background-color: #fbbf24 !important; color: #92400e !important; }
                .token-error { background-color: #ef4444 !important; color: #white !important; }
                .token-good { background-color: #10b981 !important; color: white !important; }
                .token-warning:hover, .token-error:hover, .token-good:hover { opacity: 0.9; }
            `;
            document.head.appendChild(style);
        }

        await checkAuthStatus();
        await loadPendingJobDescription();
        console.log('Extension initialization complete');
    } catch (error) {
        console.error('Extension initialization failed:', error);
        showError('Extension failed to initialize. Please reload.');
    }
}

// Check for job description extracted from content script
async function loadPendingJobDescription() {
    try {
        const stored = await chrome.storage.local.get([
            'pendingJobDescription',
            'pendingCompany',
            'pendingPosition'
        ]);

        if (stored.pendingJobDescription) {
            elements.jobDescription.value = stored.pendingJobDescription;
            handleJobDescriptionInput();

            // Clear the pending data
            await chrome.storage.local.remove([
                'pendingJobDescription',
                'pendingCompany',
                'pendingPosition'
            ]);

            showSuccess('Job description loaded from page!');
        }
    } catch (error) {
        console.error('Failed to load pending job description:', error);
    }
}

function cacheElements() {
    elements.authSection = document.getElementById('authSection');
    elements.mainContent = document.getElementById('mainContent');
    elements.loginBtn = document.getElementById('loginBtn');
    elements.refreshAuthBtn = document.getElementById('refreshAuthBtn');
    elements.signupLink = document.getElementById('signupLink');
    elements.authTokenInput = document.getElementById('authTokenInput');
    elements.pasteTokenBtn = document.getElementById('pasteTokenBtn');

    // Add real-time token validation
    if (elements.authTokenInput) {
        elements.authTokenInput.addEventListener('input', validateTokenInput);
        elements.authTokenInput.addEventListener('paste', (e) => {
            // Delay validation to allow paste to complete
            setTimeout(validateTokenInput, 100);
        });
    }

    // Check if critical elements exist
    if (!elements.loginBtn) {
        console.error('Login button not found!');
    }
    if (!elements.refreshAuthBtn) {
        console.error('Refresh auth button not found!');
    }
    if (!elements.pasteTokenBtn) {
        console.error('Paste token button not found!');
    }

    elements.creditsBadge = document.getElementById('creditsBadge');
    elements.resumeStatusCard = document.getElementById('resumeStatusCard');
    elements.resumeStatusIcon = document.getElementById('resumeStatusIcon');
    elements.resumeStatusText = document.getElementById('resumeStatusText');
    elements.uploadResumeBtn = document.getElementById('uploadResumeBtn');
    elements.resumeInput = document.getElementById('resumeInput');
    elements.jobDescription = document.getElementById('jobDescription');
    elements.charCount = document.getElementById('charCount');
    elements.pasteBtn = document.getElementById('pasteBtn');
    elements.generateBtn = document.getElementById('generateBtn');
    elements.generateBtnText = document.getElementById('generateBtnText');
    elements.loadingState = document.getElementById('loadingState');
    elements.loadingText = document.getElementById('loadingText');
    elements.progressFill = document.getElementById('progressFill');
    elements.pdfPreviewModal = document.getElementById('pdfPreviewModal');
    elements.pdfFrame = document.getElementById('pdfFrame');
    elements.editLetterBtn = document.getElementById('editLetterBtn');
    elements.downloadPdfBtn = document.getElementById('downloadPdfBtn');
    elements.closePreviewBtn = document.getElementById('closePreviewBtn');
    elements.editModal = document.getElementById('editModal');
    elements.editRecipient = document.getElementById('editRecipient');
    elements.editCompany = document.getElementById('editCompany');
    elements.editPosition = document.getElementById('editPosition');
    elements.editSubject = document.getElementById('editSubject');
    elements.editContent = document.getElementById('editContent');
    elements.cancelEditBtn = document.getElementById('cancelEditBtn');
    elements.recompileBtn = document.getElementById('recompileBtn');
    elements.closeEditBtn = document.getElementById('closeEditBtn');
    elements.errorToast = document.getElementById('errorToast');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.successToast = document.getElementById('successToast');
    elements.successMessage = document.getElementById('successMessage');
}

function attachEventListeners() {
    // Auth
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', openLoginPage);
        console.log('Login button listener attached');
    } else {
        console.error('Cannot attach login button listener - element not found');
    }

    if (elements.refreshAuthBtn) {
        elements.refreshAuthBtn.addEventListener('click', handleRefreshAuth);
        console.log('Refresh auth button listener attached');
    } else {
        console.error('Cannot attach refresh auth button listener - element not found');
    }

    if (elements.signupLink) {
        elements.signupLink.addEventListener('click', openSignupPage);
    }

    if (elements.pasteTokenBtn) {
        elements.pasteTokenBtn.addEventListener('click', handlePasteToken);
        console.log('Paste token button listener attached');
    } else {
        console.error('Cannot attach paste token button listener - element not found');
    }

    // Resume
    elements.uploadResumeBtn.addEventListener('click', () => elements.resumeInput.click());
    elements.resumeInput.addEventListener('change', handleResumeUpload);

    // Job Description
    elements.jobDescription.addEventListener('input', handleJobDescriptionInput);
    elements.pasteBtn.addEventListener('click', handlePaste);

    // Generate
    elements.generateBtn.addEventListener('click', handleGenerate);

    // PDF Preview Modal
    elements.editLetterBtn.addEventListener('click', openEditModal);
    elements.downloadPdfBtn.addEventListener('click', downloadPdf);
    elements.closePreviewBtn.addEventListener('click', closePreviewModal);

    // Edit Modal
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.closeEditBtn.addEventListener('click', closeEditModal);
    elements.recompileBtn.addEventListener('click', handleRecompile);

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', () => {
            closePreviewModal();
            closeEditModal();
        });
    });
}

// Auth Functions
async function checkAuthStatus() {
    try {
        console.log('Checking auth status...');
        // First load configuration
        await detectConfig();

        // Check for automatic auth from website first
        const hasWebAuth = await checkWebsiteAuth();

        if (hasWebAuth) {
            console.log('Found website auth, loading profile...');
            await loadUserProfile();
            showMainContent();
            return;
        }

        // Try to get session from storage
        const stored = await chrome.storage.local.get(['session', 'user']);

        if (stored.session && stored.user) {
            console.log('Found stored session, verifying...');
            state.session = stored.session;
            state.user = stored.user;

            // Verify session is still valid
            const isValid = await verifySession();
            if (isValid) {
                console.log('Session valid, loading profile...');
                await loadUserProfile();
                showMainContent();
                return;
            } else {
                console.log('Session invalid, clearing storage...');
                await chrome.storage.local.remove(['session', 'user']);
            }
        }

        // No valid session, show auth
        console.log('No valid session found, showing auth section');
        showAuthSection();
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthSection();
    }
}

// Check if user is already authenticated on the website
async function checkWebsiteAuth() {
    try {
        // Try to get session from main website
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (activeTab && activeTab.url &&
            (activeTab.url.includes('swiftletter.online') || activeTab.url.includes('localhost:3000'))) {

            // Inject script to check for existing session
            const results = await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: extractSessionFromWebsite
            });

            if (results && results[0] && results[0].result) {
                const sessionData = results[0].result;
                if (sessionData.session && sessionData.user) {
                    // Store the session
                    state.session = sessionData.session;
                    state.user = sessionData.user;

                    await chrome.storage.local.set({
                        session: state.session,
                        user: state.user
                    });

                    console.log('Automatically detected authentication from website');
                    return true;
                }
            }
        }
    } catch (error) {
        console.log('Could not auto-detect auth from website:', error);
    }
    return false;
}

// Function to inject into website to extract session
function extractSessionFromWebsite() {
    try {
        // Try to get from localStorage (Supabase auth helpers store it here)
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.includes('supabase') && key.includes('auth')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.access_token && parsed.user) {
                        return {
                            session: {
                                access_token: parsed.access_token,
                                refresh_token: parsed.refresh_token
                            },
                            user: parsed.user
                        };
                    }
                }
            }
        }

        // Also try sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        for (const key of sessionKeys) {
            if (key.includes('supabase') && key.includes('auth')) {
                const data = sessionStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.access_token && parsed.user) {
                        return {
                            session: {
                                access_token: parsed.access_token,
                                refresh_token: parsed.refresh_token
                            },
                            user: parsed.user
                        };
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error extracting session:', error);
    }
    return null;
}

async function verifySession() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/profile?userId=${state.user.id}`, {
            headers: {
                'Authorization': `Bearer ${state.session.access_token}`
            }
        });
        return response.ok || response.status === 404; // 404 means no profile yet, but auth is valid
    } catch {
        return false;
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/profile?userId=${state.user.id}`, {
            headers: {
                'Authorization': `Bearer ${state.session.access_token}`
            }
        });

        if (response.ok) {
            state.profile = await response.json();
            state.hasResume = !!(state.profile && state.profile.full_name && state.profile.experiences && state.profile.skills);
            state.credits = state.profile?.credits || 0;
        } else if (response.status === 404) {
            state.hasResume = false;
            state.credits = 0;
        }

        updateUI();
    } catch (error) {
        console.error('Failed to load profile:', error);
        state.hasResume = false;
        updateUI();
    }
}

function showAuthSection() {
    elements.authSection.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
    elements.creditsBadge.textContent = 'Not signed in';
}

function showMainContent() {
    elements.authSection.classList.add('hidden');
    elements.mainContent.classList.remove('hidden');
    updateUI();
}

function updateUI() {
    // Update credits badge
    if (state.profile?.user_type === 'admin') {
        elements.creditsBadge.textContent = '∞ Credits';
    } else {
        elements.creditsBadge.textContent = `${state.credits} Credits`;
    }

    // Update resume status
    if (state.hasResume) {
        elements.resumeStatusCard.classList.add('has-resume');
        elements.resumeStatusCard.classList.remove('no-resume');
        elements.resumeStatusIcon.querySelector('.icon-check').classList.remove('hidden');
        elements.resumeStatusIcon.querySelector('.icon-warning').classList.add('hidden');
        elements.resumeStatusText.textContent = 'Resume attached';
        elements.uploadResumeBtn.textContent = 'Update Resume';
    } else {
        elements.resumeStatusCard.classList.remove('has-resume');
        elements.resumeStatusCard.classList.add('no-resume');
        elements.resumeStatusIcon.querySelector('.icon-check').classList.add('hidden');
        elements.resumeStatusIcon.querySelector('.icon-warning').classList.remove('hidden');
        elements.resumeStatusText.textContent = 'No resume attached';
        elements.uploadResumeBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      Upload Resume
    `;
    }

    // Update generate button state
    updateGenerateButton();
}

function updateGenerateButton() {
    const hasJobDescription = elements.jobDescription.value.trim().length > 50;
    const canGenerate = state.hasResume && hasJobDescription && !state.isLoading;

    elements.generateBtn.disabled = !canGenerate;

    if (!state.hasResume) {
        elements.generateBtnText.textContent = 'Upload Resume First';
    } else if (!hasJobDescription) {
        elements.generateBtnText.textContent = 'Enter Job Description';
    } else {
        elements.generateBtnText.textContent = 'Generate Cover Letter';
    }
}

async function openLoginPage(e) {
    e.preventDefault();
    console.log('Login button clicked');

    // First try to detect existing auth from any open Swift Letter tabs
    const swiftLetterTabs = await chrome.tabs.query({
        url: ['*://swiftletter.online/*', '*://www.swiftletter.online/*', '*://localhost:3000/*']
    });

    console.log('Found Swift Letter tabs:', swiftLetterTabs.length);

    if (swiftLetterTabs.length > 0) {
        // Check if user is already signed in on any of these tabs
        for (const tab of swiftLetterTabs) {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: extractSessionFromWebsite
                });

                if (results && results[0] && results[0].result) {
                    const sessionData = results[0].result;
                    if (sessionData.session && sessionData.user) {
                        // Store the session and update UI
                        state.session = sessionData.session;
                        state.user = sessionData.user;

                        await chrome.storage.local.set({
                            session: state.session,
                            user: state.user
                        });

                        await loadUserProfile();
                        showMainContent();
                        showSuccess('Successfully signed in!');
                        return;
                    }
                }
            } catch (error) {
                console.log('Could not check tab for auth:', error);
            }
        }
    }

    // If no existing session found, open login page
    const loginUrl = `${CONFIG.API_BASE_URL}/auth/login?extension=true&redirect_to=${encodeURIComponent(CONFIG.API_BASE_URL + '/auth/callback/extension?extension=true')}`;
    console.log('Opening login URL:', loginUrl);

    chrome.tabs.create({
        url: loginUrl
    });
}

function openSignupPage(e) {
    e.preventDefault();
    chrome.tabs.create({ url: `${CONFIG.API_BASE_URL}/auth/signup?extension=true&redirect_to=${CONFIG.API_BASE_URL}/auth/callback/extension?extension=true` });
}

async function handleRefreshAuth() {
    console.log('Refresh auth button clicked');
    elements.refreshAuthBtn.disabled = true;
    elements.refreshAuthBtn.innerHTML = `
        <svg class="btn-icon animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Checking...
    `;

    try {
        const authFound = await checkWebsiteAuth();
        console.log('Auth check result:', authFound);
        if (authFound) {
            await loadUserProfile();
            showMainContent();
            showSuccess('Authentication detected! You are now signed in.');
        } else {
            showError('No active session found. Please sign in first.');
        }
    } catch (error) {
        console.error('Refresh auth error:', error);
        showError('Could not check authentication status.');
    } finally {
        elements.refreshAuthBtn.disabled = false;
        elements.refreshAuthBtn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Check if Already Signed In
        `;
    }
}

// Real-time token validation feedback
function validateTokenInput() {
    if (!elements.authTokenInput || !elements.pasteTokenBtn) return;

    const token = elements.authTokenInput.value.trim();
    const btn = elements.pasteTokenBtn;

    // Reset button state
    btn.classList.remove('token-warning', 'token-error', 'token-good');
    btn.disabled = false;

    if (!token) {
        btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>Paste Auth Token';
        return;
    }

    // Check for common issues
    const hasNonASCII = /[^\x20-\x7E]/.test(token);
    const hasErrorText = /token decode error|syntaxerror|unexpected token|error:|failed/i.test(token);
    const looksLikeJSON = token.startsWith('{') && token.endsWith('}');
    const hasAccessToken = token.includes('access_token');
    const hasUser = token.includes('user');
    const isVeryShort = token.length < 50;

    if (hasErrorText) {
        btn.classList.add('token-error');
        btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Error Message (Not Token)';
        btn.disabled = true;
    } else if (isVeryShort) {
        btn.classList.add('token-error');
        btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5"/></svg>Token Too Short';
        btn.disabled = true;
    } else if (!looksLikeJSON || !hasAccessToken || !hasUser) {
        btn.classList.add('token-warning');
        if (!looksLikeJSON) {
            btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 21-6-6m-5-5-6-6"/><path d="m3 21 18-18"/></svg>Missing { } Brackets';
        } else if (!hasAccessToken) {
            btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5"/></svg>Missing Access Token';
        } else if (!hasUser) {
            btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5"/></svg>Missing User Data';
        }
    } else if (hasNonASCII) {
        btn.classList.add('token-warning');
        btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/><path d="M12 15.75h.007v.008H12v-.008z"/></svg>Try Process (Has Issues)';
    } else {
        btn.classList.add('token-good');
        btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>Process Token';
    }
}

// Handle pasting auth token from the callback page
async function handlePasteToken() {
    console.log('Paste token button clicked');
    try {
        // Try to read from clipboard first
        let token = elements.authTokenInput.value.trim();

        if (!token) {
            // Try to get from clipboard
            try {
                token = await navigator.clipboard.readText();
                elements.authTokenInput.value = token;
                console.log('Token read from clipboard, length:', token.length);
            } catch {
                showError('Please paste your auth token in the input field');
                return;
            }
        }

        if (!token) {
            showError('Please paste your auth token');
            return;
        }

        console.log('Processing token, first 50 chars:', token.substring(0, 50));

        // ULTRA-AGGRESSIVE token cleaning and validation
        if (!token || token.length < 5) {
            throw new Error('Token appears to be empty or too short');
        }

        console.log('Original token length:', token.length);
        console.log('Token contains corrupted chars:', /[^\x20-\x7E]/.test(token));

        // Step 1: Detect if this is an error message instead of a token
        const errorIndicators = [
            'Token decode error',
            'SyntaxError',
            'Unexpected token',
            'Token deco',
            'Error:',
            'undefined',
            'null',
            '[object',
            'Failed to',
            'Invalid'
        ];

        const hasErrorIndicator = errorIndicators.some(indicator =>
            token.toLowerCase().includes(indicator.toLowerCase())
        );

        if (hasErrorIndicator) {
            throw new Error('The input appears to be an error message, not a token. Please copy a fresh token from the callback page.');
        }

        // Step 2: EXTREME character cleaning - remove ALL non-standard characters
        const originalToken = token;

        // First pass: clean invisible and control characters
        token = token
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
            .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // Zero-width and non-breaking spaces
            .replace(/[\u2000-\u206F]/g, ' ') // Various Unicode spaces to regular space
            .replace(/[\uFFF0-\uFFFF]/g, '') // Specials block
            .trim();

        // Second pass: remove corrupted binary-like patterns
        token = token
            .replace(/[^\x20-\x7E]+/g, '') // Keep only printable ASCII
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        console.log('After cleaning - Length:', token.length);
        console.log('Characters removed:', originalToken.length - token.length);

        // Step 3: If token is too damaged, try to extract JSON from the original
        if (token.length < 20) {
            console.log('Token severely damaged, attempting JSON extraction from original...');

            // Look for JSON patterns in the original corrupted text
            const jsonPatterns = [
                /\{[^{}]*"access_token"[^{}]*\}/g,
                /\{[^{}]*"user"[^{}]*\}/g,
                /\{.*?"[^"]*".*?\}/g
            ];

            let extractedJson = null;
            for (const pattern of jsonPatterns) {
                const matches = originalToken.match(pattern);
                if (matches && matches.length > 0) {
                    // Try to clean and parse each match
                    for (const match of matches) {
                        try {
                            // Clean the match and try to parse
                            const cleanMatch = match.replace(/[^\x20-\x7E]/g, '');
                            const parsed = JSON.parse(cleanMatch);
                            if (parsed.access_token || parsed.user) {
                                extractedJson = cleanMatch;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    if (extractedJson) break;
                }
            }

            if (extractedJson) {
                token = extractedJson;
                console.log('Successfully extracted JSON from corrupted token');
            } else {
                throw new Error('Token is too corrupted to recover. Please refresh the callback page and copy a completely new token.');
            }
        }

        // Step 4: Final validation
        if (token.length < 10) {
            throw new Error('Token too short after all cleaning attempts');
        }

        // Step 5: Enhanced parsing strategies
        const base64Pattern = /^[A-Za-z0-9+/=\s]*$/;
        const jsonPattern = /^[\s]*[{\[].*[}\]][\s]*$/s;

        console.log('Final token - Length:', token.length);
        console.log('JSON pattern match:', jsonPattern.test(token));
        console.log('Base64 pattern match:', base64Pattern.test(token));

        // Step 6: Multi-strategy parsing with even more fallbacks
        let decoded = null;
        let parseStrategy = '';

        // Strategy 1: Direct JSON parse
        try {
            decoded = JSON.parse(token);
            parseStrategy = 'direct JSON';
            console.log('✓ Direct JSON parsing successful');
        } catch (jsonError1) {
            console.log('✗ Direct JSON failed:', jsonError1.message);

            // Strategy 2: Aggressive JSON cleaning
            try {
                let cleanedToken = token
                    .replace(/[^\w\s{}[\]:,"'.-@]/g, '') // Keep only safe chars
                    .replace(/\s*([{}[\]:,])\s*/g, '$1') // Remove spaces around JSON chars
                    .replace(/'/g, '"') // Convert single quotes to double
                    .trim();

                decoded = JSON.parse(cleanedToken);
                parseStrategy = 'aggressively cleaned JSON';
                console.log('✓ Aggressively cleaned JSON parsing successful');
            } catch (jsonError2) {
                console.log('✗ Cleaned JSON failed:', jsonError2.message);

                // Strategy 3: Base64 decode with cleaning
                try {
                    let base64Token = token.replace(/[^A-Za-z0-9+/=]/g, '');
                    // Ensure proper base64 padding
                    while (base64Token.length % 4) {
                        base64Token += '=';
                    }
                    const decodedBase64 = atob(base64Token);
                    decoded = JSON.parse(decodedBase64);
                    parseStrategy = 'base64 decode then JSON';
                    console.log('✓ Base64 decode successful');
                } catch (base64Error) {
                    console.log('✗ Base64 strategy failed:', base64Error.message);

                    // Strategy 4: Pattern extraction with multiple attempts
                    const extractionPatterns = [
                        /\{[^{}]*"access_token"[^{}]*"user"[^{}]*\}/g,
                        /\{[^{}]*"user"[^{}]*"access_token"[^{}]*\}/g,
                        /\{[^{}]*"access_token"[^{}]*\}/g,
                        /\{[^{}]*"user"[^{}]*\}/g,
                        /\{.*?"[^"]*".*?\}/g
                    ];

                    for (const pattern of extractionPatterns) {
                        const matches = token.match(pattern);
                        if (matches) {
                            for (const match of matches) {
                                try {
                                    decoded = JSON.parse(match);
                                    if (decoded.access_token || decoded.user) {
                                        parseStrategy = 'pattern extraction';
                                        console.log('✓ Pattern extraction successful');
                                        break;
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                            if (decoded) break;
                        }
                    }

                    if (!decoded) {
                        console.error('All parsing strategies exhausted');
                        console.error('Final token state:', {
                            length: token.length,
                            firstChars: token.substring(0, 20),
                            lastChars: token.substring(token.length - 20),
                            isJSON: jsonPattern.test(token),
                            isBase64: base64Pattern.test(token)
                        });

                        throw new Error(`Token parsing completely failed. Errors: JSON: "${jsonError1.message}", Cleaned: "${jsonError2.message}", Base64: "${base64Error.message}"`);
                    }
                }
            }
        }

        console.log('Token successfully parsed using strategy:', parseStrategy);

        // Validate the decoded token structure
        if (!decoded || typeof decoded !== 'object') {
            throw new Error('Decoded token is not a valid object');
        }

        if (!decoded.access_token || typeof decoded.access_token !== 'string') {
            throw new Error('Missing or invalid access_token in token');
        }

        if (!decoded.user || typeof decoded.user !== 'object') {
            throw new Error('Missing or invalid user information in token');
        }

        // Store the session
        state.session = {
            access_token: decoded.access_token,
            refresh_token: decoded.refresh_token
        };
        state.user = decoded.user;

        // Save to storage
        await chrome.storage.local.set({
            session: state.session,
            user: state.user
        });

        // Load user profile
        await loadUserProfile();
        showMainContent();
        showSuccess('Successfully signed in!');

    } catch (error) {
        console.error('Token processing error:', error);

        // Provide highly specific error messages based on the type of error
        let userMessage = 'Failed to process auth token.';
        let suggestions = [];

        if (error.message.includes('error message, not a token')) {
            userMessage = 'You pasted an error message instead of a token.';
            suggestions = [
                '1. Go back to the callback page',
                '2. Look for a box containing JSON-like text (starts with { and ends with })',
                '3. Copy ONLY the token content, not any error messages',
                '4. Paste it in the input field above'
            ];
        } else if (error.message.includes('too corrupted to recover')) {
            userMessage = 'The token is severely corrupted and cannot be recovered.';
            suggestions = [
                '1. Refresh the callback page completely (F5)',
                '2. Sign in again if needed',
                '3. Copy the new token that appears',
                '4. Make sure to copy the ENTIRE token without any surrounding text'
            ];
        } else if (error.message.includes('too short after')) {
            userMessage = 'The token appears to be incomplete or truncated.';
            suggestions = [
                '1. Make sure you selected and copied the COMPLETE token',
                '2. The token should be quite long (hundreds of characters)',
                '3. It should start with { and end with }',
                '4. Don\'t include any extra text before or after the token'
            ];
        } else if (error.message.includes('parsing completely failed')) {
            userMessage = 'The token format is unrecognizable and cannot be processed.';
            suggestions = [
                '1. This might be a browser compatibility issue',
                '2. Try using a different browser (Chrome, Firefox, Edge)',
                '3. Clear your browser cache and cookies',
                '4. Refresh the callback page and get a fresh token'
            ];
        } else if (error.message.includes('access_token')) {
            userMessage = 'The token is missing authentication information.';
            suggestions = [
                '1. The token might be incomplete or from a failed login',
                '2. Go back and sign in again completely',
                '3. Wait for the success message before copying the token',
                '4. Copy the new token that appears after successful login'
            ];
        } else if (error.message.includes('user')) {
            userMessage = 'The token is missing user information.';
            suggestions = [
                '1. The authentication might not be complete',
                '2. Make sure you completed the entire sign-in process',
                '3. Look for a "Successfully signed in" or similar message',
                '4. Copy the token only after seeing the success confirmation'
            ];
        }

        // Build the complete error message
        if (suggestions.length > 0) {
            userMessage += '\n\nSuggestions:\n' + suggestions.join('\n');
        }

        // Also log detailed info for debugging
        console.error('Detailed token info:', {
            originalLength: elements.authTokenInput.value.length,
            hasNonASCII: /[^\x20-\x7E]/.test(elements.authTokenInput.value),
            startsWithBrace: elements.authTokenInput.value.trim().startsWith('{'),
            endsWithBrace: elements.authTokenInput.value.trim().endsWith('}'),
            containsAccessToken: elements.authTokenInput.value.includes('access_token'),
            containsUser: elements.authTokenInput.value.includes('user')
        });

        showError(userMessage);
    }
}

// Resume Upload
async function handleResumeUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showError('Please upload a PDF file');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }

    elements.uploadResumeBtn.classList.add('uploading');
    elements.uploadResumeBtn.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    Processing...
  `;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/extract-pdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.session.access_token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to process PDF');
        }

        const data = await response.json();
        const extractedData = data.data;

        // Prepare profile data
        const profileData = {
            full_name: extractedData.full_name || '',
            email: extractedData.email || '',
            phone: extractedData.phone || '',
            location: extractedData.location || '',
            experiences: extractedData.experiences || '',
            projects: extractedData.projects || '',
            skills: Array.isArray(extractedData.skills) ? extractedData.skills.join(', ') : (extractedData.skills || ''),
            education: extractedData.education || '',
            certifications: extractedData.certifications || '',
            languages: Array.isArray(extractedData.languages) ? extractedData.languages.join(', ') : (extractedData.languages || ''),
            links: [
                extractedData.linkedin ? `LinkedIn: ${extractedData.linkedin}` : '',
                extractedData.github ? `GitHub: ${extractedData.github}` : '',
                extractedData.portfolio ? `Portfolio: ${extractedData.portfolio}` : ''
            ].filter(Boolean).join('\n')
        };

        // Save to profile
        const saveResponse = await fetch(`${CONFIG.API_BASE_URL}/api/profile`, {
            method: state.profile ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.session.access_token}`
            },
            body: JSON.stringify({
                ...profileData,
                ...(state.profile?.id ? { id: state.profile.id } : {})
            })
        });

        if (saveResponse.ok) {
            state.profile = await saveResponse.json();
            state.hasResume = true;
            state.credits = state.profile.credits || state.credits;
            showSuccess('Resume uploaded successfully!');
        } else {
            throw new Error('Failed to save profile');
        }
    } catch (error) {
        console.error('Resume upload error:', error);
        showError(error.message || 'Failed to process resume');
    } finally {
        elements.uploadResumeBtn.classList.remove('uploading');
        elements.resumeInput.value = '';
        updateUI();
    }
}

// Job Description
function handleJobDescriptionInput() {
    const length = elements.jobDescription.value.length;
    elements.charCount.textContent = `${length} characters`;
    updateGenerateButton();
}

async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        elements.jobDescription.value = text;
        handleJobDescriptionInput();
    } catch (error) {
        showError('Failed to paste from clipboard');
    }
}

// Generate Cover Letter
async function handleGenerate() {
    if (!state.hasResume || state.isLoading) return;

    const jobDescription = elements.jobDescription.value.trim();
    if (!jobDescription) return;

    const language = document.querySelector('input[name="language"]:checked')?.value || 'english';

    state.isLoading = true;
    elements.generateBtn.classList.add('hidden');
    elements.loadingState.classList.remove('hidden');

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 3 + 0.5, 95);
        elements.progressFill.style.width = `${progress}%`;
    }, 300);

    try {
        elements.loadingText.textContent = 'Generating your cover letter...';

        // Call generate API
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate-cover-letter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.session.access_token}`
            },
            body: JSON.stringify({
                profile: state.profile,
                jobDescription,
                language,
                generationMode: 'polished'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate cover letter');
        }

        const data = await response.json();

        if (data.success) {
            state.generatedLetter = data.content;
            state.generatedLatex = data.latex;

            // Update credits
            if (data.credits !== undefined && data.credits >= 0) {
                state.credits = data.credits;
            }

            // Extract editable fields
            extractEditableFields(data.content);

            elements.loadingText.textContent = 'Generating PDF...';

            // Generate PDF
            await generatePdf(data.latex);
        } else {
            throw new Error(data.error || 'Failed to generate cover letter');
        }
    } catch (error) {
        console.error('Generate error:', error);
        showError(error.message || 'Failed to generate cover letter');
    } finally {
        clearInterval(progressInterval);
        state.isLoading = false;
        elements.generateBtn.classList.remove('hidden');
        elements.loadingState.classList.add('hidden');
        elements.progressFill.style.width = '0%';
        updateUI();
    }
}

function extractEditableFields(content) {
    const recipientMatch = content.match(/\\newcommand\{\\recipientName\}\{([^}]*)\}/);
    const companyMatch = content.match(/\\newcommand\{\\targetCompany\}\{([^}]*)\}/);
    const positionMatch = content.match(/\\newcommand\{\\targetPosition\}\{([^}]*)\}/);
    const subjectMatch = content.match(/\\newcommand\{\\targetSubject\}\{([^}]*)\}/);

    state.editableContent.recipient = recipientMatch?.[1] || 'Hiring Manager';
    state.editableContent.company = companyMatch?.[1] || '';
    state.editableContent.position = positionMatch?.[1] || '';

    let subject = subjectMatch?.[1] || '';
    subject = subject
        .replace(/\\targetPosition/g, state.editableContent.position)
        .replace(/\\targetCompany/g, state.editableContent.company);
    state.editableContent.subject = subject;

    // Extract letter body
    const bodyMatch = content.match(/% Letter Body[\s\S]*?% =========================\s*([\s\S]*?)\s*\\vspace{2\.0em}/);
    if (bodyMatch) {
        let body = bodyMatch[1]
            .replace(/\\noindent\s*/g, '')
            .replace(/\\vspace{[^}]*}/g, '\n')
            .replace(/\\\\\s*/g, '\n')
            .replace(/\\textbf\{([^}]*)\}/g, '$1')
            .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
            .replace(/\\targetCompany(?![a-zA-Z])/g, state.editableContent.company)
            .replace(/\\targetPosition(?![a-zA-Z])/g, state.editableContent.position)
            .replace(/\\myname/g, state.profile?.full_name || '')
            .replace(/\\mylocation/g, state.profile?.location || '')
            .replace(/\\myemail/g, state.profile?.email || '')
            .replace(/\\myphone/g, state.profile?.phone || '')
            .replace(/\\today/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
            .replace(/\\%/g, '%')
            .replace(/\\_/g, '_')
            .replace(/\\&/g, '&')
            .replace(/\\#/g, '#')
            .replace(/\\\$/g, '$')
            .replace(/\\ /g, ' ')
            .replace(/\{|\}/g, '')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
        state.editableContent.body = body;
    }
}

async function generatePdf(latex) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.session.access_token}`
            },
            body: JSON.stringify({ latex })
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        const data = await response.json();

        if (data.success && data.pdfData) {
            // Convert base64 to blob
            const byteCharacters = atob(data.pdfData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Revoke old URL if exists
            if (state.pdfUrl) {
                URL.revokeObjectURL(state.pdfUrl);
            }

            state.pdfUrl = URL.createObjectURL(blob);
            showPreviewModal();
        } else {
            throw new Error(data.error || 'Failed to generate PDF');
        }
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}

// Modals
function showPreviewModal() {
    elements.pdfFrame.src = state.pdfUrl;
    elements.pdfPreviewModal.classList.remove('hidden');
}

function closePreviewModal() {
    elements.pdfPreviewModal.classList.add('hidden');
    elements.pdfFrame.src = '';
}

function openEditModal() {
    elements.editRecipient.value = state.editableContent.recipient;
    elements.editCompany.value = state.editableContent.company;
    elements.editPosition.value = state.editableContent.position;
    elements.editSubject.value = state.editableContent.subject;
    elements.editContent.value = state.editableContent.body;
    elements.editModal.classList.remove('hidden');
}

function closeEditModal() {
    elements.editModal.classList.add('hidden');
}

async function handleRecompile() {
    const recipient = elements.editRecipient.value;
    const company = elements.editCompany.value;
    const position = elements.editPosition.value;
    const subject = elements.editSubject.value;
    const body = elements.editContent.value;

    // Update state
    state.editableContent = { recipient, company, position, subject, body };

    // Update LaTeX
    let updatedLatex = state.generatedLatex
        .replace(/\\newcommand\{\\recipientName\}\{[^}]*\}/g, `\\newcommand{\\recipientName}{${recipient}}`)
        .replace(/\\newcommand\{\\targetCompany\}\{[^}]*\}/g, `\\newcommand{\\targetCompany}{${company}}`)
        .replace(/\\newcommand\{\\targetPosition\}\{[^}]*\}/g, `\\newcommand{\\targetPosition}{${position}}`)
        .replace(/\\newcommand\{\\targetSubject\}\{[^}]*\}/g, `\\newcommand{\\targetSubject}{${subject}}`)
        .replace(
            /% =========================\s*% Letter Body\s*% =========================[\s\S]*?\\vspace\{2\.0em\}/,
            `% =========================
% Letter Body
% =========================
${body.replace(/%/g, '\\%').replace(/&/g, '\\&').replace(/#/g, '\\#').replace(/\$/g, '\\$').replace(/_/g, '\\_')}

\\vspace{2.0em}`
        );

    state.generatedLatex = updatedLatex;

    elements.recompileBtn.disabled = true;
    elements.recompileBtn.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    Compiling...
  `;

    try {
        await generatePdf(updatedLatex);
        closeEditModal();
        showSuccess('Cover letter updated!');
    } catch (error) {
        showError('Failed to recompile PDF');
    } finally {
        elements.recompileBtn.disabled = false;
        elements.recompileBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
      Recompile PDF
    `;
    }
}

function downloadPdf() {
    if (!state.pdfUrl) return;

    const companyName = state.editableContent.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
    const fileName = `Cover_Letter_${companyName}.pdf`;

    const a = document.createElement('a');
    a.href = state.pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showSuccess('PDF downloaded!');
}

// Toast notifications
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorToast.classList.remove('hidden');
    setTimeout(() => {
        elements.errorToast.classList.add('hidden');
    }, 4000);
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successToast.classList.remove('hidden');
    setTimeout(() => {
        elements.successToast.classList.add('hidden');
    }, 3000);
}

// Additional auth handling is already covered by the main message listener above
