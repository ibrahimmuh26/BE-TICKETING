# Frontend Integration Guide - BLU Ticketing System

Guide for Frontend integration with BLU Ticketing System Backend API.

---

## Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:8021';
```

---

## Authentication Flow

### 1. Login
```javascript
POST /auth/login
Body: { email, password }
Response: { user, token }

// Save token for subsequent requests
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));
```

### 2. Every Subsequent Request
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

### 3. Logout
```javascript
POST /auth/logout
// Clear local storage
localStorage.removeItem('token');
localStorage.removeItem('user');
```

---

## Enums & Constants

### User Roles
```typescript
enum UserRole {
  L1 = 'L1',  // Basic support
  L2 = 'L2',  // Intermediate support
  L3 = 'L3'   // Admin/Senior support
}
```

### Ticket Status
```typescript
enum TicketStatus {
  NEW = 'new',              // New ticket created
  ATTENDING = 'attending',   // Work in progress
  ESCALATED = 'escalated',   // Escalated to higher level
  COMPLETED = 'completed',   // Fix completed (L3 only)
  RESOLVED = 'resolved'      // Ticket closed
}
```

### Priority Level
```typescript
enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
```

### Ticket Category
```typescript
enum Category {
  HARDWARE = 'Hardware',
  SOFTWARE = 'Software',
  NETWORK = 'Network',
  ACCOUNT = 'Account',
  OTHER = 'Other'
}
```

### Critical Value (L2 only)
```typescript
enum CriticalValue {
  C1 = 'C1',  // Low criticality
  C2 = 'C2',  // Medium criticality
  C3 = 'C3'   // High criticality
}
```

### Ticket Log Action Types
```typescript
enum ActionType {
  CREATED = 'created',
  ESCALATED = 'escalated',
  ACTION_TAKEN = 'action_taken',
  CRITICAL_ASSIGNED = 'critical_assigned',
  RESOLVED = 'resolved'
}
```

---

## Response Structures

### User Object
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;  // 'L1' | 'L2' | 'L3'
  createdAt: Date;
}
```

### Ticket Object
```typescript
interface Ticket {
  _id: string;
  ticketNumber: string;           // Format: TKT-YYYYMM-0001
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  currentLevel: 1 | 2 | 3;
  escalationLevel: 1 | 2 | 3;
  criticalValue?: CriticalValue;  // L2 only
  expectedCompletionDate: Date;
  completedDate?: Date;
  resolvedDate?: Date;
  createdBy: User;
  assignedTo?: User;
  escalatedBy?: User;
  resolvedBy?: User;
  resolution?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ticket Log Object
```typescript
interface TicketLog {
  _id: string;
  ticketId: string;
  actionType: ActionType;
  previousValue?: string;
  newValue?: string;
  comment?: string;
  escalationReason?: string;
  performedBy: {
    username: string;
    email: string;
  };
  createdAt: Date;
}
```

### Pagination Response
```typescript
interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

---

## Error Responses

### Error Structure
```typescript
interface ErrorResponse {
  message: string;
}

// Status Codes:
// 400 - Bad Request (validation error)
// 401 - Unauthorized (not authenticated)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found
// 500 - Internal Server Error
```

### Common Error Messages
```typescript
// Authentication
"Email, password, and username are required"
"Email already exists"
"Username already exists"
"Failed login"
"UnAuthenticated"

// Authorization
"Access denied"
"Ticket is not at L1/L2/L3 level"

// Validation
"Title, description, category, and expectedCompletionDate are required"
"Valid criticalValue (C1, C2, C3) is required"
"Invalid role. Must be L1, L2, or L3"
"Resolution is required"

// Not Found
"Ticket not found"
"User not found"
"Role not found"
```

---

## API Endpoints by Role

### Public (No Auth)
```
POST /auth/register
POST /auth/login
```

### Authenticated (All Roles)
```
GET  /tickets              - Get all tickets (with pagination)
GET  /tickets/level/:level - Get tickets by level
GET  /tickets/:id          - Get ticket detail
GET  /tickets/:id/logs     - Get ticket history
GET  /users                - Get all users
POST /auth/logout
```

### L1 Only
```
POST /tickets                  - Create new ticket
POST /tickets/:id/update-l1    - Update ticket (status, notes)
POST /tickets/:id/escalate-l2  - Escalate to L2
```

