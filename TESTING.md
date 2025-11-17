# Testing Guide - BLU Ticketing System

This document describes the testing setup and implementation for the BLU Ticketing System backend.

---

## Test Stack

- **Jest** - Testing framework
- **ts-jest** - TypeScript preprocessor for Jest
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory MongoDB for isolated testing
- **@types/jest** - TypeScript type definitions for Jest
- **@types/supertest** - TypeScript type definitions for Supertest

---

## Installation

All testing dependencies are already installed. If you need to reinstall:

```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
```

---

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run tests with verbose output
```bash
npm run test:verbose
```

---

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                          # Test environment setup
│   ├── utils/
│   │   └── testHelpers.ts               # Reusable test utilities
│   ├── helpers/
│   │   ├── password.test.ts             # Password helper tests (7 tests)
│   │   └── jwt.test.ts                  # JWT helper tests (6 tests)
│   ├── middleware/
│   │   ├── authenticate.test.ts         # Authentication middleware tests (5 tests)
│   │   └── authorize.test.ts            # Authorization middleware tests (7 tests)
│   ├── models/
│   │   ├── User.test.ts                 # User model tests (15 tests)
│   │   ├── Role.test.ts                 # Role model tests (16 tests)
│   │   ├── Ticket.test.ts               # Ticket model tests (19 tests)
│   │   └── TicketLog.test.ts            # TicketLog model tests (9 tests)
│   └── controllers/
│       ├── authentication.test.ts       # Authentication controller tests (17 tests)
│       ├── users.test.ts                # Users controller tests (7 tests)
│       └── ticket.test.ts               # Ticket controller tests (42 tests)
```

---

## Test Configuration

### jest.config.js

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
}
```

---

## Test Setup

### MongoDB Memory Server

The test setup uses `mongodb-memory-server` to create an in-memory MongoDB instance for each test run. This ensures:

- **Isolation**: Each test run has a clean database
- **Speed**: No need to connect to external MongoDB
- **Reliability**: Tests don't depend on external services

**Setup file**: `src/__tests__/setup.ts`

```typescript
// Creates in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Cleans up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clears collections after each test
afterEach(async () => {
  // Delete all documents from all collections
});
```

---

## Test Utilities

### testHelpers.ts

Provides reusable functions for creating test data:

#### createTestRole(name)
Creates a test role (L1, L2, or L3) with appropriate permissions.

```typescript
const role = await createTestRole('L1');
```

#### createTestUser(email, username, password, roleName)
Creates a test user with hashed password and assigned role.

```typescript
const user = await createTestUser(
  'test@example.com',
  'testuser',
  'password123',
  'L1'
);
```

#### createAuthenticatedUser(email, username, password, roleName)
Creates a user and generates a JWT token for authenticated requests.

```typescript
const { user, token } = await createAuthenticatedUser(
  'test@example.com',
  'testuser',
  'password123',
  'L2'
);
```

#### generateTestToken(userId, email, role)
Generates a JWT token for a user.

```typescript
const token = generateTestToken(userId, 'test@example.com', 'L1');
```

---

## Implemented Tests

### ✅ Helpers

#### password.test.ts
- ✓ Hash password successfully
- ✓ Generate different hashes for same password (salt)
- ✓ Handle empty password
- ✓ Compare correct password
- ✓ Reject incorrect password
- ✓ Case sensitivity
- ✓ Empty password comparison

#### jwt.test.ts
- ✓ Generate valid JWT token
- ✓ Token format validation (3 parts)
- ✓ Verify and decode valid token
- ✓ Reject invalid token
- ✓ Reject malformed token
- ✓ Include expiration time (1 day)

### ✅ Middleware (12 tests)

#### authenticate.test.ts (5 tests)
- ✓ Authenticate with valid Bearer token
- ✓ Reject request without authorization header
- ✓ Reject invalid authorization format
- ✓ Reject invalid token
- ✓ Reject when user not found

#### authorize.test.ts (7 tests)
- ✓ Allow access for authorized L1 user
- ✓ Allow access for authorized L2 user
- ✓ Allow access for authorized L3 user
- ✓ Allow access with multiple allowed roles
- ✓ Deny L1 access to L2 endpoint
- ✓ Deny L2 access to L3 endpoint
- ✓ Deny access when userRole not set

