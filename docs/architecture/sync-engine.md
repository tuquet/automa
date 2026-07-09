# Automa Sync Engine Architecture (Manifest V3)

Tài liệu này mô tả chi tiết kiến trúc đồng bộ dữ liệu lên Cloud (Supabase) của Automa Extension, tuân thủ nghiêm ngặt giới hạn vòng đời của Service Worker trong Manifest V3.

## 1. Vấn đề của Manifest V3
Trong Manifest V3, Chrome không cho phép chạy các tiến trình ngầm vĩnh viễn (`setInterval` sẽ bị tắt khi Service Worker đi ngủ sau ~30 giây đến 5 phút không tương tác). 
Nếu dùng Polling (quét định kỳ bằng `setInterval`) để đẩy dữ liệu lên Cloud:
1. CPU lãng phí vô ích khi rảnh rỗi.
2. Background dễ bị Chrome kill giữa chừng.
3. Không real-time (dữ liệu phải chờ chu kỳ quét).

## 2. Giải pháp: Event-Driven Sync (Kích hoạt bằng sự kiện)
Thay vì Background tự đi hỏi "Có data mới không?", chúng ta đảo ngược quy trình: **Giao diện/Database chủ động đánh thức Background mỗi khi có data mới.**

### 2.1. Lớp Database (Người đánh thức)
File: `src/db/storage.js`

Mọi thao tác đẩy data lên Cloud trong Automa đều phải thông qua hàng đợi `syncQueue` (bảng IndexedDB). 
Để không phải sửa thủ công hàng tá file Vue UI, chúng ta sử dụng kỹ thuật **Monkey-Patching** (bọc lại hàm) các phương thức ghi của Dexie (`add`, `put`, `bulkAdd`, `bulkPut`).

```javascript
// Ví dụ Monkey-patching
const originalSyncQueueAdd = dbStorage.syncQueue.add.bind(dbStorage.syncQueue);
dbStorage.syncQueue.add = async function (...args) {
  const result = await originalSyncQueueAdd(...args);
  if (typeof browser !== 'undefined' && browser.runtime) {
    // Kích hoạt tín hiệu đánh thức Background
    browser.runtime.sendMessage({ name: 'background--TRIGGER_SYNC' }).catch(() => {});
  }
  return result;
};
```
Nhờ vậy, lưới được giăng 100%: Dù thao tác lưu 1 file hay Import 1000 file, `syncQueue` luôn phát ra tín hiệu `background--TRIGGER_SYNC`.

### 2.2. Lớp Message Listener (Trạm thu sóng)
File: `src/background/index.js`

Bắt sự kiện từ Database và chuyển lệnh cho Sync Engine.
```javascript
message.on('background--TRIGGER_SYNC', () => {
  backgroundSyncEngine.triggerSync();
});
```

### 2.3. Lớp Engine (Bộ não xử lý & Chống Spam)
File: `src/background/BackgroundSyncEngine.js`

Để tránh trường hợp người dùng thao tác liên tục (Spam) tạo ra hàng trăm request mạng, Engine áp dụng kỹ thuật **Debounce (1 giây)**. Nó sẽ chờ đến khi không còn tín hiệu nào tới trong 1 giây nữa thì mới gom lại gửi 1 lần.

```javascript
triggerSync() {
  if (this.syncTimeout) clearTimeout(this.syncTimeout);
  this.syncTimeout = setTimeout(() => {
    this.pushOutbox().catch(console.error);
  }, 1000); // <-- Debounce 1s
}
```

Hàm `pushOutbox()` cũng được trang bị Mutex Lock (`if (this.isSyncing) return;`) để chống ghi đè song song (Race-condition).

### 2.4. Lớp Sweeper (Vét cặn an toàn)
Vì tin nhắn (sendMessage) có tỷ lệ nhỏ bị rớt (ví dụ lúc Service Worker đang lơ mơ thức dậy), chúng ta cần một cơ chế bảo hiểm.
File: `src/background/BackgroundSyncEngine.js` & `src/background/index.js`

Khởi tạo một Chrome Alarm quét mỗi 5 phút:
```javascript
browser.alarms.create('syncSweeper', { periodInMinutes: 5 });
```
Lắng nghe Alarm để vét cặn:
```javascript
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncSweeper') {
    backgroundSyncEngine.pushOutbox().catch(console.error);
  }
});
```

## 3. Lịch sử thay đổi (Changelog)
- **Bỏ `setInterval`:** Không dùng Interval để tương thích MV3.
- **Sửa lỗi Cache:** `packageStore.loadData(true)` được gọi ép buộc trong `pushOutbox` để bypass lỗi RAM Cache của Pinia, đảm bảo đẩy data chính xác từ ổ cứng lên Cloud.
- **Tạm dừng `pushLogs`:** Logic đẩy log tự động tạm thời bị tắt do tiêu thụ quá nhiều băng thông và tài nguyên. Cần thiết kế lại cơ chế dọn Log (Retention) trước khi mở lại.

## 4. Ghi chú bảo trì (Maintenance Tips)
- Đừng bao giờ thêm `await pushOutbox()` bừa bãi vào giao diện UI (Vue components). Cứ để UI ghi vào `syncQueue`, lớp Database sẽ tự lo liệu.
- Nếu sau này sử dụng thư viện Dexie-Observable, có thể thay thế Monkey-Patching bằng `dbStorage.on('changes')` cho thanh lịch hơn, nhưng hiện tại Monkey-Patching đang hoạt động hoàn hảo và siêu nhẹ.
