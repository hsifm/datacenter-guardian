# Datacenter Inventory System - Air-Gapped Deployment Guide

This application is fully configured for deployment on air-gapped (offline) networks with no external dependencies.

## What's Bundled Locally

✅ **Fonts** - Inter and JetBrains Mono fonts are bundled in `/public/fonts/`  
✅ **Icons** - Lucide icons are bundled via npm (no CDN)  
✅ **All dependencies** - Vite bundles everything into static files  
✅ **No external API calls** - Uses mock data (or your local IPMI/iDRAC endpoints)

---

## Quick Start with Docker Compose (Recommended)

This runs both the app and the Redfish CORS proxy together:

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Check status
docker compose ps

# Stop all services
docker compose down
```

**Access points:**
- **App:** http://localhost:8080
- **Proxy:** http://localhost:8443

**Configure proxy URL in your browser (once, after app loads):**
```javascript
localStorage.setItem('redfishProxyUrl', 'http://YOUR_HOST_IP:8443');
```

---

## Air-Gapped Deployment

### Step 1: Build images on a machine WITH internet

```bash
# Clone/download the project
git clone <your-repo-url>
cd datacenter-inventory

# Build both images
docker compose build

# Save images to tar files
docker save datacenter-inventory:latest -o dc-inventory.tar
docker save redfish-proxy:latest -o redfish-proxy.tar

# Transfer both .tar files to your air-gapped network (USB, etc.)
```

### Step 2: Load and run on AIR-GAPPED network

```bash
# Load the images
docker load -i dc-inventory.tar
docker load -i redfish-proxy.tar

# Run using docker compose (if available)
docker compose up -d

# OR run manually:
docker network create dc-network

docker run -d \
  --name redfish-proxy \
  --restart unless-stopped \
  --network dc-network \
  -p 8443:8443 \
  redfish-proxy:latest

docker run -d \
  --name dc-inventory \
  --restart unless-stopped \
  --network dc-network \
  -p 8080:80 \
  datacenter-inventory:latest

# Access at http://<server-ip>:8080
```

### Option 3: Pre-built with offline npm cache

```bash
# On a machine WITH internet:

# 1. Install dependencies and create cache
npm ci

# 2. Create a tarball of node_modules
tar -czf node_modules.tar.gz node_modules

# 3. Transfer project + node_modules.tar.gz to air-gapped network
```

```bash
# On AIR-GAPPED network:

# 1. Extract node_modules
tar -xzf node_modules.tar.gz

# 2. Build
npm run build

# 3. Serve the dist folder (see below)
```

---

## Manual Build (No Docker)

```bash
# Install dependencies (requires npm packages pre-downloaded)
npm install

# Build static files
npm run build
```

This creates a `dist/` folder with all static assets.

---

## Serving the Built Application

### Using Python (Quick Test)
```bash
cd dist && python -m http.server 8080
```

### Using Node.js serve
```bash
npx serve dist -l 8080
```

### Using Nginx

Copy the `nginx.conf` file included in this project, then:

```bash
# Copy built files
cp -r dist/* /var/www/datacenter-inventory/

# Copy nginx config
cp nginx.conf /etc/nginx/conf.d/datacenter-inventory.conf

# Reload nginx
nginx -s reload
```

---

## Connecting to IPMI/iDRAC/Redfish

### Browser CORS Limitation

Browsers block direct API calls to different origins (like your BMC IPs). Solutions:

#### Solution A: Configure BMC to allow CORS (if supported)
Some iDRAC/iLO versions allow configuring CORS headers in their web interface.

#### Solution B: Use a local proxy (recommended)

Create a simple proxy service that runs on your internal network:

```javascript
// proxy/server.js - Simple Redfish proxy
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Disable SSL verification for self-signed BMC certs
const agent = new https.Agent({ rejectUnauthorized: false });

app.all('/proxy/*', async (req, res) => {
  const targetUrl = req.params[0];
  const authHeader = req.headers.authorization;
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      agent,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Proxy running on :3001'));
```

Then update the RedfishClient to use the proxy URL.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| (none currently) | - | All config stored in browser localStorage |

---

## Verification Checklist

- [ ] Docker image builds successfully
- [ ] Container starts and responds on port 8080
- [ ] Fonts render correctly (Inter for UI, JetBrains Mono for code)
- [ ] No network requests to external domains (check browser DevTools)
- [ ] Can add server connections and see them persist
- [ ] Application loads without internet connection

---

## Troubleshooting

### "Cannot connect to server" errors
- Check if CORS is blocking requests (see proxy solution above)
- Verify BMC IP is reachable from the Docker host
- Check BMC credentials are correct

### Container won't start
```bash
# Check logs
docker logs dc-inventory

# Check if port 8080 is already in use
netstat -tlnp | grep 8080
```

### Fonts not loading
- Verify `/fonts/` directory exists in the container
- Check nginx config includes font MIME types
