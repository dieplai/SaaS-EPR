# EPR Frontend - React + Vite

Modern React application built with Vite, TypeScript, and Tailwind CSS for EPR Legal SaaS Platform.

## 🚀 Quick Start

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 8080
npm run dev:staging  # Start dev server with staging config (port 3001)
```

### Production Build
```bash
npm run build              # Production build
npm run build:staging      # Staging build
npm run preview            # Preview production build
```

## 🔧 Environment Configuration

### Port Configuration

The application uses **environment-based port configuration**:

| Environment | Port | Command |
|------------|------|---------|
| Development | 8080 | `npm run dev` |
| Staging | 3001 | `npm run dev:staging` |
| Production | 3000 | `npm run build` |

### Environment Files

- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env` - Local overrides (not committed)

### Available Environment Variables

```bash
# Server Configuration
VITE_PORT=8080                          # Server port

# API Endpoints
VITE_API_BASE_URL=http://localhost:8001       # Backend API
VITE_CHATBOT_API_URL=http://localhost:8000    # Chatbot API

# Feature Flags
VITE_ENABLE_ANALYTICS=false             # Enable analytics
VITE_ENABLE_DEBUG=true                  # Enable debug mode
```

## 🐳 Docker

### Development
```bash
docker compose up web-frontend
# Access at http://localhost:3001
```

### Production
```bash
docker compose -f docker-compose.base.yml -f docker-compose.production.yml up web-frontend
# Access at http://localhost:3100
```

## 🔌 API Integration

### Backend Services

The frontend connects to two backend services:

1. **EPR Backend** (Port 8001)
   - Authentication: `/api/v1/auth/*`
   - User Management: `/api/v1/users/*`
   - Subscriptions: `/api/v1/subscriptions/*`
   - Packages: `/api/v1/packages/*`

2. **Chatbot Service** (Port 8000)
   - Chat: `/api/v1/chat`
   - Conversations: `/api/v1/conversations/*`

### API Hooks

```typescript
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';
import { useSubscription } from '@/hooks/useSubscription';
import { useChatbot } from '@/hooks/useChatbot';

// Usage
const { user, login, logout } = useAuth();
const { packages } = usePackages();
const { subscription } = useSubscription();
const { conversations, sendMessage } = useChatbot();
```

## 📁 Project Structure

```
web/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API clients
│   ├── assets/         # Static assets
│   └── App.tsx         # Main app component
├── public/             # Public static files
├── .env.development    # Dev environment config
├── .env.staging        # Staging environment config
├── .env.production     # Production environment config
└── vite.config.ts      # Vite configuration
```

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **HTTP Client**: Fetch API
- **Animations**: GSAP

## 📝 Development Guidelines

### Port Management

**DO NOT hardcode ports** in component code. Always use environment variables:

```typescript
// ❌ Bad
const API_URL = "http://localhost:8001";

// ✅ Good
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

### CORS Configuration

Backend CORS is configured to allow:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:8080`

If you need a different port, update backend `CORS_ALLOWED_ORIGINS` environment variable.

### Environment-Specific Builds

To build for a specific environment:

```bash
# Development build (includes source maps, debug tools)
npm run build:dev

# Staging build (production-like, with debugging)
npm run build:staging

# Production build (optimized, no debugging)
npm run build
```

## 🔍 Troubleshooting

### Port Already in Use

If port 8080 is already in use, Vite will automatically try the next available port.

To force a specific port:
```bash
VITE_PORT=9000 npm run dev
```

### CORS Errors

1. Ensure backend is running on correct port (8001)
2. Check backend CORS configuration includes your frontend port
3. Verify `.env` file has correct API URLs

### API Connection Issues

1. Check backend services are running:
   ```bash
   docker ps | grep epr
   ```

2. Test API endpoints:
   ```bash
   curl http://localhost:8001/health
   curl http://localhost:8000/health
   ```

## 📚 Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
