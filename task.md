# Task List

## Current Tasks
- [ ] Run Self-Improvement Loop.
- [ ] Deep Code Review on core files.

## Blind Spots & Future Work
- (To be added)
- **FleetOrchestrator.ts SRP Violation**: Quá nhiều trách nhiệm (scheduling, process PID, logging, grid calculation). Cần tách ra các service riêng.
- **FleetOrchestrator.ts OCP Violation**: Logic schedule task dùng hardcoded if/else. Cần refactor dùng Strategy Pattern.
- **FleetOrchestrator.ts DI/LSP**: Dùng dynamic import cứng ngắc bên trong hàm. Nên dùng Dependency Injection ở constructor.
