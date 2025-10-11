# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WineScope is a NestJS-based TypeScript application. This is a fresh NestJS starter project using:
- **Framework**: NestJS v10.x (Express platform)
- **Language**: TypeScript 5.1+
- **Package Manager**: pnpm
- **Testing**: Jest for unit tests, Supertest for E2E tests

## Git Workflow

This project uses a **simplified GitHub Flow** strategy with two main branches:

### Branch Structure
- **`main`**: Production-ready code (stable, deployable)
- **`dev`**: Development integration branch (active development)
- **`feature/*`**: Feature branches (branched from `dev`)
- **`bugfix/*`**: Bug fix branches (branched from `dev`)
- **`hotfix/*`**: Emergency fixes (branched from `main`)

### Development Workflow

**Daily development** (always work on `dev` or feature branches):
```bash
# Start new work
git checkout dev
git pull origin dev

# Create feature branch (optional for large features)
git checkout -b feature/wine-search

# Work and commit
git add .
git commit -m "Add wine search functionality"

# Push to dev
git checkout dev
git merge feature/wine-search
git push origin dev
```

**Production release** (when `dev` is stable):
```bash
# Merge dev to main
git checkout main
git pull origin main
git merge dev

# Tag release version
git tag -a v1.0.0 -m "Release v1.0.0"

# Push to production
git push origin main
git push --tags
```

**Emergency hotfix** (critical production bug):
```bash
# Branch from main
git checkout main
git checkout -b hotfix/critical-security-fix

# Fix and test
git commit -m "Fix critical security vulnerability"

# Merge to both main and dev
git checkout main
git merge hotfix/critical-security-fix
git push origin main

git checkout dev
git merge hotfix/critical-security-fix
git push origin dev
```

### Branch Naming Convention
- `feature/descriptive-name`: New features
- `bugfix/issue-description`: Bug fixes
- `hotfix/critical-fix`: Emergency production fixes
- `refactor/component-name`: Code improvements
- `docs/documentation-topic`: Documentation updates
- `test/test-description`: Test additions

## Development Commands

### Setup and Running
```bash
pnpm install                  # Install dependencies
pnpm run start:dev           # Development mode with watch (most commonly used)
pnpm run start:debug         # Debug mode with watch
pnpm run build               # Build production bundle
pnpm run start:prod          # Run production build
```

### Code Quality
```bash
pnpm run lint                # Run ESLint with auto-fix
pnpm run format              # Format code with Prettier
```

### Testing
```bash
pnpm run test                # Run unit tests
pnpm run test:watch          # Run unit tests in watch mode
pnpm run test:cov            # Run tests with coverage report
pnpm run test:e2e            # Run E2E tests
pnpm run test:debug          # Debug tests with Node inspector
```

## Architecture

### NestJS Module Structure
This project follows NestJS's modular architecture with dependency injection:

- **Module** (`@Module` decorator): Organizes related components (controllers, providers, imports)
- **Controller** (`@Controller` decorator): Handles HTTP requests and routing
- **Service/Provider** (`@Injectable` decorator): Business logic layer, injected into controllers
- **Main bootstrap** (`main.ts`): Application entry point, creates and configures NestJS app

### Current Structure
```
src/
├── main.ts              # Bootstrap application (port 3000)
├── app.module.ts        # Root module, imports all feature modules
├── app.controller.ts    # Root controller (handles '/' route)
└── app.service.ts       # Root service (business logic)

test/
└── app.e2e-spec.ts     # E2E test suite
```

### Adding New Features
When creating new features, follow the NestJS modular pattern:
1. Generate module: `nest g module <name>` or manually create `<name>.module.ts`
2. Generate controller: `nest g controller <name>` or manually create `<name>.controller.ts`
3. Generate service: `nest g service <name>` or manually create `<name>.service.ts`
4. Import feature module into `app.module.ts`

### Dependency Injection
NestJS uses constructor-based dependency injection. Services are injected into controllers/other services via constructor parameters with proper typing.

Example:
```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
```

## Code Style and Quality

### TypeScript Configuration
- Target: ES2021
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Relaxed strict mode (`strictNullChecks: false`, `noImplicitAny: false`)

### ESLint and Prettier
- Single quotes for strings
- Trailing commas required
- `@typescript-eslint/no-explicit-any` is disabled (but avoid `any` when possible per CLAUDE.md guidelines)
- Run `pnpm run lint` before commits to ensure code quality

### Testing
- **Unit tests**: Place `*.spec.ts` files next to source files in `src/`
- **E2E tests**: Place `*.e2e-spec.ts` files in `test/` directory
- **Jest config**: `rootDir: "src"` for unit tests, separate config for E2E
- Use `@nestjs/testing` module for creating test modules with dependency injection

## Key Conventions

### Decorators
NestJS heavily uses TypeScript decorators for metadata:
- `@Module()`: Define module with imports, controllers, providers
- `@Controller(route?)`: Define controller with optional route prefix
- `@Injectable()`: Mark class as injectable provider
- `@Get()`, `@Post()`, etc.: Define HTTP method handlers

### File Naming
- Modules: `*.module.ts`
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Unit tests: `*.spec.ts`
- E2E tests: `*.e2e-spec.ts`

### Build Output
- Compiled JavaScript → `dist/` directory
- TypeScript declarations included (`declaration: true`)
- Source maps enabled for debugging
