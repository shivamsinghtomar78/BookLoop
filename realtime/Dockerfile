FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV REALTIME_PORT=4001

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY server.ts ./

USER node
EXPOSE 4001
CMD ["node", "server.ts"]
