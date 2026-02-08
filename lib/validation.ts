/**
 * Enhanced validation utilities for email and form validation
 */

// More comprehensive email validation
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    // Trim and normalize
    email = email.trim().toLowerCase();
    
    // Basic format check
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(email)) return false;
    
    // More strict validation
    const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!strictEmailRegex.test(email)) return false;
    
    // Length checks
    if (email.length > 254) return false; // RFC 5321 limit
    
    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) return false; // RFC 5321 limit
    
    // Check for common disposable email providers (optional - can be customized)
    const disposableProviders = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
        'mailinator.com', 'throwaway.email'
    ];
    
    if (disposableProviders.some(provider => domain.includes(provider))) {
        return false;
    }
    
    return true;
}

// Validate feedback content
export function isValidFeedback(feedback: string): { isValid: boolean; error?: string } {
    if (!feedback || typeof feedback !== 'string') {
        return { isValid: false, error: 'Feedback is required' };
    }
    
    const trimmed = feedback.trim();
    
    if (trimmed.length < 10) {
        return { isValid: false, error: 'Feedback must be at least 10 characters long' };
    }
    
    if (trimmed.length > 2000) {
        return { isValid: false, error: 'Feedback must be less than 2000 characters' };
    }
    
    // Check for spam patterns
    const spamPatterns = [
        /(.)\1{10,}/, // Repeated characters
        /https?:\/\/[^\s]+/gi, // URLs (optional restriction)
    ];
    
    for (const pattern of spamPatterns) {
        if (pattern.test(trimmed)) {
            return { isValid: false, error: 'Feedback contains invalid content' };
        }
    }
    
    return { isValid: true };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove basic HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .substring(0, 2000); // Limit length
}

// Rate limiting helper (for API routes)
export class RateLimiter {
    private attempts: Map<string, { count: number; resetTime: number }> = new Map();
    
    constructor(
        private maxAttempts: number = 5,
        private windowMs: number = 15 * 60 * 1000 // 15 minutes
    ) {}
    
    isAllowed(identifier: string): boolean {
        const now = Date.now();
        const record = this.attempts.get(identifier);
        
        if (!record || now > record.resetTime) {
            this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
            return true;
        }
        
        if (record.count >= this.maxAttempts) {
            return false;
        }
        
        record.count++;
        return true;
    }
    
    getRemainingAttempts(identifier: string): number {
        const record = this.attempts.get(identifier);
        if (!record || Date.now() > record.resetTime) {
            return this.maxAttempts;
        }
        return Math.max(0, this.maxAttempts - record.count);
    }
}

// Email domain validation against known providers
export function validateEmailDomain(email: string): { isValid: boolean; provider?: string } {
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return { isValid: false };
    
    // Common trusted email providers
    const trustedProviders = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
        'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com'
    ];
    
    const provider = trustedProviders.find(p => domain === p || domain.endsWith('.' + p));
    
    return {
        isValid: true, // We allow all domains, just identify trusted ones
        provider: provider || 'other'
    };
}

// Comprehensive form validation for waitlist
export function validateWaitlistSubmission(email: string, source?: string): {
    isValid: boolean;
    errors: string[];
    sanitized: { email: string; source: string };
} {
    const errors: string[] = [];
    
    // Validate email
    if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Validate source
    const allowedSources = ['website', 'waitlist-page', 'landing-page', 'referral'];
    const sanitizedSource = source && allowedSources.includes(source) ? source : 'website';
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            email: email.trim().toLowerCase(),
            source: sanitizedSource
        }
    };
}