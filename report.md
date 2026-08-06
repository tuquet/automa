# Report: SOLID & Design Pattern (RunCommand.ts)
1. **Vi phạm SRP (Single Responsibility Principle)**: Hàm `action` trong `RunCommand.ts` quá dài (hơn 300 dòng), ôm đồm quá nhiều logic: đọc file, sanitize, CLI prompt, linting, dependency scanning, merge settings, job execution.
2. **Vi phạm DIP (Dependency Inversion Principle)**: Hardcode các modules như `fs`, `prompts` trực tiếp vào command, khó mock để viết Unit Test.
3. **Coupling cao**: Logic đọc `.vscode/settings.json` được viết inline thay vì đưa vào `ConfigManager`.

**Action Plan**: Cần tách các phase (Validation, Configuration, Prompting, Execution) thành các services/functions riêng biệt.