### L2 Only
```
POST /tickets/:id/update-l2    - Update ticket (status, notes, critical value)
POST /tickets/:id/escalate-l3  - Escalate to L3
```

### L3 Only
```
POST /tickets/:id/update-l3    - Update ticket (complete with resolution)
POST /tickets/:id/resolve      - Mark as resolved
PATCH /users/:id/role          - Update user role
```

---

## Request/Response Examples

### 1. Get All Tickets (with Pagination)
```javascript
// Request
GET /tickets?page=1&limit=10

// Response (200)
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticketNumber": "TKT-202501-0001",
      "title": "Network connectivity issue",
      "status": "new",
      "currentLevel": 1,
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. Create Ticket (L1)
```javascript
// Request
POST /tickets
{
  "title": "Network connectivity issue",
  "description": "Cannot connect to office WiFi",
  "category": "Network",
  "priority": "high",
  "expectedCompletionDate": "2025-01-20T10:00:00.000Z"
}

// Response (201)
{
  "_id": "507f1f77bcf86cd799439011",
  "ticketNumber": "TKT-202501-0001",
  "title": "Network connectivity issue",
  "status": "new",
  "currentLevel": 1,
  ...
}
```

### 2. Update Ticket L1
```javascript
// Request
POST /tickets/:id/update-l1
{
  "resolutionNotes": "Restarted router",
  "action_status": "attending"
}

// Response (200)
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "attending",
  "assignedTo": { ... },
  "resolutionNotes": "Restarted router",
  ...
}
```

### 3. Update Ticket L2 (with Critical Value)
```javascript
// Request
POST /tickets/:id/update-l2
{
  "resolutionNotes": "Investigating network config",
  "action_status": "attending",
  "criticalValue": "C2"
}

// Response (200)
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "attending",
  "criticalValue": "C2",
  ...
}
```

### 4. Escalate to L2
```javascript
// Request
POST /tickets/:id/escalate-l2
{
  "reason": "Requires network infrastructure access"
}

// Response (200)
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "escalated",
  "currentLevel": 2,
  "escalationLevel": 2,
  "escalatedBy": { ... },
  ...
}
```

### 5. Update Ticket L3
```javascript
// Request
POST /tickets/:id/update-l3
{
  "resolution": "Network infrastructure reconfigured",
  "resolutionNotes": "Updated VLAN settings",
  "action_status": "completed"
}

// Response (200)
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "resolution": "Network infrastructure reconfigured",
  "completedDate": "2025-01-15T12:00:00.000Z",
  ...
}
```

### 6. Mark as Resolved (L3)
```javascript
// Request
POST /tickets/:id/resolve

// Response (200)
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "resolved",
  "resolvedDate": "2025-01-15T13:00:00.000Z",
  "resolvedBy": { ... },
  ...
}
```

---

## UI/UX Guidelines

### Role-Based UI Display

#### L1 Users Can:
- ✅ Create tickets
- ✅ Update L1 tickets (status, notes)
- ✅ Escalate to L2
- ✅ View all tickets
- ❌ Assign critical values
- ❌ Access L2/L3 actions

#### L2 Users Can:
- ✅ Update L2 tickets (status, notes, critical value)
- ✅ Escalate to L3
- ✅ View all tickets
- ❌ Create tickets
- ❌ Access L3 actions

#### L3 Users Can:
- ✅ Update L3 tickets (complete with resolution)
- ✅ Mark tickets as resolved
- ✅ Change user roles
- ✅ View all tickets
- ❌ Create tickets

### Status Badge Colors (Suggestion)
```javascript
const statusColors = {
  'new': 'blue',       // Info
  'attending': 'yellow', // Warning
  'escalated': 'orange', // Alert
  'completed': 'green',  // Success
  'resolved': 'gray'     // Neutral
};
```

### Priority Badge Colors (Suggestion)
```javascript
const priorityColors = {
  'low': 'green',
  'medium': 'yellow',
  'high': 'red'
};
```

### Critical Value Badge Colors (Suggestion)
```javascript
const criticalColors = {
  'C1': 'green',   // Low
  'C2': 'yellow',  // Medium
  'C3': 'red'      // High
};
```

---

## Workflow State Machine

### Ticket State Transitions

```
CREATE (L1 ONLY)
  └─> status: 'new', currentLevel: 1

