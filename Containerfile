FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@11.0.8 --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY client/package.json client/tsconfig.json client/vite.config.ts client/index.html client/
COPY server/package.json server/tsconfig.json server/tsconfig.build.json server/nest-cli.json server/

RUN pnpm install --frozen-lockfile

# Build client
COPY client/src client/src/
COPY client/public client/public/
RUN find client/src -name "*.test.tsx" -delete && rm -f client/src/test-utils.tsx
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter cabbagemeet-client build

# Build server
COPY server/src server/src/
COPY server/migrations server/migrations/
RUN find server/src -name "*.spec.ts" -delete
RUN pnpm --filter cabbagemeet-server build

FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@11.0.8 --activate
WORKDIR /app

COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/package.json ./
COPY --from=build /app/server/package.json server/
RUN pnpm install --frozen-lockfile --prod --filter cabbagemeet-server

COPY --from=build /app/server/dist dist/
COPY --from=build /app/server/migrations migrations/
COPY --from=build /app/client/dist client/

ENV NODE_ENV=production
CMD ["node", "dist/src/main"]
