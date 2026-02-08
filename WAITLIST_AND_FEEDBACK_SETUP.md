# Waitlist and Feedback System Setup

This guide covers the waitlist and feedback system implementation for your Swift Letter application.

## 🎯 What's Implemented

### ✅ Waitlist System (Already Complete!)
Your waitlist system is fully functional with:
- **Email validation** and sanitization
- **Duplicate prevention** with unique email constraints
- **Rate limiting** (5 attempts per 15 minutes per IP)
- **Comprehensive email validation** (checks format, domain, length limits)
- **Status tracking** (active, notified, converted)
- **Position tracking** in the waitlist

**Files:**
- Migration: [`supabase/migrations/20260205000001_create_waitlist_table.sql`](supabase/migrations/20260205000001_create_waitlist_table.sql)
- API Route: [`app/api/waitlist/route.ts`](app/api/waitlist/route.ts)

### ✅ Enhanced Feedback System (Updated!)
Your feedback system has been improved with:
- **Screenshot storage** in dedicated `screenshot_url` column (instead of concatenated text)
- **Rating system** (1-5 stars) with validation
- **Metadata tracking** (IP, user agent, timestamp)
- **Enhanced validation** and sanitization
- **File upload validation** (type, size limits)

**Files:**
- New Migration: [`supabase/migrations/20260208000001_add_screenshot_url_to_feedback.sql`](supabase/migrations/20260208000001_add_screenshot_url_to_feedback.sql)
- Updated API: [`app/api/feedback/route.ts`](app/api/feedback/route.ts)
- Updated Types: [`types/supabase.ts`](types/supabase.ts)

## 🚀 How to Deploy

### 1. Run Migrations
```bash
# Navigate to your project directory
cd "c:\Users\ASUS\Desktop\Swift Letter"

# Run Supabase migrations
npx supabase db push
```

### 2. Verify Tables
Check your Supabase dashboard to confirm:
- ✅ `waitlist` table exists
- ✅ `user_feedback` table has new columns: `rating`, `screenshot_url`, `metadata`

## 📡 API Usage

### Waitlist API
**Endpoint:** `POST /api/waitlist`

```javascript
// Join waitlist
const response = await fetch('/api/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    source: 'website' // optional: 'website', 'waitlist-page', 'landing-page', 'referral'
  })
});

const result = await response.json();
// Returns: { success: true, data: { id, email, joined_at, position } }
```

### Feedback API
**Endpoint:** `POST /api/feedback`

```javascript
// Submit feedback with screenshot
const formData = new FormData();
formData.append('feedback', 'Great app! Love the features.');
formData.append('rating', '5'); // optional: 1-5
formData.append('userId', 'user-uuid'); // optional
formData.append('screenshot', file); // optional: image file

const response = await fetch('/api/feedback', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Returns: { success: true, message: 'Thank you for your feedback!' }
```

## 🛡️ Security Features

### Email Validation
- ✅ **Format validation** (RFC 5321 compliant)
- ✅ **Length limits** (local part ≤ 64, total ≤ 254 characters)
- ✅ **Disposable email detection** (blocks temporary email services)
- ✅ **XSS prevention** with input sanitization

### Rate Limiting
- **Waitlist:** 5 attempts per 15 minutes per IP
- **Feedback:** 3 submissions per 30 minutes per IP

### File Upload Security
- ✅ **File type validation** (PNG, JPEG, WebP only)
- ✅ **Size limits** (5MB maximum)
- ✅ **Secure filename generation**
- ✅ **Storage in dedicated bucket** (`feedback-screenshots`)

## 🗄️ Database Schema

### Waitlist Table
```sql
CREATE TABLE public.waitlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    joined_at timestamptz DEFAULT now(),
    source text DEFAULT 'website',
    status text DEFAULT 'active', -- 'active', 'notified', 'converted'
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Enhanced User Feedback Table
```sql
ALTER TABLE public.user_feedback ADD COLUMN:
- rating integer CHECK (rating >= 1 AND rating <= 5)
- screenshot_url text
- metadata jsonb DEFAULT '{}'
```

## 🔧 Testing

Test both systems to ensure they work correctly:

1. **Test Waitlist:**
   - Try valid email → should succeed
   - Try same email again → should get "already exists" error
   - Try invalid email → should get validation error
   - Try rapid submissions → should hit rate limit

2. **Test Feedback:**
   - Submit feedback only → should succeed
   - Submit with rating → should succeed
   - Submit with screenshot → should succeed and store URL separately
   - Submit large file → should get size error
   - Submit wrong file type → should get type error

## 📊 Database Queries

Query waitlist:
```sql
-- Get all waitlist entries
SELECT * FROM waitlist ORDER BY joined_at DESC;

-- Get waitlist count
SELECT COUNT(*) FROM waitlist WHERE status = 'active';
```

Query feedback:
```sql
-- Get feedback with screenshots
SELECT id, feedback, rating, screenshot_url, created_at 
FROM user_feedback 
WHERE screenshot_url IS NOT NULL;

-- Get average rating
SELECT AVG(rating) as average_rating 
FROM user_feedback 
WHERE rating IS NOT NULL;
```

## ✨ Key Improvements Made

1. **Separated screenshot storage** from feedback text for better data structure
2. **Added rating system** for structured feedback collection
3. **Enhanced metadata tracking** for analytics and debugging
4. **Improved TypeScript types** for better development experience
5. **Comprehensive validation** for both email and feedback inputs

Your waitlist and feedback systems are now production-ready with proper validation, security, and data structure! 🎉