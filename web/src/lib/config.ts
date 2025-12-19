// ============================================
// CENTRALIZED API CONFIGURATION
// ============================================
// Single source of truth for all API URLs
// All pages/components MUST import from here
// ============================================

// For Next.js to inject env vars into client bundle
const BROWSER_API_URL = process.env.NEXT_PUBLIC_BROWSER_API_URL;
const BROWSER_CHATBOT_URL = process.env.NEXT_PUBLIC_BROWSER_CHATBOT_URL;

// Detect if we have NGINX proxy (production/staging)
// If no NEXT_PUBLIC_BROWSER_API_URL is set at build time, we assume NGINX proxy
const hasNginxProxy = !BROWSER_API_URL;

// API URLs - single source of truth
export const API_URL = hasNginxProxy
  ? '/api'  // NGINX proxy (production/staging) - relative URL
  : BROWSER_API_URL || 'http://localhost:8001/api/v1';  // Development - absolute URL

// IMPORTANT: CHATBOT_URL must include full path for local dev
// - Production: '/chat' - NGINX routes to chatbot service /api/v1/chat
// - Local: 'http://localhost:8000/api/v1/chat' - Direct FastAPI endpoint
export const CHATBOT_URL = hasNginxProxy
  ? '/chat'  // NGINX proxy (production/staging) - NGINX handles routing to /api/v1/chat
  : (BROWSER_CHATBOT_URL ? `${BROWSER_CHATBOT_URL}/api/v1/chat` : 'http://localhost:8000/api/v1/chat');  // Development - full path

// Log configuration in development
if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
  console.log('[CONFIG] API Configuration:', {
    API_URL,
    CHATBOT_URL,
    hasNginxProxy,
    BROWSER_API_URL,
    BROWSER_CHATBOT_URL
  });
}
