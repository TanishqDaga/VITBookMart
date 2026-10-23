# VITBookMart

A marketplace for VIT students to buy, sell, and rent books, notes, and calculators. Students sign in with their VIT Google account and contact sellers through WhatsApp.

## Features

- Google sign-in restricted to `@vitstudent.ac.in`
- Create, edit, sell, and relist items
- Search and filter listings by title, subject, category, and type
- Pagination for browsing listings
- Wishlist for saving items
- WhatsApp links to contact sellers
- Admin portal to manage users and listings
- Image upload and optimization through Cloudinary
- Redis caching for faster listing reads
- JWT-based authentication and role-based admin access

## Tech Stack

- **Backend:** Java 17, Spring Boot, Maven
- **Student and Admin Frontends:** React, TypeScript, Vite, Tailwind CSS
- **Database:** MongoDB
- **Caching:** Redis
- **Images:** Cloudinary
- **Authentication:** Google OAuth 2.0, Spring Security, JWT
- **Deployment:** Docker and AWS

## Project Structure

```text
.
├── backend/         Spring Boot REST API
├── frontend/        Student marketplace
└── admin-frontend/  Admin portal
```

## How It Works

1. Students use the React frontend to browse or manage listings.
2. The Spring Boot API handles requests and checks access permissions.
3. MongoDB stores users, listings, wishlists, and admin data.
4. Redis caches frequently requested listing data.
5. Cloudinary stores listing images; MongoDB stores their URLs.

## Run Locally

### Requirements

Install Java 17, Node.js 18+, MongoDB, and Redis. You will also need Cloudinary and Google OAuth credentials.

### 1. Start the Backend

```bash
cd backend
```

Configure these environment variables before starting:

```text
Mongo_URL
REDIS_HOST
REDIS_PORT
REDIS_USERNAME
REDIS_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
JWT_SECRET
```

Use valid values for your environment. `JWT_SECRET` must be a sufficiently long, Base64-encoded secret. The Google redirect URI must match the frontend configuration.

Run the application:

```bash
./mvnw spring-boot:run
```

On Windows, use:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs on `http://localhost:8080`.

### 2. Start the Student Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file based on `.env.example` and set your Google client ID and redirect URI.

```bash
npm run dev
```

The student app runs on `http://localhost:5173`.

### 3. Start the Admin Portal

Open another terminal:

```bash
cd admin-frontend
npm install
npm run dev
```

The admin portal's configured Vite port may need to be set to `5174` in `vite.config.ts` to avoid conflicting with the student frontend.

## Useful Commands

From `frontend/` or `admin-frontend/`:

```bash
npm install
npm run dev
npm run build
```

For the backend, build with:

```bash
./mvnw clean package
```

## API Overview

The backend API uses the `/api` base path.

| Area | Examples |
|---|---|
| Authentication | `/api/auth/google`, `/api/auth/refresh` |
| Listings | `/api/listings`, `/api/listings/latest`, `/api/listings/search` |
| User profile | `/api/users/me` |
| My listings | `/api/users/my/listings` |
| Wishlist | `/api/wishlist/my` |
| Admin | `/api/admin/**` |
| Health check | `/api/health` |

Public listing reads are available without signing in. Creating or changing listings requires authentication. Admin endpoints require admin access.

## Caching and Images

- Redis caches individual listings for 12 hours and listing feeds/search results for 2 hours.
- Listing changes invalidate the relevant caches.
- Images are checked before upload and stored in Cloudinary.
- Smaller, optimized thumbnails are used in listing grids.

## Security

- Only `@vitstudent.ac.in` Google accounts can sign in.
- JWTs protect authenticated endpoints.
- Admin access is separate from student access.
- Admin passwords are stored as BCrypt hashes.
- Users can update only their own listings.

## Deployment

The backend can be packaged with Docker. The frontend applications build into static files that can be hosted on a static hosting service. Production domains must be included in the backend CORS allow-list.

## Health Check

After starting the backend, visit:

```text
http://localhost:8080/api/health
```

A healthy service returns:

```json
{"status":"UP"}
```
