# Bazar Backend

A Node.js backend API for Bazar e-commerce web application built with TypeScript, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (User, Admin)
- **Email Verification**: Secure email verification flow for new signups
- **Product Management**: CRUD operations for products with category support
- **Order Management**: Complete order lifecycle management
- **Category Management**: Product categorization system
- **Security**: Helmet, CORS, input validation with class-validator
- **Logging**: Winston-based logging system
- **Database**: MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, CORS
- **Logging**: Winston
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── config/           # Database configuration
│   ├── controllers/      # Route handlers
│   ├── dtos/            # Data Transfer Objects
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Data models
│   ├── modules/         # Feature modules (Auth, Menu, etc.)
│   ├── repositories/    # Data access layer
│   ├── services/        # Business logic
│   ├── shared/          # Shared utilities
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   ├── routes.ts        # Route definitions
│   └── server.ts        # Server entry point
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cute-bazar/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/cute_bazar
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FRONTEND_URL=http://localhost:4200
   ```

4. **Build and run**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (triggers verification email)
- `POST /api/auth/login` - User login (requires verified email)
- `GET /api/auth/verify-email?token=...` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders` - Get all orders (Admin only)

## User Roles

- **User**: Can browse products, place orders, manage their profile
- **Admin**: All permissions + can manage categories, view all orders, manage products, manage users

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Code Style

- Uses ESLint for code linting
- TypeScript strict mode enabled
- Follows clean architecture principles

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/cute_bazar |
| `JWT_SECRET` | JWT secret key | your_jwt_secret_key |
| `JWT_REFRESH_SECRET` | JWT refresh secret | your_jwt_refresh_secret_key |
| `SMTP_HOST` | SMTP server host | smtp.gmail.com |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_USER` | SMTP username | your_email@gmail.com |
| `SMTP_PASS` | SMTP password | your_app_password |
| `FRONTEND_URL` | Frontend application URL | http://localhost:4200 |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `LOG_LEVEL` | Logging level | info |

## License

This project is licensed under the MIT License.