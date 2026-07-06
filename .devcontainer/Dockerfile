FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Cài đặt công cụ mạng và git nếu cần thiết
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends git curl xz-utils

# Cài đặt pnpm global
RUN npm install -g pnpm

# Khai báo cổng
EXPOSE 54321 54322 54323
