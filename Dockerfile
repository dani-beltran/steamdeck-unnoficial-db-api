# Use Node.js LTS version as base image (Debian-based for Playwright compatibility)
FROM node:24-slim

# Install MongoDB Database Tools (supports both arm64 and amd64)
ARG TARGETARCH
RUN apt-get update && apt-get install -y wget libgssapi-krb5-2 libkrb5-3 libk5crypto3 libkrb5support0 libkeyutils1 && \
    if [ "$TARGETARCH" = "arm64" ]; then \
        MONGO_TOOLS_URL="https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-arm64-100.14.0.deb"; \
    else \
        MONGO_TOOLS_URL="https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-x86_64-100.14.0.deb"; \
    fi && \
    wget $MONGO_TOOLS_URL -O mongodb-database-tools.deb && \
    dpkg -i mongodb-database-tools.deb && \
    rm mongodb-database-tools.deb && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Install Playwright browser for scraping jobs
RUN npx playwright install --with-deps chromium

# Copy source code and configuration
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port 8080
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080

# Start the application
CMD ["node", "dist/index.js"]
