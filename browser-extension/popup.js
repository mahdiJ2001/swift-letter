// Swift Letter Browser Extension - Main Popup Script

// Configuration - Dynamically get from website
let CONFIG = {
    API_BASE_URL: 'http://localhost:3001', // Fallback for development
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
    WEBSITE_URL: 'https://swiftletter.online' // Production website URL
};

// Function to detect environment and set config
async function detectConfig() {
    try {
        // Try to get config from the website
        const response = await fetch(`${CONFIG.WEBSITE_URL}/api/config`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            const config = await response.json();
            CONFIG.API_BASE_URL = config.baseUrl || CONFIG.WEBSITE_URL;
            CONFIG.SUPABASE_URL = config.supabaseUrl;
            CONFIG.SUPABASE_ANON_KEY = config.supabaseAnonKey;
        } else {
            // Fallback to localhost for development
            CONFIG.API_BASE_URL = 'http://localhost:3001';
        }
    } catch (error) {
        console.log('Using fallback config for development:', error);
        // Keep the localhost fallback
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
    cacheElements();
    attachEventListeners();
    await checkAuthStatus();
    await loadPendingJobDescription();
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
    elements.loginBtn.addEventListener('click', openLoginPage);
    elements.refreshAuthBtn.addEventListener('click', handleRefreshAuth);
    elements.signupLink.addEventListener('click', openSignupPage);
    elements.pasteTokenBtn.addEventListener('click', handlePasteToken);

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
        // First load configuration
        await detectConfig();
        
        // Check for automatic auth from website first
        await checkWebsiteAuth();
        
        // Try to get session from storage
        const stored = await chrome.storage.local.get(['session', 'user']);

        if (stored.session && stored.user) {
            state.session = stored.session;
            state.user = stored.user;

            // Verify session is still valid
            const isValid = await verifySession();
            if (isValid) {
                await loadUserProfile();
                showMainContent();
                return;
            }
        }

        // No valid session, show auth
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
            (activeTab.url.includes('swiftletter.online') || activeTab.url.includes('localhost:3001'))) {
            
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
    
    // First try to detect existing auth from any open Swift Letter tabs
    const swiftLetterTabs = await chrome.tabs.query({ 
        url: ['*://swiftletter.online/*', '*://www.swiftletter.online/*', '*://localhost:3001/*'] 
    });
    
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
    chrome.tabs.create({ 
        url: `${CONFIG.API_BASE_URL}/auth/login?extension=true&redirect_to=${encodeURIComponent(CONFIG.API_BASE_URL + '/auth/callback/extension?extension=true')}` 
    });
}

function openSignupPage(e) {
    e.preventDefault();
    chrome.tabs.create({ url: `${CONFIG.API_BASE_URL}/auth/signup?extension=true&redirect_to=${CONFIG.API_BASE_URL}/auth/callback/extension?extension=true` });
}

async function handleRefreshAuth() {
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

// Handle pasting auth token from the callback page
async function handlePasteToken() {
    try {
        // Try to read from clipboard first
        let token = elements.authTokenInput.value.trim();

        if (!token) {
            // Try to get from clipboard
            try {
                token = await navigator.clipboard.readText();
                elements.authTokenInput.value = token;
            } catch {
                showError('Please paste your auth token in the input field');
                return;
            }
        }

        if (!token) {
            showError('Please paste your auth token');
            return;
        }

        // Decode the token
        try {
            const decoded = JSON.parse(atob(token));

            if (!decoded.access_token || !decoded.user) {
                throw new Error('Invalid token format');
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

        } catch (decodeError) {
            console.error('Token decode error:', decodeError);
            showError('Invalid auth token. Please copy a fresh token from the website.');
        }

    } catch (error) {
        console.error('Paste token error:', error);
        showError('Failed to process auth token');
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

// Listen for auth messages from the web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_SUCCESS') {
        state.session = message.session;
        state.user = message.user;

        // Store session
        chrome.storage.local.set({
            session: message.session,
            user: message.user
        });

        loadUserProfile().then(() => {
            showMainContent();
        });

        sendResponse({ success: true });
    }
});
