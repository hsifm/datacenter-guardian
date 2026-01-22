# Datacenter Inventory System - Air-Gapped Deployment Guide

This application is fully configured for deployment on air-gapped (offline) networks with no external dependencies.

## What's Bundled Locally

✅ **Fonts** - Inter and JetBrains Mono fonts are bundled in `/public/fonts/`  
✅ **Icons** - Lucide icons are bundled via npm (no CDN)  
✅ **All dependencies** - Vite bundles everything into static files  
✅ **No external API calls** - Uses mock data (or your local IPMI/iDRAC endpoints)

---

## Quick Start with Docker

### Option 1: Build on a machine with internet, transfer image

```bash
# On a machine WITH internet access:

# 1. Clone/download the project
git clone <your-repo-url>
cd datacenter-inventory

# 2. Build the Docker image
docker build -t datacenter-inventory:latest .

# 3. Save the image to a tar file
docker save datacenter-inventory:latest -o dc-inventory.tar

# 4. Transfer dc-inventory.tar to your air-gapped network (USB, etc.)
```

```bash
# On your AIR-GAPPED network:

# 1. Load the image
docker load -i dc-inventory.tar

# 2. Run the container
docker run -d \
  --name dc-inventory \
  --restart unless-stopped \
  -p 8080:80 \
  datacenter-inventory:latest

# 3. Access at http://<server-ip>:8080
```

### Option 2: Use Docker Compose

```bash
# If you have docker-compose on your air-gapped network:

# 1. Transfer the entire project folder
# 2. Build and run:
docker-compose up -d

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
