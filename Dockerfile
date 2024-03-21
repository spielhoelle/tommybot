FROM node:18-alpine
LABEL org.opencontainers.image.source https://github.com/spielhoelle/tommybot
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV PUBLIC_OLLAMA_BASE_URL=${PUBLIC_OLLAMA_BASE_URL}
RUN pnpm build
EXPOSE 3000
CMD ["node", "build"]