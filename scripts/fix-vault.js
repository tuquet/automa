const fs = require('fs');
let file = 'automa-core/src/api/handlers/vault.rs';
let content = fs.readFileSync(file, 'utf8');

// Add tag = "Vault", to all utoipa::path macros that lack it
content = content.replace(/#\[utoipa::path\(\s*(?!tag)/g, '#[utoipa::path(\n    tag = "Vault",\n    ');

// Add #[schema(value_type = Object)] to serde_json::Value fields in VaultVariable and VaultTable
content = content.replace(/pub value: serde_json::Value,/g, '#[schema(value_type = Object)]\n    pub value: serde_json::Value,');
content = content.replace(/pub columns: Option<serde_json::Value>,/g, '#[schema(value_type = Object)]\n    pub columns: Option<serde_json::Value>,');
content = content.replace(/pub items: Option<serde_json::Value>,/g, '#[schema(value_type = Object)]\n    pub items: Option<serde_json::Value>,');
content = content.replace(/pub columns_index: Option<serde_json::Value>,/g, '#[schema(value_type = Object)]\n    pub columns_index: Option<serde_json::Value>,');

fs.writeFileSync(file, content);
