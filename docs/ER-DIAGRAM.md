# Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Project : "owns (ON DELETE CASCADE)"
    User ||--o{ Task : "owns (ON DELETE CASCADE)"
    Project ||--o{ Task : "contains (ON DELETE CASCADE)"
    User ||--o{ RefreshToken : "has (ON DELETE CASCADE)"
    User |o--o{ AuditLog : "performed (ON DELETE SET NULL)"

    User {
        int id PK
        string fullName
        string email UK
        string password "bcrypt hash"
        enum role "USER | ADMIN"
        datetime createdAt
    }
    RefreshToken {
        int id PK
        string tokenHash UK "SHA-256 of the token"
        datetime expiresAt
        datetime revokedAt
        int userId FK
    }
    AuditLog {
        int id PK
        string action
        string entity
        int entityId
        string details
        datetime createdAt
        int userId FK
    }
    Project {
        int id PK
        string name
        string description
        enum status "NOT_STARTED | IN_PROGRESS | COMPLETED"
        datetime startDate
        datetime endDate
        datetime createdAt
        int userId FK
    }
    Task {
        int id PK
        string name
        string description
        enum priority "LOW | MEDIUM | HIGH"
        enum status "PENDING | IN_PROGRESS | COMPLETED"
        datetime dueDate
        datetime createdAt
        int projectId FK
        int userId FK
    }
```

Source of truth: `backend/prisma/schema.prisma` and `backend/prisma/migrations/`.
