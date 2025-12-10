# Cover Letter Generation Setup

## AWS Bedrock Configuration

The custom cover letter generation system uses AWS Bedrock with Claude 3 Sonnet model for AI-powered cover letter creation.

### Required Environment Variables

You need to set these secrets in your Supabase project:

1. **AWS_ACCESS_KEY_ID**: Your AWS access key ID
2. **AWS_SECRET_ACCESS_KEY**: Your AWS secret access key

### Setting Up AWS Credentials

1. Create an AWS account and set up IAM user with Bedrock permissions
2. Generate access keys for the IAM user
3. Set the secrets in Supabase:

```bash
supabase secrets set AWS_ACCESS_KEY_ID=your_actual_access_key
supabase secrets set AWS_SECRET_ACCESS_KEY=your_actual_secret_key
```

### Required AWS Permissions

Your IAM user needs the following permissions:
- `bedrock:InvokeModel`
- Access to the `anthropic.claude-3-sonnet-20240229-v1:0` model

### Deployment

The Supabase Edge Function is already deployed:
```bash
supabase functions deploy generate-cover-letter
```

### How It Works

1. User fills out their profile information
2. User pastes job description, job title, and company name
3. System validates profile completeness
4. AI generates personalized cover letter using Claude 3 Sonnet
5. LaTeX template is populated with user data and generated content
6. User can preview the cover letter and copy it
7. Credits are deducted from user account

### Features Implemented

✅ **Job Description Form**: Captures job title, company name, and description
✅ **Profile Validation**: Ensures required fields are complete
✅ **AI Generation**: Uses AWS Bedrock Claude 3 Sonnet
✅ **LaTeX Template**: Professional cover letter formatting
✅ **Credit System**: Tracks and deducts user credits
✅ **Preview System**: Users can review generated letters
✅ **Error Handling**: Comprehensive error management
✅ **Authentication**: Secure user sessions
✅ **Database Storage**: Stores generated letters

### Testing

1. Fill out your profile with complete information
2. Go to the homepage and enter a job description
3. Click "Continue to Profile" 
4. Click "Generate Cover Letter"
5. Review the AI-generated cover letter

### Notes

- The system requires a complete user profile (name, email, phone, experiences, skills)
- Each generation costs 1 credit
- Generated letters are stored in the database
- The system supports both English and French (configurable)
- LaTeX compilation can be added for PDF generation using AWS Lambda