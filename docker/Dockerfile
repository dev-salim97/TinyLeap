# Build stage
FROM node:20-slim AS build

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 设置 pnpm 国内镜像
RUN pnpm config set registry https://registry.npmmirror.com

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments
ARG VITE_LLM_API_KEY
ARG VITE_LLM_BASE_URL
ARG VITE_LLM_MODEL

# Build the app
RUN pnpm build

# Production stage
FROM nginx:stable-alpine

# Copy nginx config (Path updated to point to docker folder)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
