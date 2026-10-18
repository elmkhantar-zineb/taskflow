FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

HEALTHCHECK --interval=15s \
            --timeout=5s \
            --start-period=3s \
            --retries=3 \ 
            CMD [ "node", "-e", "fetch('http://127.0.0.1:3000/health/live').then(r => { process.exit(r.ok ? 0 : 1) }).catch(() => process.exit(1))"]


STOPSIGNAL SIGTERM

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]