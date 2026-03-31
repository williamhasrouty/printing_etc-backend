# Production Deployment Guide - Printing Etc Backend

This guide provides step-by-step instructions for deploying the Printing Etc backend to a production environment using Google Cloud Platform, NGINX, PM2, and Let's Encrypt SSL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [MongoDB Setup](#mongodb-setup)
4. [Application Deployment](#application-deployment)
5. [NGINX Configuration](#nginx-configuration)
6. [SSL/TLS Certificate](#ssltls-certificate)
7. [PM2 Process Management](#pm2-process-management)
8. [Cloudinary Configuration](#cloudinary-configuration)
9. [Stripe Webhook Setup](#stripe-webhook-setup)
10. [Security Hardening](#security-hardening)
11. [Monitoring and Maintenance](#monitoring-and-maintenance)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the deployment, ensure you have:

- [ ] Google Cloud Platform account (or similar cloud provider)
- [ ] Domain name registered and DNS access
- [ ] MongoDB Atlas account (or self-hosted MongoDB)
- [ ] Cloudinary account with API credentials
- [ ] Stripe account with live API keys
- [ ] GitHub repository for your code
- [ ] Basic knowledge of Linux command line

---

## Server Setup

### 1. Create Virtual Machine

**Using Google Cloud Platform:**

```bash
# Create a VM instance (adjust based on your needs)
gcloud compute instances create printing-etc-backend \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server
```

**Recommended Specifications:**

- **CPU:** 2 vCPUs
- **Memory:** 4GB RAM
- **Storage:** 20GB SSD
- **OS:** Ubuntu 22.04 LTS

### 2. Connect to Your Server

```bash
# SSH into your VM
gcloud compute ssh printing-etc-backend --zone=us-central1-a

# Or if using other providers
ssh your-username@your-server-ip
```

### 3. Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl git
```

### 4. Install Node.js

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js LTS version
nvm install --lts
nvm use --lts

# Verify installation
node --version  # Should show v20.x.x or later
npm --version   # Should show v10.x.x or later
```

### 5. Configure Firewall

```bash
# Allow SSH (port 22)
sudo ufw allow 22/tcp

# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

**For Google Cloud:**

```bash
# Create firewall rules
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server
```

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. **Create Cluster:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier available)
   - Choose a region close to your server

2. **Configure Network Access:**

   ```
   - Database Access → Add New Database User
   - Network Access → Add IP Address → Add Current IP Address
   - Or whitelist your server's public IP
   ```

3. **Get Connection String:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/printingetc?retryWrites=true&w=majority
   ```

### Option 2: Self-Hosted MongoDB

```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

---

## Application Deployment

### 1. Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/printing-etc-backend
sudo chown $USER:$USER /var/www/printing-etc-backend
cd /var/www/printing-etc-backend
```

### 2. Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/printing_etc-backend.git .

# Or if using SSH
git clone git@github.com:YOUR_USERNAME/printing_etc-backend.git .
```

### 3. Install Dependencies

```bash
# Install production dependencies
npm ci --production
```

### 4. Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=3002

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/printingetc?retryWrites=true&w=majority

# JWT Secret (generate a strong random key)
JWT_SECRET=your-production-jwt-secret-key-min-32-chars

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration (LIVE KEYS - not test)
STRIPE_SECRET_KEY=sk_live_your-live-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret

# Frontend URL
FRONTEND_URL=https://www.printingetc.com

# Allowed Origins for CORS
ALLOWED_ORIGINS=https://www.printingetc.com,https://printingetc.com
```

**Security Notes:**

- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Use LIVE Stripe keys for production
- Never commit `.env` file to version control
- Restrict file permissions: `chmod 600 .env`

### 5. Test Application

```bash
# Test that the application starts
npm start

# You should see:
# Server is running on port 3002
# Connected to MongoDB

# Stop with Ctrl+C
```

---

## NGINX Configuration

### 1. Install NGINX

```bash
# Install NGINX
sudo apt install -y nginx

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify NGINX is running
sudo systemctl status nginx
```

### 2. Create NGINX Configuration

```bash
# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create new configuration
sudo nano /etc/nginx/sites-available/printing-etc-backend
```

Add the following configuration:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream backend
upstream printing_etc_backend {
    server localhost:3002;
    keepalive 64;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.printingetc.com;

    # Let's Encrypt challenge
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.printingetc.com;

    # SSL Certificates (will be configured by Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.printingetc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.printingetc.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client body size (for file uploads)
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/printing-etc-backend-access.log;
    error_log /var/log/nginx/printing-etc-backend-error.log;

    # Proxy settings
    location / {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy headers
        proxy_pass http://printing_etc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Stripe webhook endpoint (no rate limiting)
    location /payment/webhook {
        proxy_pass http://printing_etc_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://printing_etc_backend;
    }
}
```

### 3. Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/printing-etc-backend /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# If successful, reload NGINX
sudo systemctl reload nginx
```

---

## SSL/TLS Certificate

### 1. Install Certbot

```bash
# Install Certbot and NGINX plugin
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Configure DNS

Before obtaining SSL certificate, configure your domain DNS:

```
Type: A Record
Name: api (or your subdomain)
Value: YOUR_SERVER_IP
TTL: 3600
```

Wait a few minutes for DNS propagation. Verify:

```bash
nslookup api.printingetc.com
```

### 3. Obtain SSL Certificate

```bash
# Obtain certificate (follow prompts)
sudo certbot --nginx -d api.printingetc.com

# Certbot will:
# 1. Verify domain ownership
# 2. Obtain certificate
# 3. Update NGINX configuration
# 4. Set up auto-renewal
```

### 4. Test Auto-Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Certificate will auto-renew before expiration
```

### 5. Verify SSL

Visit your API URL in browser:

```
https://api.printingetc.com
```

You should see a secure connection (lock icon) and valid certificate.

---

## PM2 Process Management

### 1. Install PM2

```bash
# Install PM2 globally
npm install -g pm2
```

### 2. Create PM2 Ecosystem File

```bash
# Create ecosystem configuration
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [
    {
      name: "printing-etc-backend",
      script: "./app.js",
      instances: 2, // Use multiple instances (cluster mode)
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      exp_backoff_restart_delay: 100,
    },
  ],
};
```

### 3. Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs printing-etc-backend

# Monitor application
pm2 monit
```

### 4. Configure PM2 Startup

```bash
# Generate startup script
pm2 startup systemd

# This will output a command like:
# sudo env PATH=$PATH:/home/username/.nvm/versions/node/v20.x.x/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username

# Copy and run the generated command
# Then save PM2 process list
pm2 save
```

### 5. PM2 Useful Commands

```bash
# Restart application
pm2 restart printing-etc-backend

# Stop application
pm2 stop printing-etc-backend

# Delete from PM2
pm2 delete printing-etc-backend

# View real-time logs
pm2 logs printing-etc-backend --lines 100

# Monitor CPU and memory
pm2 monit

# Show detailed info
pm2 show printing-etc-backend
```

---

## Cloudinary Configuration

### 1. Production Settings

Ensure your Cloudinary account is properly configured:

1. **Go to Cloudinary Dashboard:**
   - https://cloudinary.com/console

2. **Configure Upload Presets:**

   ```
   Settings → Upload → Add upload preset
   - Preset name: printing_etc_uploads
   - Signing Mode: Signed
   - Folder: printing-etc/products
   - Access Mode: public
   ```

3. **Set Resource Limits:**

   ```
   - Max file size: 50MB
   - Allowed formats: jpg, png, pdf, ai, psd
   - Auto-backup: Enabled
   ```

4. **Configure Transformations:**
   ```
   - Auto-optimize: Enabled
   - Auto-format: Enabled
   - Quality: auto:good
   ```

### 2. Verify Integration

Test file upload through your API:

```bash
curl -X POST https://api.printingetc.com/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-image.jpg"
```

---

## Stripe Webhook Setup

### 1. Configure Production Webhook

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Add Endpoint:**

   ```
   URL: https://api.printingetc.com/payment/webhook
   Events to send:
     - checkout.session.completed
     - checkout.session.expired
     - payment_intent.succeeded
     - payment_intent.payment_failed
   ```

3. **Copy Webhook Secret:**

   ```
   Signing secret: whsec_xxxxx...
   ```

4. **Add to .env:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
   ```

### 2. Test Webhook

```bash
# Trigger a test event from Stripe Dashboard
# Check your application logs
pm2 logs printing-etc-backend

# You should see webhook events being processed
```

### 3. Monitor Webhooks

Regularly check Stripe Dashboard for:

- Webhook delivery success rate
- Failed webhook deliveries
- Response times

---

## Security Hardening

### 1. Enable Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create NGINX jail
sudo nano /etc/fail2ban/jail.local
```

Add:

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/*-error.log
maxretry = 5
findtime = 600
bantime = 3600
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status
```

### 2. Configure Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/printing-etc-backend
```

Add:

```
/var/www/printing-etc-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 www-data www-data
}
```

### 3. Regular Security Updates

```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Secure SSH

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

Update:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change from default 22
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

### 5. Setup Monitoring Alerts

Consider setting up:

- **UptimeRobot** - Monitor uptime (https://uptimerobot.com)
- **Sentry** - Error tracking (https://sentry.io)
- **DataDog** - Infrastructure monitoring (https://www.datadoghq.com)

---

## Monitoring and Maintenance

### 1. Application Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs --lines 50

# Monitor resources
pm2 monit

# Check application metrics
pm2 web  # Access dashboard at http://localhost:9615
```

### 2. NGINX Monitoring

```bash
# Check NGINX status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/printing-etc-backend-access.log

# View error logs
sudo tail -f /var/log/nginx/printing-etc-backend-error.log

# Check for configuration errors
sudo nginx -t
```

### 3. System Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check network connections
sudo netstat -tulpn | grep :3002
```

### 4. Database Monitoring

**For MongoDB Atlas:**

- Check cluster metrics in Atlas dashboard
- Review slow queries
- Monitor connection count
- Set up alerts for high resource usage

**For Self-Hosted:**

```bash
# Connect to MongoDB
mongosh

# Check database stats
use printingetc
db.stats()

# Check collection stats
db.orders.stats()
db.products.stats()

# View current operations
db.currentOp()
```

### 5. Backup Strategy

**MongoDB Backup (Atlas):**

- Enable automated backups in Atlas
- Schedule: Daily snapshots
- Retention: 7 days

**MongoDB Backup (Self-Hosted):**

```bash
# Create backup script
nano ~/backup-mongodb.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --out=$BACKUP_DIR/backup_$DATE --gzip
# Delete backups older than 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
# Make executable
chmod +x ~/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/username/backup-mongodb.sh
```

**Application Files Backup:**

```bash
# Backup uploaded files directory if storing locally
# Or rely on Cloudinary for backup
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs printing-etc-backend --err

# Check if port is in use
sudo lsof -i :3002

# Check environment variables
pm2 env 0  # Replace 0 with your app ID

# Test application directly
cd /var/www/printing-etc-backend
node app.js
```

### Database Connection Issues

```bash
# Check MongoDB status (if self-hosted)
sudo systemctl status mongod

# Test connection
mongosh "YOUR_MONGODB_URI"

# Check firewall
sudo ufw status

# For Atlas: Verify IP whitelist
```

### NGINX Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Verify NGINX is running
sudo systemctl status nginx

# Restart NGINX
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Renew manually
sudo certbot renew

# Check certificate files
sudo ls -la /etc/letsencrypt/live/api.printingetc.com/
```

### High Memory Usage

```bash
# Check memory usage
free -m
pm2 monit

# Restart application
pm2 restart printing-etc-backend

# Adjust PM2 memory limit
pm2 delete printing-etc-backend
# Edit ecosystem.config.js - increase max_memory_restart
pm2 start ecosystem.config.js
```

### Stripe Webhook Failures

```bash
# Check PM2 logs for webhook errors
pm2 logs printing-etc-backend | grep webhook

# Verify webhook secret in .env
cat .env | grep STRIPE_WEBHOOK_SECRET

# Check Stripe Dashboard for webhook delivery attempts
# Ensure NGINX is not blocking webhook route

# Test webhook manually
curl -X POST https://api.printingetc.com/payment/webhook \
  -H "stripe-signature: test" \
  -d '{}'
```

### File Upload Issues

```bash
# Check Cloudinary credentials
cat .env | grep CLOUDINARY

# Verify file permissions
ls -la /var/www/printing-etc-backend/uploads

# Check NGINX client_max_body_size
sudo grep client_max_body_size /etc/nginx/sites-available/printing-etc-backend

# Test upload endpoint
curl -X POST https://api.printingetc.com/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] MongoDB database created
- [ ] Cloudinary account configured
- [ ] Stripe account in live mode
- [ ] Domain name configured and DNS propagated

### Server Setup

- [ ] VM created and accessible via SSH
- [ ] System packages updated
- [ ] Node.js installed
- [ ] Firewall configured
- [ ] NGINX installed
- [ ] PM2 installed

### Application Setup

- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env file created with production values
- [ ] Application starts successfully
- [ ] Database connection verified

### NGINX & SSL

- [ ] NGINX configuration created
- [ ] SSL certificate obtained
- [ ] HTTPS redirect working
- [ ] Security headers configured
- [ ] File upload size limit set

### Process Management

- [ ] PM2 ecosystem file created
- [ ] Application running in PM2
- [ ] PM2 startup configured
- [ ] Logs accessible via PM2

### External Services

- [ ] Cloudinary integration tested
- [ ] Stripe webhook configured
- [ ] Stripe webhook secret in .env
- [ ] CORS origins configured

### Security

- [ ] Fail2Ban configured
- [ ] SSH hardened
- [ ] Log rotation configured
- [ ] Automatic security updates enabled

### Monitoring

- [ ] Uptime monitoring configured
- [ ] Error tracking set up
- [ ] Backup strategy implemented
- [ ] Alert notifications configured

### Testing

- [ ] API endpoints accessible via HTTPS
- [ ] User signup/login working
- [ ] Product CRUD operations working
- [ ] File upload working
- [ ] Order creation working
- [ ] Payment flow working
- [ ] Webhook receiving events

### Post-Deployment

- [ ] Frontend updated with production API URL
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Monitor logs for errors
- [ ] Test all critical user flows

---

## Additional Resources

### Documentation

- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

### Support

For issues or questions:

1. Check application logs: `pm2 logs`
2. Check NGINX logs: `/var/log/nginx/`
3. Review documentation above
4. Check Stripe Dashboard for payment issues
5. Check MongoDB Atlas alerts

---

## Version History

- **v1.0.0** - Initial production deployment guide
- **Updated:** March 2026

---

**Note:** This guide assumes deployment to Google Cloud Platform with Ubuntu 22.04 LTS. Adjust commands and paths according to your specific cloud provider or operating system.
