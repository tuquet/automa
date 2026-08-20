const fs = require('fs');
const path = require('path');
const { openApiToBruno } = require('@usebruno/converters');

async function syncBruno() {
  console.log('🔄 Đang đọc cấu hình OpenAPI từ bruno/specs/automa-core-api.json...');
  try {
    const openApiSpec = fs.readFileSync(path.join(__dirname, '../bruno/specs/automa-core-api.json'), 'utf8');
    
    console.log('🔄 Đang convert OpenAPI sang Bruno Collection...');
    const brunoCollection = openApiToBruno(openApiSpec);
    
    fs.writeFileSync(path.join(__dirname, '../automa-bruno/bruno.json'), JSON.stringify(brunoCollection, null, 2));
    console.log('✅ Chuyển đổi thành công!');
  } catch(e) {
    console.error('❌ Lỗi:', e);
  }
}

syncBruno();
