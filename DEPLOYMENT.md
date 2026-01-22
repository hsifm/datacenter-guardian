# Datacenter Inventory System - Air-Gapped Deployment Guide

This application is fully configured for deployment on air-gapped (offline) networks with no external dependencies.

## What's Bundled Locally

✅ **Fonts** - Inter and JetBrains Mono fonts are bundled in `/public/fonts/`  
✅ **Icons** - Lucide icons are bundled via npm (no CDN)  
✅ **All dependencies** - Vite bundles everything into static files  
✅ **No external API calls** - Uses mock data (or your local IPMI/iDRAC endpoints)

## Build for Production

```bash
# Install dependencies (requires npm packages to be pre-downloaded or use offline npm cache)
npm install

# Build static files
npm run build
```

This creates a `dist/` folder with all static assets.

## Deployment Options

### Option 1: Static File Server (Recommended)

Serve the `dist/` folder with any static file server:

```bash
# Using Node.js serve
npx serve dist

# Using Python
cd dist && python -m http.server 8080

# Using Nginx (see config below)
```

### Option 2: Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-internal-hostname;
    root /var/www/datacenter-inventory/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /fonts {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Offline npm Install

For fully air-gapped environments, pre-cache npm packages:

```bash
# On a machine with internet access:
npm pack <package-name>
# Or use npm-offline-mirror, Verdaccio, or Artifactory
```

## Future: IPMI/iDRAC Integration

To connect to real servers on your offline network:

1. Create a local API server that polls IPMI/Redfish endpoints
2. Update `src/data/mockServers.ts` to fetch from your local API
3. Or implement polling directly via edge functions (if using Supabase)

## Verification Checklist

- [ ] Build completes without errors
- [ ] Fonts render correctly (Inter for UI, JetBrains Mono for code)
- [ ] No network requests to external domains (check browser DevTools)
- [ ] Application loads without internet connection