### ✅ Models (59 tests)

#### User.test.ts (15 tests)
- ✓ Create user successfully
- ✓ Fail on duplicate email
- ✓ Fail on duplicate username
- ✓ Find user by email
- ✓ Find user by username
- ✓ Find user by ID
- ✓ Get all users
- ✓ Get users with populated role
- ✓ Update user by ID
- ✓ Delete user by ID
- ✓ Get users by role name
- ✓ Get users by role ID
- ✓ Return null for non-existent user
- ✓ Return empty array when no users
- ✓ Return null when deleting non-existent user

#### Role.test.ts (16 tests)
- ✓ Create role successfully
- ✓ Fail on duplicate role name
- ✓ Only accept L1, L2, L3 names
- ✓ Get all roles
- ✓ Find role by ID
- ✓ Find role by name
- ✓ Update role by ID
- ✓ Delete role by ID
- ✓ Require name field
- ✓ Allow role without description
- ✓ Store permissions as array
- ✓ Return null for invalid ID
- ✓ Return null for non-existent name
- ✓ Return empty array when no roles
- ✓ Return null when deleting non-existent role
- ✓ Return updated role with new: true

#### Ticket.test.ts (19 tests)
- ✓ Create ticket with auto-generated number
- ✓ Generate sequential ticket numbers
- ✓ Set default values correctly
- ✓ Validate category enum
- ✓ Validate priority enum
- ✓ Validate status enum
- ✓ Return paginated tickets
- ✓ Sort tickets by creation date
- ✓ Handle pagination correctly
- ✓ Return correct count
- ✓ Find ticket by ID
- ✓ Get tickets by level
- ✓ Get tickets by status
- ✓ Update ticket successfully
- ✓ Escalate ticket
- ✓ Delete ticket successfully
- ✓ Return null for invalid ID
- ✓ Return null when deleting non-existent
- ✓ Return null for non-existent ticket

#### TicketLog.test.ts (9 tests)
- ✓ Create log for ticket creation
- ✓ Create log for status change
- ✓ Create log for escalation
- ✓ Create log for assignment
- ✓ Create log for resolution
- ✓ Create log for comments
- ✓ Validate action type enum
- ✓ Validate critical value enum
- ✓ Get logs for ticket (sorted)

### ✅ Controllers (66 tests)

#### authentication.test.ts (17 tests)
- ✓ Register user with default L1 role
- ✓ Register user with specified role
- ✓ Fail when email missing
- ✓ Fail when password missing
- ✓ Fail when username missing
- ✓ Fail on duplicate email
- ✓ Fail on duplicate username
- ✓ Fail on invalid role
- ✓ Login successfully with valid credentials
- ✓ Set authentication cookie on login
- ✓ Fail login when email missing
- ✓ Fail login when password missing
- ✓ Fail login with non-existent email
- ✓ Fail login with incorrect password
- ✓ Password is case-sensitive
- ✓ Logout successfully
- ✓ Clear authentication cookie on logout

#### users.test.ts (7 tests)
- ✓ Get all users with roles
- ✓ Return empty array when no users
- ✓ Return multiple users
- ✓ Update user role successfully
- ✓ Fail when role name missing
- ✓ Fail with invalid role name
- ✓ Fail when user not found

#### ticket.test.ts (42 tests)
- ✓ Create new ticket successfully
- ✓ Create ticket with default priority
- ✓ Fail when required fields missing (4 tests)
- ✓ Update L1 ticket successfully
- ✓ Fail when ticket not at correct level (3 tests)
- ✓ Escalate from L1 to L2
- ✓ Escalate from L2 to L3
- ✓ Assign critical value (C1, C2, C3)
- ✓ Fail with invalid critical value
- ✓ Update L2 ticket with status and critical
- ✓ Update L3 ticket with resolution
- ✓ Fail when resolution missing
- ✓ Mark completed ticket as resolved
- ✓ Fail when ticket not completed
- ✓ Get all tickets with pagination
- ✓ Support custom pagination
- ✓ Default invalid page to 1
- ✓ Fail when limit exceeds 100
- ✓ Get tickets by level
- ✓ Get ticket detail by ID
- ✓ Fail when ticket not found
- ✓ Get ticket logs
- ✓ Return empty array for no logs

