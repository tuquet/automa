const { AutomaClient } = require('./dist/index.js');

async function testDaemon() {
  console.log("🚀 Bắt đầu Integration Test với Rust Core (automa-core)...\n");
  const client = new AutomaClient("http://127.0.0.1:8765");

  try {
    // 1. Health Check
    console.log("⏳ Đang gọi Health Check...");
    const health = await client.checkDaemonHealth();
    console.log("✅ Health Check OK:", health);

    // 2. Chạy workflow thông qua Rust
    console.log("\n⏳ Đang Submit Workflow qua Rust Core...");
    const res = await fetch("http://127.0.0.1:8765/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_path: "/root/automa-ecosystem/automa-cli/google_search.json" })
    });
    const data = await res.json();
    console.log("✅ Submit thành công! Job ID:", data.job_id);

  } catch (error) {
    console.error("\n❌ Giao tiếp thất bại:", error.message);
    process.exit(1);
  }
}

testDaemon();
