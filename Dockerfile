FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.33.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm config set registry https://registry.npmmirror.com \
    && pnpm install --frozen-lockfile

COPY public ./public
COPY scripts ./scripts
COPY src ./src
COPY postcss.config.mjs ./
COPY rsbuild.config.ts ./
COPY tsconfig.json ./

RUN pnpm run build

FROM caddy:2-builder AS caddy-builder

ENV GOPROXY=https://goproxy.cn,direct

RUN xcaddy build \
    --with github.com/mholt/caddy-ratelimit

FROM caddy:2-alpine

COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
