const path = require('path');
const { runWorkflow } = require('./automa-cli/lib/runner');

async function main() {
  const workflowPath = path.resolve(__dirname, 'crm_login.automa.json');

  console.log("🚀 Đang khởi động tiến trình Automa CLI ngầm...");
  
  try {
    const result = await runWorkflow(workflowPath, {
      variables: {
        username: "tuquet",
        password: "1235"
      },
      // Chỉnh headless: false nếu muốn xem trình duyệt bật lên
      puppeteerOptions: {
        headless: false 
      },
      timeout: 60000
    });

    console.log("✅ Trạng thái:", result.log.status);
    console.log("📌 Log ID:", result.log.id);
    
    // Check nếu có snapshot hoặc data
    if (result.log.snapshot_base64) {
      console.log("📸 Đã bắt được ảnh Snapshot! Độ dài base64:", result.log.snapshot_base64.length);
    } else {
      console.log("⚠️ Không có trường snapshot trong log trả về.");
    }

    if (result.log.status === 'error') {
      console.error("❌ Lỗi thực thi:", result.log.message);
    } else {
      console.log("🎉 Workflow đã chạy thành công!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Hệ thống gặp lỗi:", error.message);
    process.exit(1);
  }
}

main();
