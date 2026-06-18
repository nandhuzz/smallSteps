# Upstox OAuth Setup Guide

This guide will help you configure OAuth authentication for Upstox integration in SmallSteps.

## Prerequisites

- An active Upstox trading account
- Access to Upstox Developer Console

## Step-by-Step Setup

### 1. Create/Access Your Upstox App

1. Go to [Upstox Developer Console](https://api.upstox.com/apps)
2. Log in with your Upstox credentials
3. If you don't have an app yet, click **"Create App"**
4. If you already have an app, click on it to view/edit settings

### 2. Configure Your App Settings

When creating or editing your app, you need to configure these settings:

#### App Name
- Choose any name (e.g., "SmallSteps Trading Journal")

#### Redirect URI (CRITICAL)
You must add **exactly** this redirect URI:
```
http://127.0.0.1:34115/callback
```

**Important Notes:**
- Use `127.0.0.1` instead of `localhost` (more reliable)
- The port `34115` is what SmallSteps uses
- The path must be `/callback`
- Do NOT add a trailing slash
- The URI is case-sensitive

#### App Type
- Select **"Web App"** or **"Desktop App"** (both work)

#### Permissions
- Enable all read permissions you need:
  - ✅ Read portfolio
  - ✅ Read orders
  - ✅ Read trades
  - ✅ Read positions
  - ✅ Read market data

### 3. Get Your Credentials

After creating/updating your app:

1. **API Key (Client ID)**: Copy this from the app details page
2. **API Secret (Client Secret)**: Copy this from the app details page

**⚠️ Keep these credentials secure! Never share them or commit them to version control.**

### 4. Configure SmallSteps

1. Open SmallSteps application
2. Navigate to **Broker Integration** section
3. Click on **"OAuth Config"** tab
4. Enter your credentials:
   - **API Key**: Paste your Client ID
   - **API Secret**: Paste your Client Secret
5. Configure sync settings (optional):
   - Auto-sync trades: ✅ (recommended)
   - Auto-sync positions: ✅ (recommended)
   - Sync interval: 300 seconds (5 minutes)
6. Click **"Save Configuration"**

### 5. Authorize the App

1. After saving configuration, click **"Authorize Upstox"**
2. A browser window will open with Upstox login
3. Log in to your Upstox account
4. Review and approve the permissions
5. After approval, you'll see a success page
6. **The authorization is automatic!** SmallSteps will capture the code automatically
7. The browser window will close automatically after 3 seconds
8. Return to SmallSteps to see the "Connected" status

**Note:** If automatic authorization fails, you can manually paste the code from the URL into the "Manual Authorization Code" field.

### 6. Verify Connection

After successful authorization:
- You should see **"Authorization successful!"** message
- A **"✓ Connected"** status badge will appear
- The "Synced Trades" and "Positions" tabs will become active
- You can now sync your trades and view positions

## How It Works

SmallSteps runs a local HTTP server on port 34115 that automatically captures the OAuth callback:

1. When you click "Authorize Upstox", a browser opens
2. After you approve, Upstox redirects to `http://127.0.0.1:34115/callback?code=...`
3. SmallSteps captures the code automatically
4. The authorization completes without manual code entry
5. You see a success page that auto-closes

## Troubleshooting

### Error: "Check your 'client_id' and 'redirect_uri'"

**Causes:**
1. Redirect URI in Upstox app doesn't match `http://127.0.0.1:34115/callback`
2. API Key (Client ID) is incorrect
3. Typo in the redirect URI (extra spaces, wrong port, etc.)

**Solution:**
1. Go to Upstox Developer Console
2. Edit your app
3. Ensure redirect URI is **exactly**: `http://127.0.0.1:34115/callback`
4. Save changes
5. Wait 1-2 minutes for changes to propagate
6. Try authorization again

### Error: "Invalid authorization code"

**Causes:**
1. Code was already used (codes are single-use)
2. Code expired (valid for ~10 minutes)
3. Code was copied incorrectly

**Solution:**
1. Click "Authorize Upstox" again to get a new code
2. Copy the entire code carefully
3. Submit immediately (don't wait too long)

### Error: "Token expired"

**Causes:**
1. Access token expired (typically valid for 24 hours)

**Solution:**
1. Re-authorize the app to get a new token
2. Consider using Analytics Token for long-term access (see below)

## Alternative: Analytics Token (Recommended)

For simpler, long-term access without OAuth hassles:

### Advantages
- ✅ No OAuth authorization needed
- ✅ Valid for 1 year
- ✅ No token refresh required
- ✅ Simpler setup

### Limitations
- ❌ Read-only access (cannot place orders)
- ✅ Perfect for SmallSteps (we only need read access)

### Setup
1. Go to [Upstox API Apps](https://api.upstox.com/apps)
2. Click on your app
3. Look for **"Analytics Token"** or **"Access Token"** section
4. Generate a new Analytics Token
5. Copy the token
6. Create/edit `.env` file in SmallSteps root directory:
   ```
   UPSTOX_ANALYTICS_TOKEN=your_token_here
   ```
7. Restart SmallSteps
8. Go to Broker Integration → Analytics Token tab
9. Click "Check Token Status"

## Security Best Practices

1. **Never share your API credentials**
2. **Keep .env file secure** (it's in .gitignore)
3. **Regenerate tokens if compromised**
4. **Use Analytics Token for read-only operations**
5. **Only use OAuth if you need trading capabilities**

## Support

If you continue to face issues:
1. Check Upstox API status: https://upstox.com/status
2. Review Upstox API documentation: https://upstox.com/developer/api-documentation
3. Contact Upstox support for API-related issues

## Summary Checklist

- [ ] Created/accessed Upstox app in Developer Console
- [ ] Added redirect URI: `http://127.0.0.1:34115/callback`
- [ ] Copied API Key and API Secret
- [ ] Entered credentials in SmallSteps
- [ ] Clicked "Authorize Upstox"
- [ ] Completed authorization in browser
- [ ] Saw success page (auto-closes)
- [ ] Verified "Connected" status in SmallSteps
- [ ] Successfully synced trades/positions

## Port Already in Use?

If you see an error about port 34115 being in use:

1. Close any other instances of SmallSteps
2. Check if another application is using port 34115:
   - Windows: `netstat -ano | findstr :34115`
   - Mac/Linux: `lsof -i :34115`
3. Restart SmallSteps

---

**Made with Bob**