FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY api/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY api/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gmgapi -u 1001

# Change ownership
RUN chown -R gmgapi:nodejs /app
USER gmgapi

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

EXPOSE 3010

CMD ["node", "server.js"]
