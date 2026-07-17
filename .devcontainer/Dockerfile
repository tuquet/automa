FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Cài đặt công cụ mạng và git nếu cần thiết
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends git curl xz-utils \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Bật pnpm qua corepack thay vì cài global
RUN corepack enable pnpm

# Khai báo cổng
EXPOSE 54321 54322 54323
