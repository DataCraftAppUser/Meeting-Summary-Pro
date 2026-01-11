# Setting Up Google OAuth in Supabase

## Step 1: Create OAuth Credentials in Google Cloud Console

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create a new project or select an existing one:**
   - Click on the project menu (at the top)
   - Click "New Project" or select an existing project
   - Give the project a name (e.g., "Meeting-Summary-App")

3. **Enable Google+ API:**
   - In the left menu, go to: **APIs & Services** → **Library**
   - Search for: "Google+ API" or "Google Identity"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to: **APIs & Services** → **Credentials**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - If this is your first time, you'll need to configure the OAuth consent screen:
     - Select "External" (or "Internal" if you have Google Workspace)
     - Fill in the basic details:
       - App name: "Meeting Summary Pro" (or any other name)
       - User support email: Your email
       - Developer contact: Your email
     - Click "Save and Continue"
     - On the Scopes page, click "Save and Continue"
     - On the Test users page, click "Save and Continue"
     - On the Summary page, click "Back to Dashboard"

5. **Create OAuth Client ID:**
   - Application type: Select **"Web application"**
   - Name: Give it a name (e.g., "Meeting Summary Web")
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://your-frontend-domain.vercel.app
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/auth/callback
     https://your-frontend-domain.vercel.app/auth/callback
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**
   - **Save the Client ID and Client Secret** (you'll see them in a popup)

## Step 2: Configure Google OAuth in Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Go to Authentication settings:**
   - In the left menu, click **Authentication**
   - Click **Providers** (or "Auth Providers")

3. **Enable Google Provider:**
   - Find **Google** in the list of providers
   - Click the toggle to enable it
   - Or click on **Google** to open the settings

4. **Enter the Credentials:**
   - **Client ID (for OAuth):** Paste the Client ID from Google Cloud Console
   - **Client Secret (for OAuth):** Paste the Client Secret from Google Cloud Console
   - **Authorized Client IDs:** Leave empty (or add the Client ID if required)

5. **Save:**
   - Click **"Save"** or **"Update"**

6. **Check the Redirect URL:**
   - In Supabase, under **Authentication** → **URL Configuration**
   - Make sure **Redirect URLs** includes:
     ```
     http://localhost:3000/**
     https://your-frontend-domain.vercel.app/**
     ```

## Step 3: Testing

1. **Run the Frontend:**
   ```bash
   cd frontend
   npm start
   ```

2. **Try to sign in:**
   - Go to: http://localhost:3000/login
   - Click "Sign in with Google"
   - A Google OAuth window should open
   - Select a Google account
   - You should be redirected back to the application

3. **If there's an error:**
   - Check the browser Console (F12)
   - Make sure the Redirect URLs in Google Cloud Console match
   - Verify the Client ID and Secret are correct in Supabase

## Important Notes:

- **For development:** Use `http://localhost:3000`
- **For production:** Update the URLs to your actual domain
- **If using Vercel:** Add your deployment URL to Authorized redirect URIs
