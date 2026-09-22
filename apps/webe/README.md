<img src="src/assets/images/icon-128.png" width="64"/>

# Automa
<p>
  <img alt="Automa latest version" src="https://img.shields.io/github/package-json/v/AutomaApp/automa" />
  <a href="https://twitter.com/AutomaApp">
    <img alt="Follow Us on Twitter" src="https://img.shields.io/twitter/follow/AutomaApp?style=social" />
  </a>
  <a href="https://discord.gg/C6khwwTE84">
    <img alt="Chat with us on Discord" src="https://img.shields.io/discord/942211415517835354?label=join%20discord&logo=Discord&logoColor=white" />
  </a>
</p>

An extension for automating your browser by connecting blocks. <br />
Auto-fill forms, do a repetitive task, take a screenshot, or scrape website data — the choice is yours. You can even schedule when the automation will execute!

## Downloads
<table cellspacing="0" cellpadding="0">
  <tr>
    <td valign="center">
      <a align="center" href="https://chrome.google.com/webstore/detail/automa/infppggnoaenmfagbfknfkancpbljcca">
        <img src="https://user-images.githubusercontent.com/22908993/166417152-f870bfbd-1770-4c28-b69d-a7303aebc9a6.png" alt="Chrome web store" />
        <p align="center">Chrome Web Store</p>
      </a>
    </td>
    <td valign="center">
      <a href="https://addons.mozilla.org/en-US/firefox/addon/automa/">
        <img src="https://user-images.githubusercontent.com/22908993/166417727-3481fef4-00e5-4cf0-bb03-27fb880d993c.png" alt="Firefox add-ons" />
        <p align="center">Firefox Add-ons</p>
      </a>
    </td>
  </tr>
</table>