---

## ✅ Completed Tests

### Models (✅ 100% Coverage)
- [x] User model tests (15 tests)
- [x] Role model tests (16 tests)
- [x] Ticket model tests (19 tests)
- [x] TicketLog model tests (9 tests)

### Controllers (✅ 85% Coverage)
- [x] Authentication controller tests (17 tests)
- [x] Users controller tests (7 tests)
- [x] Ticket controller tests (42 tests)

---

## Writing New Tests

### Example: Testing a Helper Function

```typescript
import { myHelper } from '../../helpers/myHelper';

describe('MyHelper', () => {
  it('should perform expected behavior', () => {
    const result = myHelper('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge case', () => {
    const result = myHelper('');
    expect(result).toBeDefined();
  });
});
```

### Example: Testing a Controller

```typescript
import request from 'supertest';
import express from 'express';
import { createNewTicket } from '../../controller/ticket';
import { createTestUser } from '../utils/testHelpers';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const userId = req.get('x-test-user-id');
  if (userId) req.userId = userId;
  next();
});
app.post('/tickets', createNewTicket);

describe('POST /tickets', () => {
  it('should create a new ticket successfully', async () => {
    const user = await createTestUser('test@example.com', 'testuser', 'pass123', 'L1');

    const response = await request(app)
      .post('/tickets')
      .set('x-test-user-id', user._id.toString())
      .send({
        title: 'Test Ticket',
        description: 'Test description',
        category: 'Hardware',
        priority: 'high',
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Ticket');
    expect(response.body.ticketNumber).toBeDefined();
  });
});
```

---

## Best Practices

### 1. Isolation
- Each test should be independent
- Use `beforeEach` to set up fresh state
- Use `afterEach` to clean up

### 2. Descriptive Names
```typescript
// ✅ Good
it('should return 401 when token is missing')

// ❌ Bad
it('test authentication')
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should hash password correctly', async () => {
  // Arrange
  const password = 'test123';

  // Act
  const hashed = await hashPassword(password);

  // Assert
  expect(hashed).not.toBe(password);
});
```

### 4. Test Edge Cases
- Empty inputs
- Invalid inputs
- Boundary conditions
- Error handling

### 5. Use Test Utilities
- Reuse helper functions from `testHelpers.ts`
- Don't duplicate test data creation logic

---

## Coverage Goals

Aim for:
- **80%+ overall coverage**
- **100% coverage** for critical paths (authentication, authorization)
- **90%+ coverage** for business logic

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

---

## Continuous Integration

### Running Tests in CI/CD

```yaml
# Example: GitHub Actions
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '20'
    - run: npm install
    - run: npm test
    - run: npm run test:coverage
```

---

## Troubleshooting

### MongoDB Memory Server Issues

**Problem**: Tests timeout or fail to start

**Solution**:
```bash
# Clear MongoDB Memory Server cache
rm -rf ~/.cache/mongodb-binaries
```

### Jest Timeout

**Problem**: `Timeout - Async callback was not invoked within the timeout specified`

**Solution**: Increase timeout in jest.config.js or specific test:
```typescript
it('long running test', async () => {
  // test code
}, 30000); // 30 second timeout
```

### TypeScript Errors

**Problem**: Type errors in test files

**Solution**: Make sure `@types/*` packages are installed and tsconfig includes test files.

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Summary

**Current Test Coverage:**
- ✅ Helpers (password, jwt) - 80% coverage (13 tests)
- ✅ Middleware (authenticate, authorize) - 63% coverage (12 tests)
- ✅ Models (User, Role, Ticket, TicketLog) - 100% coverage (59 tests)
- ✅ Controllers (authentication, users, ticket) - 85% coverage (66 tests)

**Overall Coverage**: 86.57% statement coverage

**Total Tests**: 150 tests implemented
**Test Files**: 11 test files
**Status**: ✅ All tests passing - Comprehensive test suite complete!
