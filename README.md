# BLU Ticketing System - Backend API

Backend API for ticketing system with 3-level escalation workflow (L1, L2, L3) built with Node.js, Express, TypeScript, and MongoDB.

---

## Tech Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM (Object Data Modeling)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables management
- **nodemon** - Development auto-reload
- **ts-node** - TypeScript execution

---

## Prerequisites

Make sure you have installed:

- Node.js v16 or higher
- npm or yarn
- MongoDB (local) or MongoDB Atlas account

---

## Installation

### 1. Clone repository

```bash
git clone <repository-url>
cd BE
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env` file in project root:

```env
# MongoDB Configuration
MONGO_LOCAL_URI=mongodb://localhost:27017/ticketing
MONGO_CLOUD_URI=mongodb+srv://username:password@cluster.mongodb.net/ticketing?appName=ticketing

# JWT Configuration
JWT_SECRET=auth_token

# Server Configuration (optional)
PORT=8021
```

### 4. Install MongoDB (if using local)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
```

### 5. Seed database

```bash
# Seed roles and users
npm run seed

# Or seed separately
npm run seed roles
npm run seed users
```

---

## Running the Application

### Development Mode

```bash
npm start
```

Server will run at `http://localhost:8021` with hot-reload.

### Production Mode

```bash
npm run build
npm run start:prod
```

---

## Sample Credentials

After running the seeder, use the following credentials to login:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@example.com | admin123 | L3 | Full access (read, write, delete, admin) |
| user1@example.com | user123 | L2 | Intermediate access (read, write) |
| user2@example.com | user123 | L1 | Basic access (read) |
| john@example.com | password123 | L2 | Intermediate access |
| jane@example.com | password123 | L1 | Basic access |

---

## Project Structure

```
BE/
├── src/
│   ├── index.ts                  # Application entry point
│   ├── router/
│   │   ├── index.ts              # Main router
│   │   ├── authentication.ts     # Auth routes
│   │   ├── users.ts              # User routes
│   │   └── tickets.ts            # Ticket routes
│   ├── controller/
│   │   ├── authentication.ts     # Auth controller
│   │   ├── users.ts              # User controller
│   │   └── ticket.ts             # Ticket controller
│   ├── models/
│   │   ├── User.ts               # User model
│   │   ├── Role.ts               # Role model
│   │   ├── Ticket.ts             # Ticket model
│   │   └── TicketLog.ts          # Ticket log model
│   ├── middleware/
│   │   ├── authenticate.ts       # JWT authentication
│   │   └── authorize.ts          # Role-based authorization
│   ├── helpers/
│   │   ├── password.ts           # Password hashing utilities
│   │   └── jwt.ts                # JWT utilities
│   └── seeders/
│       ├── index.ts              # Seeder runner
│       ├── roleSeeder.ts         # Role seeder
│       └── userSeeder.ts         # User seeder
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── nodemon.json                  # Nodemon config
```

---

## API Endpoints

### Base URL

```
http://localhost:8021
```

---

## Authentication Endpoints

### 1. Register

**POST** `/auth/register`

Create new user. Default role is L1 if not specified.

**Request (Default Role L1):**
```bash
curl -X POST http://localhost:8021/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123"
  }'
```

**Request (With Specific Role):**
```bash
curl -X POST http://localhost:8021/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "roleName": "L2"
  }'
```

**Request Body:**
- `email` (required) - User email
- `username` (required) - Username
- `password` (required) - User password
- `roleName` (optional) - Role: L1, L2, or L3 (default: L1)

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "L1",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "message": "Email already exists"
}
```

Possible error messages:
- "Email, password, and username are required"
- "Invalid role. Must be L1, L2, or L3"
- "Email already exists"
- "Username already exists"

---

### 2. Login

**POST** `/auth/login`

Login and get JWT token.

**Request:**
```bash
curl -X POST http://localhost:8021/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "role": "L3"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookie:**
```
AUTH=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. Logout

**POST** `/auth/logout`

Logout and clear cookie.

**Request:**
```bash
curl -X POST http://localhost:8021/auth/logout
```

**Response (200):**
```
OK
```

---

## User Endpoints

### 1. Get All Users

**GET** `/users`

Get all users. Requires authentication and role L1+.

**Request:**
```bash
curl http://localhost:8021/users \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "roleId": {
      "_id": "507f191e810c19729de860ea",
      "name": "L3",
      "permissions": ["read", "write", "delete", "admin"]
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### 2. Update User Role

**PATCH** `/users/:id/role`

Change user role. Only accessible by admin (L3).

Role: L3 only

**Request:**
```bash
curl -X PATCH http://localhost:8021/users/507f1f77bcf86cd799439011/role \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "L2"
  }'
```

