FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Cài đặt công cụ mạng, git và các thư viện C++/GTK cho Tauri & Puppeteer
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        git curl xz-utils wget file \
        libwebkit2gtk-4.0-dev build-essential libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev \
        libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgbm1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Bật pnpm qua corepack thay vì cài global
RUN corepack enable pnpm

# Khai báo cổng
EXPOSE 3001 6080 54321 54322 54323 54324
