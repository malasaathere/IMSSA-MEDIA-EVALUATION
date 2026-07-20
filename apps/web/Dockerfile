FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# Copy root config and workspaces
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=web...

# Production serving image
FROM nginx:alpine AS runner

# Copy the build output to replace the default nginx contents.
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Copy custom nginx configuration if needed
# COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