## Marketplace
Browse the Automa marketplace where you can share and download workflows with others. [Go to the marketplace &#187;](https://extension.automa.site/marketplace)

## Automa Chrome Extension Builder
Automa Chrome Extension Builder (Automa CEB for short) allows you to generate a standalone chrome extension based on Automa workflows. [Go to the documentation &#187;](https://docs.extension.automa.site/extension-builder)


## Project setup
Before running the `yarn dev` or `yarn build` script, you need to create the `getPassKey.js` file in the `src/utils` directory.  Inside the file write

```js
export default function() {
  return 'anything-you-want';
}
```

```bash
# Install dependencies
pnpm install

# Compiles and hot-reloads for development for the chrome browser
pnpm dev

# Compiles and minifies for production for the chrome browser
pnpm build

# Create a zip file from the build folder
pnpm build:zip

# Compiles and hot-reloads for development for the firefox browser
pnpm dev:firefox

# Compiles and minifies for production for the firefox browser
pnpm build:firefox

# Lints and fixes files
pnpm lint
```

### Icon Preview
v-remixicon/icons: https://preview-v-remixicon.vercel.app/

### Install Locally
#### Chrome
1. Open chrome and navigate to extensions page using this URL: chrome://extensions.
2. Enable the "Developer mode".
3. Click "Load unpacked extension" button, browse the `automa/build` directory and select it.

![Install in chrome](https://user-images.githubusercontent.com/22908993/166417152-f870bfbd-1770-4c28-b69d-a7303aebc9a6.png)

### Firefox
1. Open firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click the "Load Temporary Add-on" button.
3. Browse the `automa/build` directory and select the `manifest.json` file.

![Install in firefox](https://user-images.githubusercontent.com/22908993/166417727-3481fef4-00e5-4cf0-bb03-27fb880d993c.png)

## Contributors
Thanks to everyone who has submitted issues, made suggestions, and generally helped make this a better project.

<a href="https://github.com/AutomaApp/automa/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AutomaApp/automa" />
</a>

## 🏛️ KIẾN TRÚC `automa-webe:runner` VS `automa-webe:studio` (2 REUSABLE BUILD TARGETS)

`automa-webe` cung cấp 2 gói artifact cốt lõi tái sử dụng cho toàn bộ hệ sinh thái (`automa-core`, `automa-vsce`, `automa-desk`):

| Chiều So Sánh | `automa-webe:runner` (Headless Engine) | `automa-webe:studio` (Visual Canvas) |
| :--- | :--- | :--- |
| **Artifact Output** | `dist/cli-runner` | `dist/studio` |
| **Lệnh Đóng Gói** | `pnpm run build:runner` (`webpack.runner.config.js`) | `pnpm run build:studio` (`webpack.studio.config.js`) |
| **Bản Chất Kỹ Thuật** | **Headless Browser Execution Engine**: Extension MV3 chạy ngầm trong Chromium (Headless/Headful) | **Standalone Web Canvas Application**: Ứng dụng Web SPA độc lập dựng trên Vue 3 & `@vue-flow/core` |
| **Ngữ Cảnh Thực Thi** | Chạy trong Chrome Offscreen Document (`offscreen.html`) để thực thi 61 DOM automation block handlers | Phục vụ trực tiếp qua HTTP bởi Daemon tại `http://127.0.0.1:8765/studio/` hoặc nhúng qua iframe vào Custom Editor VS Code |
| **Giao Thức Giao Tiếp** | Kết nối 1 chiều qua SSE (`/api/v1/internal/worker/events`) để nhận jobs và stream kết quả thực thi | Kết nối REST API (`/api/v1/...`) cho CRUD/Linting, SSE (`/api/events`) cho live logs, và 2-way postMessage Host Bridge |
| **Quy Tắc Tái Sử Dụng** | `automa-core` sideload trực tiếp khi chạy jobs. Tuyệt đối không duplicate mã nguồn runner. | `automa-vsce` và `automa-desk` nhúng trực tiếp làm UI Canvas chính. Tuyệt đối không duplicate canvas. |

---

## 📚 BẢNG THUẬT NGỮ CỐT LÕI (CANONICAL TERMINOLOGY)

| Thuật Ngữ Chuẩn (Canonical Term) | Thành Phần Code Đại Diện | Mô Tả Kỹ Thuật Ngắn Gọn |
| :--- | :--- | :--- |
| **`automa-webe:runner`** | `dist/cli-runner`, `inject-offscreen.js` | Headless Execution Engine đóng gói sẵn cho automa-core sideload vào Chromium. |
| **`automa-webe:studio`** | `dist/studio`, `StudioApp.vue` | Standalone Web Canvas Studio phục vụ kịch bản đồ họa và nhúng vào VS Code/Desktop. |
| **Automa Studio** | `StudioApp.vue`, `studio-entry.js` | Ứng dụng Web Standalone độc lập dựng trên Vue 3 & `@vue-flow/core`, cho phép kéo thả thiết kế workflow và chỉnh sửa node trực quan. |
| **Block** | `BlockBase.vue`, `Edit<Name>.vue` | Khối chức năng cơ bản trong workflow (như `trigger`, `new-tab`, `click-element`), chứa metadata, inputs, outputs và form cấu hình. |
| **Drawflow** | `workflow.drawflow`, `getNodes`/`getEdges` | Cấu trúc dữ liệu JSON biểu diễn đồ thị luồng gồm danh sách `nodes` (toạ độ x/y, blockId, data) và `edges` (đường nối giữa các handles). |
| **Offscreen Document** | `offscreen.html`, `WorkflowEngine.js` | Ngữ cảnh DOM ẩn chạy ngầm trong Chrome MV3, đóng vai trò engine thực thi workflow và xử lý Javascript sandbox an toàn. |
| **Service Worker** | `background/index.js` | Điểm nhập trung tâm của Extension xử lý message routing (`MessageListener`), nhận lệnh SSE từ Rust Daemon và kích hoạt Offscreen. |
| **Two-way Data Binding** | `v-model:data`, `updateBlockData` | Cơ chế đồng bộ dữ liệu hai chiều tức thì giữa form cấu hình `WorkflowEditBlock.vue` và dữ liệu node trên canvas `workflow.drawflow`. |
| **Smart Live Reload** | `pollBundleUpdate` | Cơ chế tự động thăm dò header `Last-Modified`/`ETag` của `studio.bundle.js` để tự làm mới trang ngay khi Webpack watch compile xong. |
| **AppLogs** | `AppLogs.vue`, `src/db/logs.js` | Hệ thống quản lý nhật ký thực thi 3 tab (Timeline block, Table Data, Variables) đồng bộ trực tiếp với SQLite DB qua Daemon API. |
| **Singleton Guard** | `isWorkerDaemonInitialized` | Cờ Singleton đảm bảo chỉ duy nhất 1 kết nối SSE reader loop hoạt động trong suốt vòng đời trình duyệt để tránh chạy trùng lặp tác vụ. |

---

## License
Source code in this repository is variously licensed under the GNU Affero General Public License (AGPL), or the [Automa Commercial License](https://extension.automa.site/license/commercial/).

See [LICENSE.txt](./LICENSE.txt) for details.