UPDATE-L1
  └─> status: 'attending' (or custom)

ESCALATE-L2
  └─> status: 'escalated', currentLevel: 2

UPDATE-L2
  └─> status: 'attending' (or custom)
  └─> criticalValue: 'C1'|'C2'|'C3' (optional)

ESCALATE-L3
  └─> status: 'escalated', currentLevel: 3

UPDATE-L3
  └─> status: 'completed'
  └─> resolution: required
  └─> completedDate: auto-set

RESOLVE (L3)
  └─> status: 'resolved'
  └─> resolvedDate: auto-set
```

### Valid Status Changes per Level

**L1:**
- new → attending
- attending → escalated (via escalate-l2)

**L2:**
- escalated → attending
- attending → escalated (via escalate-l3)

**L3:**
- escalated → completed (via update-l3)
- completed → resolved (via resolve)

---

## Form Validation Rules

### Create Ticket
```typescript
{
  title: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  description: {
    required: true,
    minLength: 10
  },
  category: {
    required: true,
    enum: ['Hardware', 'Software', 'Network', 'Account', 'Other']
  },
  priority: {
    required: false,
    default: 'medium',
    enum: ['low', 'medium', 'high']
  },
  expectedCompletionDate: {
    required: true,
    type: 'Date',
    minDate: 'today'
  }
}
```

### Update L1
```typescript
{
  resolutionNotes: {
    required: false,
    minLength: 5
  },
  action_status: {
    required: false,
    enum: ['new', 'attending', 'escalated', 'completed', 'resolved']
  }
}
```

### Update L2
```typescript
{
  resolutionNotes: {
    required: false,
    minLength: 5
  },
  action_status: {
    required: false,
    enum: ['new', 'attending', 'escalated', 'completed', 'resolved']
  },
  criticalValue: {
    required: false,
    enum: ['C1', 'C2', 'C3']
  }
}
```

### Update L3
```typescript
{
  resolution: {
    required: true,
    minLength: 10
  },
  resolutionNotes: {
    required: false
  },
  action_status: {
    required: false,
    default: 'completed',
    enum: ['new', 'attending', 'escalated', 'completed', 'resolved']
  }
}
```

### Escalate
```typescript
{
  reason: {
    required: false,
    minLength: 10
  }
}
```

---

## Utility Functions (Suggestion)

### Format Ticket Number
```javascript
function formatTicketNumber(ticketNumber) {
  // TKT-202501-0001 → Display as is
  return ticketNumber;
}
```

### Get Status Label
```javascript
function getStatusLabel(status) {
  const labels = {
    'new': 'New',
    'attending': 'In Progress',
    'escalated': 'Escalated',
    'completed': 'Completed',
    'resolved': 'Resolved'
  };
  return labels[status] || status;
}
```

### Check User Permission
```javascript
function canUserPerformAction(userRole, action) {
  const permissions = {
    'L1': ['create', 'update-l1', 'escalate-l2'],
    'L2': ['update-l2', 'escalate-l3'],
    'L3': ['update-l3', 'resolve', 'manage-users']
  };
  return permissions[userRole]?.includes(action) || false;
}
```

### Format Date
```javascript
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

---

## Sample API Client (JavaScript)

```javascript
class TicketingAPI {
  constructor(baseURL = 'http://localhost:8021') {
    this.baseURL = baseURL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email, username, password, roleName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, roleName })
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Tickets
  async getTickets(page = 1, limit = 10) {
    return this.request(`/tickets?page=${page}&limit=${limit}`);
  }

  async getTicketsByLevel(level) {
    return this.request(`/tickets/level/${level}`);
  }

  async getTicket(id) {
    return this.request(`/tickets/${id}`);
  }

  async getTicketLogs(id) {
    return this.request(`/tickets/${id}/logs`);
  }

  async createTicket(data) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTicketL1(id, data) {
    return this.request(`/tickets/${id}/update-l1`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTicketL2(id, data) {
    return this.request(`/tickets/${id}/update-l2`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTicketL3(id, data) {
    return this.request(`/tickets/${id}/update-l3`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async escalateToL2(id, reason) {
    return this.request(`/tickets/${id}/escalate-l2`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async escalateToL3(id, reason) {
    return this.request(`/tickets/${id}/escalate-l3`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async resolveTicket(id) {
    return this.request(`/tickets/${id}/resolve`, {
      method: 'POST'
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async updateUserRole(userId, roleName) {
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleName })
    });
  }
}

// Usage
const api = new TicketingAPI();


// Login
const { user, token } = await api.login('admin@example.com', 'admin123');
localStorage.setItem('token', token);

// Get tickets with pagination
const response = await api.getTickets(1, 10); // page 1, 10 items
console.log(response.data); // Array of tickets
console.log(response.pagination); // Pagination metadata

// Get next page
const page2 = await api.getTickets(2, 10);

// Create ticket
const newTicket = await api.createTicket({
  title: 'Network issue',
  description: 'WiFi not working',
  category: 'Network',
  priority: 'high',
  expectedCompletionDate: new Date().toISOString()
});
```

