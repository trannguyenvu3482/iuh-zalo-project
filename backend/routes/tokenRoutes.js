const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const router = express.Router();

// Environment variables for Agora credentials
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// Token expiration time in seconds
const EXPIRATION_IN_SECONDS = 86400; // 24 hours

/**
 * Generate an RTC token for Agora video calls
 * Route: /api/token/rtc/:channel/:uid
 * Method: GET
 */
router.get('/rtc/:channel/:uid', (req, res) => {
  // Get channel name and uid from request parameters
  const channelName = req.params.channel;
  let uid = req.params.uid;
  
  // Optional: if uid is 'null', convert to 0 (for browser clients)
  if (uid === 'null' || uid === '') {
    uid = 0;
  }
  
  // Convert uid to number if it's a string
  uid = Number(uid);
  
  // Check if Agora credentials are configured
  if (!APP_ID || !APP_CERTIFICATE) {
    return res.status(500).json({
      error: 'Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables.'
    });
  }

  // Calculate privilege expiration time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + EXPIRATION_IN_SECONDS;
  
  // Build the token with RTC role as publisher
  let token;
  try {
    token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpireTime
    );
    
    // Return the token
    return res.json({
      token,
      appId: APP_ID,
      channel: channelName,
      uid: uid,
      expiresAt: new Date(privilegeExpireTime * 1000).toISOString()
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router; 