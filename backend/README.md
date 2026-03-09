# FaceHRM Backend API

Laravel 11 REST API for FaceHRM - Authentication & Role-based Access Control.

## Quick Start (Docker)

```bash
# From project root (FaceHRM/)
cd docker
docker-compose up -d

# Install dependencies inside container
docker exec facehrm_app composer install

# Generate app key
docker exec facehrm_app php artisan key:generate

# Run migrations + seed
docker exec facehrm_app php artisan migrate --seed
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/login | Public | Login |
| POST | /api/v1/auth/logout | Bearer | Logout |
| GET | /api/v1/auth/me | Bearer | Get current user |
| PUT | /api/v1/auth/profile | Bearer | Update profile |

## Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | 12345678 | admin |
| hr@example.com | 12345678 | hr |
| staff@example.com | 12345678 | staff |

## Response Format

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": { ... } }
```