---

## TypeScript Types (Complete)

```typescript
// Copy this file to your frontend project as types.ts

export enum UserRole {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3'
}

export enum TicketStatus {
  NEW = 'new',
  ATTENDING = 'attending',
  ESCALATED = 'escalated',
  COMPLETED = 'completed',
  RESOLVED = 'resolved'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum Category {
  HARDWARE = 'Hardware',
  SOFTWARE = 'Software',
  NETWORK = 'Network',
  ACCOUNT = 'Account',
  OTHER = 'Other'
}

export enum CriticalValue {
  C1 = 'C1',
  C2 = 'C2',
  C3 = 'C3'
}

export enum ActionType {
  CREATED = 'created',
  ESCALATED = 'escalated',
  ACTION_TAKEN = 'action_taken',
  CRITICAL_ASSIGNED = 'critical_assigned',
  RESOLVED = 'resolved'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  currentLevel: 1 | 2 | 3;
  escalationLevel: 1 | 2 | 3;
  criticalValue?: CriticalValue;
  expectedCompletionDate: string;
  completedDate?: string;
  resolvedDate?: string;
  createdBy: User;
  assignedTo?: User;
  escalatedBy?: User;
  resolvedBy?: User;
  resolution?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketLog {
  _id: string;
  ticketId: string;
  actionType: ActionType;
  previousValue?: string;
  newValue?: string;
  comment?: string;
  escalationReason?: string;
  performedBy: {
    username: string;
    email: string;
  };
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ErrorResponse {
  message: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: Category;
  priority?: Priority;
  expectedCompletionDate: string;
}

export interface UpdateTicketL1Request {
  resolutionNotes?: string;
  action_status?: TicketStatus;
}

export interface UpdateTicketL2Request {
  resolutionNotes?: string;
  action_status?: TicketStatus;
  criticalValue?: CriticalValue;
}

export interface UpdateTicketL3Request {
  resolution: string;
  resolutionNotes?: string;
  action_status?: TicketStatus;
}

export interface EscalateRequest {
  reason?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type PaginatedTicketsResponse = PaginatedResponse<Ticket>;
```

---

## Testing Checklist

- [ ] Login dengan berbagai role (L1, L2, L3)
- [ ] Create ticket sebagai L1
- [ ] Update ticket L1 (status change)
- [ ] Escalate L1 → L2
- [ ] Update ticket L2 dengan critical value
- [ ] Escalate L2 → L3
- [ ] Update ticket L3 dengan resolution
- [ ] Resolve ticket sebagai L3
- [ ] View ticket logs
- [ ] Filter tickets by level
- [ ] Error handling (401, 403, 404)
- [ ] Token expiration handling
- [ ] Logout

---

## Notes

1. **Token Expiration**: JWT expires dalam 1 hari. Implementasikan refresh atau redirect to login saat 401.
2. **Real-time Updates**: Backend tidak support WebSocket. Gunakan polling atau manual refresh.
3. **File Upload**: Belum diimplementasikan di backend.
4. **Pagination**:
   - `GET /tickets` mendukung pagination dengan query params `page` dan `limit`
   - Default: page=1, limit=10
   - Max limit: 100 items per page
   - Response format: `{ data: [], pagination: {...} }`
5. **Search/Filter**: Frontend perlu implement client-side filtering atau gunakan pagination untuk load data secara bertahap.
6. **Date Format**: Backend return ISO 8601 strings. Frontend perlu format sesuai locale.

---

## Support

Untuk pertanyaan atau issue, silakan hubungi backend team atau buka issue di repository.
