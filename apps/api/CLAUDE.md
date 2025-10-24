# CLAUDE.md - API Application

This file provides guidance for working with the API application in the WineScope monorepo.

## Application Overview

The API application is the main REST API service for WineScope, built with NestJS.

- **Framework**: NestJS v10.x (Express platform)
- **Language**: TypeScript 5.1+
- **Port**: 3000 (default)
- **Purpose**: REST API endpoints for wine data and search functionality

## Project Structure

```
apps/api/
├── src/
│   ├── main.ts              # Application entry point (port 3000)
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller (health check)
│   └── app.service.ts       # Root service
├── test/
│   └── app.e2e-spec.ts     # E2E test suite
├── Dockerfile               # Docker configuration for API service
└── tsconfig.app.json        # TypeScript config for this app
```

## Development Commands

All commands should be run from the **monorepo root** directory.

### Running the API App

```bash
# Development mode with watch (from root)
pnpm run start:dev api

# Debug mode with watch
pnpm run start:debug api

# Production build
pnpm run build api

# Run production build
pnpm run start:prod api
```

### Testing

```bash
# Unit tests for API app
pnpm run test api

# Unit tests in watch mode
pnpm run test:watch api

# E2E tests
pnpm run test:e2e api

# Test coverage
pnpm run test:cov api
```

## Docker

```bash
# Build API service image
docker compose build api

# Run API service only
docker compose up api

# Run API with dependencies (if any)
docker compose up api db redis
```

## Architecture

### Module Organization

Follow NestJS modular architecture:

- **Controllers**: Handle HTTP requests, validate input, return responses
- **Services**: Business logic, database operations, external API calls
- **Modules**: Group related controllers and services
- **DTOs**: Data Transfer Objects for request/response validation
- **Entities**: Database models (when using TypeORM/Prisma)

### Adding New Features

1. Create feature module: `nest g module features/wine --no-spec`
2. Create controller: `nest g controller features/wine --no-spec`
3. Create service: `nest g service features/wine --no-spec`
4. Import feature module into `app.module.ts`

Example:

```typescript
// apps/api/src/features/wine/wine.module.ts
@Module({
  controllers: [WineController],
  providers: [WineService],
  exports: [WineService], // Export if other modules need it
})
export class WineModule {}
```

### Shared Libraries

Use shared libraries from `libs/` directory for common functionality:

```typescript
// Import shared utilities
import { SomeUtil } from '@app/common';

// Import shared types
import { WineDto } from '@app/types';
```

## API Design Guidelines

### RESTful Endpoints

```typescript
@Controller('wines')
export class WineController {
  @Get()                    // GET /wines
  findAll() { }

  @Get(':id')              // GET /wines/:id
  findOne(@Param('id') id: string) { }

  @Post()                  // POST /wines
  create(@Body() createDto: CreateWineDto) { }

  @Patch(':id')           // PATCH /wines/:id
  update(@Param('id') id: string, @Body() updateDto: UpdateWineDto) { }

  @Delete(':id')          // DELETE /wines/:id
  remove(@Param('id') id: string) { }
}
```

### Response Format

Use consistent response format:

```typescript
// Success response
{
  "data": { /* result */ },
  "message": "Success",
  "statusCode": 200
}

// Error response
{
  "error": "Error message",
  "message": "Detailed error description",
  "statusCode": 400
}
```

## Environment Variables

Create `.env` file in the root directory:

```bash
# API Configuration
API_PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=winescope
DB_USER=postgres
DB_PASSWORD=password

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Code Quality

### Type Safety

- **Avoid `any` type**: Use proper TypeScript types
- **Use DTOs**: Validate all request/response data with class-validator
- **Type interfaces**: Define clear interfaces for all data structures

### Validation

```typescript
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateWineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  vintage: number;
}
```

### Error Handling

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

// Use NestJS built-in exceptions
throw new HttpException('Wine not found', HttpStatus.NOT_FOUND);

// Or specific exception types
throw new NotFoundException('Wine not found');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Not authenticated');
```

## Testing

### Unit Tests

```typescript
describe('WineController', () => {
  let controller: WineController;
  let service: WineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WineController],
      providers: [WineService],
    }).compile();

    controller = module.get<WineController>(WineController);
    service = module.get<WineService>(WineService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

### E2E Tests

```typescript
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

## Common Patterns

### Dependency Injection

```typescript
@Injectable()
export class WineService {
  constructor(
    @InjectRepository(Wine)
    private readonly wineRepository: Repository<Wine>,
    private readonly configService: ConfigService,
  ) {}
}
```

### Guards (Authentication)

```typescript
@Controller('wines')
@UseGuards(AuthGuard)
export class WineController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

### Interceptors (Logging)

```typescript
@Controller('wines')
@UseInterceptors(LoggingInterceptor)
export class WineController {
  // All routes will be logged
}
```

## Related Documentation

- Root [CLAUDE.md](../../CLAUDE.md) - Monorepo guidelines
- [DOCKER.md](../../DOCKER.md) - Docker setup and deployment
- Crawler app [CLAUDE.md](../crawler/CLAUDE.md) - Crawler service documentation
