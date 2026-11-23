#!/bin/bash
# SSL Certificate Setup Script for GMG Uganda
# Uses Let's Encrypt with Certbot

set -e

DOMAIN=${1:-"gmguganda.com"}
EMAIL=${2:-"admin@gmguganda.com"}
NGINX_SSL_DIR="/etc/nginx/ssl"

echo "=========================================="
echo "  GMG Uganda SSL Setup"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root (sudo)"
    exit 1
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Create SSL directory
mkdir -p $NGINX_SSL_DIR

# Obtain certificate
echo "Obtaining SSL certificate..."
certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d api.$DOMAIN \
    -d app.$DOMAIN

# Create symlinks for nginx config
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem $NGINX_SSL_DIR/fullchain.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem $NGINX_SSL_DIR/privkey.pem

# Generate DH parameters for extra security
if [ ! -f "$NGINX_SSL_DIR/dhparam.pem" ]; then
    echo "Generating DH parameters (this may take a while)..."
    openssl dhparam -out $NGINX_SSL_DIR/dhparam.pem 2048
fi

# Set up auto-renewal cron job
echo "Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "=========================================="
echo "  SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Uncomment SSL lines in nginx/gmg-uganda.conf"
echo "2. Run: nginx -t && systemctl reload nginx"
echo ""
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Auto-renewal: Enabled (daily at 3 AM)"