**Request Body:**
- `roleName` (required) - New role: L1, L2, or L3

**Response (200):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "L2"
  }
}
```

**Response Error:**
- `400` - Missing roleName or invalid role
- `404` - User not found or role not found
- `403` - Unauthorized (not L3)

---

## Ticket Endpoints

### Common Routes

#### 1. Get All Tickets

**GET** `/tickets`

Get all tickets with pagination.

**Query Parameters:**
- `page` (optional) - Page number, default: 1
- `limit` (optional) - Items per page, default: 10, max: 100

**Request:**
```bash
# Default (page 1, limit 10)
curl http://localhost:8021/tickets \
  -H "Authorization: Bearer <your_jwt_token>"

# With pagination
curl "http://localhost:8021/tickets?page=2&limit=20" \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response (200):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticketNumber": "TKT-202501-0001",
      "title": "Network connectivity issue",
      "status": "new",
      ...
    }
  ],
  "pagination": {
    "currentPage": 2,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

**Response Error:**
- `400` - Page/limit must be positive numbers
- `400` - Limit cannot exceed 100

---

#### 2. Get Tickets by Level

**GET** `/tickets/level/:level`

**Request:**
```bash
# Get all L1 tickets
curl http://localhost:8021/tickets/level/1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

#### 3. Get Ticket Detail

**GET** `/tickets/:id`

**Request:**
```bash
curl http://localhost:8021/tickets/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

#### 4. Get Ticket Logs

**GET** `/tickets/:id/logs`

Mendapatkan history lengkap semua action pada ticket.

**Request:**
```bash
curl http://localhost:8021/tickets/507f1f77bcf86cd799439011/logs \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "ticketId": "507f1f77bcf86cd799439011",
    "actionType": "created",
    "newValue": "new",
    "comment": "Ticket created: Network issue",
    "performedBy": {
      "username": "admin",
      "email": "admin@example.com"
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### L1 Actions (Level 1)

#### 1. Create Ticket

**POST** `/tickets`

Role: L1 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Network connectivity issue",
    "description": "Cannot connect to office WiFi",
    "category": "Network",
    "priority": "high",
    "expectedCompletionDate": "2025-01-20T10:00:00.000Z"
  }'
```

**Categories:** Hardware, Software, Network, Account, Other
**Priority:** low, medium, high

---

#### 2. Update Ticket

**POST** `/tickets/:id/update-l1`

Role: L1 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets/507f1f77bcf86cd799439011/update-l1 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionNotes": "Restarted router, checking connection",
    "action_status": "attending"
  }'
```

**Request Body:**
- `resolutionNotes` (optional) - Resolution notes
- `action_status` (optional) - Ticket status (new, attending, escalated, completed, resolved)

---

#### 3. Escalate to L2

**POST** `/tickets/:id/escalate-l2`

Role: L1 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets/507f1f77bcf86cd799439011/escalate-l2 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Issue requires network infrastructure access"
  }'
```

**Request Body:**
- `reason` (optional) - Escalation reason

---

### L2 Actions (Level 2)

#### 1. Update Ticket

**POST** `/tickets/:id/update-l2`

Role: L2 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets/507f1f77bcf86cd799439011/update-l2 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionNotes": "Investigating network configuration",
    "action_status": "attending",
    "criticalValue": "C2"
  }'
```

**Request Body:**
- `resolutionNotes` (optional) - Resolution notes
- `action_status` (optional) - Ticket status (new, attending, escalated, completed, resolved)
- `criticalValue` (optional) - Critical value: C1 (Low), C2 (Medium), C3 (High)

---

#### 2. Escalate to L3

**POST** `/tickets/:id/escalate-l3`

Role: L2 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets/507f1f77bcf86cd799439011/escalate-l3 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Requires senior admin intervention"
  }'
```

**Request Body:**
- `reason` (optional) - Escalation reason

---

### L3 Actions (Level 3)

#### 1. Update Ticket

**POST** `/tickets/:id/update-l3`

Role: L3 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets/507f1f77bcf86cd799439011/update-l3 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Network infrastructure reconfigured",
    "resolutionNotes": "Updated VLAN settings and firewall rules",
    "action_status": "completed"
  }'
```

**Request Body:**
- `resolution` (required) - Applied solution
- `resolutionNotes` (optional) - Detailed resolution notes
- `action_status` (optional) - Ticket status (default: completed)

---

#### 2. Mark as Resolved

**POST** `/tickets/:id/resolve`

Role: L3 only

**Request:**
```bash
curl -X POST http://localhost:8021/tickets/507f1f77bcf86cd799439011/resolve \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

## Workflow

### Ticket Lifecycle

