FROM oven/bun:1.2 AS base

WORKDIR /app

# Install cloudflared
RUN apt-get update && apt-get install -y curl && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
      -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared && \
    cloudflared --version

# Copy everything
COPY . .

# Install dependencies
RUN bun install

# FORCE Nitro build explicitly
RUN bunx nuxi build

# Debug what was actually built
RUN echo "=== Contents of app ===" && ls -la /app/
RUN echo "=== Contents of .output ===" && ls -la .output/ || echo "No .output folder"
RUN echo "=== Contents of .output/server ===" && ls -la .output/server/ || echo "No .output/server folder"
RUN echo "=== Looking for nitro.json ===" && find /app -name "nitro.json" -type f || echo "No nitro.json found"

# Set NODE_ENV for production
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

EXPOSE 3000

# THE FIX: Use node to run the built server directly
CMD sh -c "cloudflared tunnel run --token $CF_TUNNEL_TOKEN & cd /app && node .output/server/index.mjs"
