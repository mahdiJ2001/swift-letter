# Swift Letter Browser Extension

A Chrome browser extension that lets you generate professional cover letters directly from job posting sites like LinkedIn, Indeed, Glassdoor, and more.

## Features

- **One-click job extraction**: Automatically extract job descriptions from supported job sites
- **Floating button**: Quick access button appears on job posting pages
- **Full cover letter generation**: Same powerful AI generation as the main Swift Letter app
- **PDF preview**: View your generated cover letter as a PDF
- **Edit & customize**: Modify the generated letter and recompile
- **Download**: Save your cover letter as a PDF file
- **Resume management**: Upload and update your resume directly from the extension

## Supported Job Sites

- LinkedIn
- Indeed
- Glassdoor
- Monster
- ZipRecruiter
- Wellfound (AngelList)
- Dice
- And any page with job description content!

## Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **Load unpacked**
4. Select the `browser-extension` folder
5. The Swift Letter extension icon should appear in your toolbar

### Configuration

Before using the extension, you need to update the configuration in `popup.js` and `background.js`:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://your-domain.com', // Your Swift Letter app URL
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key-here'
};
```

## Usage

### Method 1: Quick Extract (Recommended)

1. Navigate to a job posting on any supported site
2. Click the **Swift Letter** floating button in the bottom-right corner
3. The job description will be extracted automatically
4. Click the Swift Letter extension icon in your browser toolbar
5. The job description will be pre-filled
6. Click **Generate Cover Letter**
7. Preview, edit, and download your cover letter!

### Method 2: Manual Paste

1. Copy the job description from any website
2. Click the Swift Letter extension icon
3. Click **Paste from Clipboard** or paste manually
4. Click **Generate Cover Letter**

### Method 3: Right-Click Context Menu

1. Select any text containing a job description
2. Right-click and select **Generate Cover Letter with Swift Letter**
3. The extension popup will open with the text pre-filled

## Authentication

The extension uses the same authentication as the Swift Letter website:

1. Click **Sign in to Swift Letter** in the extension
2. You'll be redirected to the Swift Letter website to log in
3. After logging in, return to the extension
4. Your session will be synced automatically

## File Structure

```
browser-extension/
├── manifest.json       # Chrome extension manifest
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Main popup logic
├── background.js      # Service worker
├── content.js         # Content script for job sites
├── content.css        # Content script styles
├── icons/
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md          # This file
```

## Publishing to Chrome Web Store

1. Create a ZIP file of the `browser-extension` folder
2. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Pay the one-time $5 developer fee (if not already done)
4. Click **New Item** and upload the ZIP
5. Fill in the listing details, screenshots, etc.
6. Submit for review

### Required Assets for Publishing

- **Icons**: Convert SVG icons to PNG format (16x16, 48x48, 128x128)
- **Screenshots**: At least 1 screenshot (1280x800 or 640x400)
- **Description**: Detailed description of the extension
- **Privacy Policy**: If collecting user data

## Development Notes

### API Endpoints Used

- `GET /api/profile?userId={id}` - Fetch user profile
- `POST /api/extract-pdf` - Extract resume data from PDF
- `PUT /api/profile` - Update user profile
- `POST /api/generate-cover-letter` - Generate cover letter
- `POST /api/generate-pdf` - Compile LaTeX to PDF

### CORS Considerations

Make sure your Next.js API routes allow requests from the extension:

```javascript
// In your API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specific extension origin
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Troubleshooting

### Extension not loading
- Make sure Developer mode is enabled
- Check the console for errors in `chrome://extensions/`

### Authentication not working
- Clear extension storage: Right-click extension → Manage → Clear data
- Try logging in again on the website

### Job description not extracting
- The site might not be in the supported list
- Try using the manual paste method

### PDF not generating
- Check your internet connection
- Verify the API endpoints are working
- Check the console for error messages

## License

This extension is part of the Swift Letter application.