```
L1: CREATE TICKET
    |
    v
L1 UPDATE TICKET
    |
    +---> [RESOLVED] (if fixed)
    |
    +---> ESCALATE TO L2
            |
            v
        L2 UPDATE TICKET (can assign critical value C1/C2/C3)
            |
            +---> [RESOLVED] (if fixed)
            |
            +---> ESCALATE TO L3
                    |
                    v
                L3 UPDATE TICKET
                    |
                    v
                L3 MARK AS RESOLVED
```

### Status Flow

- **new** - New ticket created
- **attending** - Work in progress
- **escalated** - Escalated to higher level
- **completed** - Fix completed
- **resolved** - Ticket closed

---

## Database Schema

### User

```typescript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  roleId: ObjectId (ref: Role),
  authentication: {
    password: String (bcrypt hashed),
    sessionToken: String (JWT)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Role

```typescript
{
  _id: ObjectId,
  name: String (L1|L2|L3),
  permissions: Array<String>,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Ticket

```typescript
{
  _id: ObjectId,
  ticketNumber: String (auto-generated: TKT-YYYYMM-0001),
  title: String,
  description: String,
  category: String (Hardware|Software|Network|Account|Other),
  priority: String (low|medium|high),
  status: String (new|attending|completed|resolved|escalated),
  currentLevel: Number (1|2|3),
  escalationLevel: Number (1|2|3),
  criticalValue: String (C1|C2|C3),
  expectedCompletionDate: Date,
  completedDate: Date,
  resolvedDate: Date,
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  escalatedBy: ObjectId (ref: User),
  resolvedBy: ObjectId (ref: User),
  resolution: String,
  resolutionNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### TicketLog

```typescript
{
  _id: ObjectId,
  ticketId: ObjectId (ref: Ticket),
  actionType: String (created|escalated|action_taken|critical_assigned|resolved),
  previousValue: String,
  newValue: String,
  comment: String,
  escalationReason: String,
  performedBy: ObjectId (ref: User),
  createdAt: Date
}
```

---

## Security Features

- **bcrypt** password hashing with auto-salt
- **JWT** token-based authentication (expires in 1 day)
- **Role-based access control** (RBAC)
- **Route-level authorization** middleware
- **CORS** enabled with credentials
- **Input validation** on all endpoints
- **Audit trail** via ticket logs

---

## Development

### Available Scripts

```bash
npm start              # Run development server with nodemon
npm run seed           # Seed all data (roles + users)
npm run seed roles     # Seed roles only
npm run seed users     # Seed users only
npm test               # Run tests (not implemented)
```

---

## Troubleshooting

### MongoDB Connection Error

**Problem:** `MongooseServerSelectionError: Could not connect to any servers`

**Solutions:**
1. Make sure MongoDB service is running (local)
   ```bash
   brew services start mongodb-community  # macOS
   sudo systemctl start mongodb           # Linux
   ```
2. Check IP whitelist in MongoDB Atlas (cloud)
3. Verify credentials in `.env`
4. Wait 2-5 minutes after updating whitelist

---

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::8021`

**Solution:**
```bash
# Find process using port 8021
lsof -i :8021

# Kill the process
kill -9 <PID>
```

---

### JWT Token Expired

**Problem:** `401 Unauthorized - Token expired`

**Solution:**
Login again to get a new token.

---

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_LOCAL_URI` | MongoDB local connection string | No | - |
| `MONGO_CLOUD_URI` | MongoDB Atlas connection string | No | - |
| `JWT_SECRET` | Secret key for JWT | Yes | auth_token |
| `PORT` | Server port | No | 8021 |

**Note:** Either `MONGO_LOCAL_URI` or `MONGO_CLOUD_URI` must be provided.

---

## Notes

- Passwords are hashed using bcrypt with salt rounds = 10
- JWT token expires in 1 day
- Ticket numbers are auto-generated with format: `TKT-YYYYMM-0001`
- All endpoints (except register/login) require authentication
- Role-based actions are strictly enforced (L1 cannot access L2/L3 actions)
- Ticket logs record all changes for audit trail
- **Pagination:**
  - `GET /tickets` endpoint supports pagination
  - Default: page=1, limit=10
  - Max limit: 100 items per page
  - Response includes pagination metadata (currentPage, totalPages, totalItems, hasNextPage, hasPrevPage)
- **Ticket Creation:**
  - Only L1 can create new tickets
  - Created tickets always start at level 1 (currentLevel: 1)
- **Role Management:**
  - Default role for new users is L1 (if not specified)
  - During registration, role can be set directly with `roleName` parameter (optional)
  - Admin (L3) can change user roles via `/users/:id/role` endpoint

---

## License

ISC
# BE-TICKETING
