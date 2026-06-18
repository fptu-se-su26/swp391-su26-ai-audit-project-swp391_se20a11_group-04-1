FROM node:24-slim
WORKDIR /app

# Cài Playwright với browsers
RUN npx -y playwright@1.60.0 install --with-deps chromium

# Cài dependencies
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:4001/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
