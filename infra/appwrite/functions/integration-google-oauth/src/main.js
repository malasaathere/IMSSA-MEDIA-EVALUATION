import { google } from 'googleapis';

// Appwrite Function: integration-google-oauth
export default async ({ req, res, log, error }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_CALLBACK_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    error("Missing Google OAuth environment variables.");
    return res.json({ success: false, message: "Server misconfiguration" }, 500);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // If there's a code in the query string, exchange it for a token
  if (req.query && req.query.code) {
    try {
      const { tokens } = await oauth2Client.getToken(req.query.code);
      log(`Acquired refresh token: ${tokens.refresh_token ? 'Yes' : 'No'}`);
      
      // In a real application, you would store this securely in the database
      // or update an Appwrite environment variable using the Server SDK.
      // For this implementation, we will log it for the administrator to copy 
      // into the worker-google-sheets-sync variables.
      
      return res.json({
        success: true,
        message: "OAuth flow completed.",
        refresh_token: tokens.refresh_token || "No refresh token provided (may need to prompt consent again)."
      });
    } catch (e) {
      error(`Token exchange failed: ${e.message}`);
      return res.json({ success: false, message: "Token exchange failed" }, 400);
    }
  }

  // Otherwise, initiate the OAuth flow
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets'
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent' // Forces consent screen to ensure we get a refresh token
  });

  return res.redirect(authorizationUrl);
};
