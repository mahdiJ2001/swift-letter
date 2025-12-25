// Swift Letter Browser Extension - Content Script
// Runs on job posting sites to help extract job descriptions

(function () {
    'use strict';

    // Site-specific selectors for job descriptions
    const JOB_SELECTORS = {
        // LinkedIn
        'linkedin.com': {
            description: [
                '.jobs-description__content',
                '.jobs-box__html-content',
                '.description__text',
                '[class*="job-description"]',
                '.show-more-less-html__markup'
            ],
            company: [
                '.job-details-jobs-unified-top-card__company-name a',
                '.jobs-unified-top-card__company-name a',
                '.topcard__org-name-link'
            ],
            position: [
                '.job-details-jobs-unified-top-card__job-title',
                '.jobs-unified-top-card__job-title',
                '.topcard__title'
            ]
        },
        // Indeed
        'indeed.com': {
            description: [
                '#jobDescriptionText',
                '.jobsearch-jobDescriptionText',
                '[id*="jobDescription"]'
            ],
            company: [
                '[data-company-name]',
                '.jobsearch-InlineCompanyRating-companyHeader a',
                '.css-1cjkto6'
            ],
            position: [
                '.jobsearch-JobInfoHeader-title',
                'h1[data-testid="jobsearch-JobInfoHeader-title"]',
                '.icl-u-xs-mb--xs'
            ]
        },
        // Glassdoor
        'glassdoor.com': {
            description: [
                '.jobDescriptionContent',
                '[class*="JobDetails_jobDescription"]',
                '.desc'
            ],
            company: [
                '[data-test="employer-name"]',
                '.employerName'
            ],
            position: [
                '[data-test="jobTitle"]',
                '.job-title'
            ]
        },
        // Monster
        'monster.com': {
            description: [
                '.job-description',
                '#JobDescription',
                '[class*="description"]'
            ],
            company: [
                '.company-name',
                '[data-testid="company-name"]'
            ],
            position: [
                '.job-title',
                'h1'
            ]
        },
        // ZipRecruiter
        'ziprecruiter.com': {
            description: [
                '.job_description',
                '.jobDescriptionSection',
                '[class*="Description"]'
            ],
            company: [
                '.hiring_company_text',
                '.company_name'
            ],
            position: [
                '.job_title',
                'h1.job_title'
            ]
        },
        // AngelList/Wellfound
        'wellfound.com': {
            description: [
                '.job-description',
                '[class*="description"]'
            ],
            company: [
                '.company-name',
                '[class*="companyName"]'
            ],
            position: [
                '.job-title',
                'h1'
            ]
        },
        // Dice
        'dice.com': {
            description: [
                '#jobdescSec',
                '.job-description',
                '[data-testid="jobDescriptionHtml"]'
            ],
            company: [
                '.companyName',
                '[data-cy="companyNameLink"]'
            ],
            position: [
                '.jobTitle',
                'h1[data-cy="jobTitle"]'
            ]
        },
        // Generic fallback
        'default': {
            description: [
                '[class*="job-description"]',
                '[class*="jobDescription"]',
                '[id*="description"]',
                '.description',
                'article',
                'main'
            ],
            company: [
                '[class*="company"]',
                '[class*="employer"]'
            ],
            position: [
                '[class*="job-title"]',
                '[class*="jobTitle"]',
                'h1'
            ]
        }
    };

    // Determine which site we're on
    function detectSite() {
        const hostname = window.location.hostname;
        for (const site of Object.keys(JOB_SELECTORS)) {
            if (site !== 'default' && hostname.includes(site)) {
                return site;
            }
        }
        return 'default';
    }

    // Find element using multiple selectors
    function findElement(selectors) {
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element) return element;
            } catch (e) {
                // Invalid selector, skip
            }
        }
        return null;
    }

    // Extract job details from page
    function extractJobDetails() {
        const site = detectSite();
        const selectors = JOB_SELECTORS[site] || JOB_SELECTORS.default;

        const descriptionEl = findElement(selectors.description);
        const companyEl = findElement(selectors.company);
        const positionEl = findElement(selectors.position);

        return {
            description: descriptionEl?.innerText?.trim() || '',
            company: companyEl?.innerText?.trim() || '',
            position: positionEl?.innerText?.trim() || '',
            url: window.location.href,
            site: site
        };
    }

    // Create floating button for quick access
    function createFloatingButton() {
        // Check if button already exists
        if (document.getElementById('swift-letter-btn')) return;

        const button = document.createElement('button');
        button.id = 'swift-letter-btn';
        button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <span>Swift Letter</span>
    `;

        button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
      transition: all 0.3s ease;
    `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.5)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
        });

        button.addEventListener('click', () => {
            const jobDetails = extractJobDetails();

            // Store the extracted data
            chrome.storage.local.set({
                pendingJobDescription: jobDetails.description,
                pendingCompany: jobDetails.company,
                pendingPosition: jobDetails.position
            }, () => {
                // Notify user
                showNotification('Job details extracted! Click the Swift Letter extension icon to generate your cover letter.');
            });
        });

        document.body.appendChild(button);
    }

    // Show notification toast
    function showNotification(message) {
        const existing = document.getElementById('swift-letter-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'swift-letter-toast';
        toast.textContent = message;
        toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      padding: 12px 20px;
      background: #1f2937;
      color: white;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
      }
    `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GET_JOB_DETAILS') {
            const details = extractJobDetails();
            sendResponse(details);
        }
        return true;
    });

    // Initialize when DOM is ready
    function init() {
        // Only show button on job posting pages
        const site = detectSite();
        if (site !== 'default') {
            // Wait a bit for page to fully load
            setTimeout(createFloatingButton, 1500);
        } else {
            // Check if page looks like a job posting
            const hasJobKeywords = document.body.innerText.toLowerCase().includes('job description') ||
                document.body.innerText.toLowerCase().includes('responsibilities') ||
                document.body.innerText.toLowerCase().includes('requirements');

            if (hasJobKeywords) {
                setTimeout(createFloatingButton, 2000);
            }
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run on URL changes (for SPAs like LinkedIn)
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(init, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

})();
