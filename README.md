# Printing Etc Backend

Backend API for Printing Etc - A printing and stationery e-commerce platform.

## Features

- **JWT-based Authentication**: Secure user authentication with JSON Web Tokens
- **Password Hashing**: Passwords are hashed using bcrypt for security
- **Guest Checkout**: Users can checkout without creating an account
- **User Accounts**: Registered users can create accounts and manage their profiles
- **Product Management**: CRUD operations for printing products and services
- **Order Processing**: Complete order management system with status tracking
- **File Uploads**: Support for uploading print files (PDF, images, design files)
- **Cloudinary Integration**: Cloud storage for uploaded files and product images
- **Stripe Payments**: Secure payment processing with Stripe
- **Order Tracking**: Track orders with unique order numbers

## Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **bcrypt** for password hashing
- **Celebrate/Joi** for request validation
- **Winston** for logging
- **Helmet** for security headers
- **Rate Limiting** to prevent abuse
- **Multer** for file upload handling
- **Cloudinary** for file storage
- **Stripe** for payment processing

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Cloudinary account (for file storage)
- Stripe account (for payment processing)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret key
   - Cloudinary credentials
   - Stripe API keys

4. Start MongoDB (if running locally):

```bash
mongod
```

5. Run the server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3002` by default.

## API Endpoints

### Authentication

#### Sign Up

- **POST** `/signup`
- Creates a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "1234567890"
  }
  ```

#### Sign In

- **POST** `/signin`
- Authenticates a user and returns a JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Users (Protected)

#### Get Current User

- **GET** `/users/me`
- Returns current user's profile
- **Requires**: Bearer token

#### Update User Profile

- **PATCH** `/users/me`
- Updates current user's profile
- **Requires**: Bearer token

### Products

#### Get All Products

- **GET** `/products`
- Query params: `category`, `featured`, `inStock`

#### Get Product by ID

- **GET** `/products/:productId`

#### Create Product (Admin)

- **POST** `/products`
- **Requires**: Admin authorization

#### Update Product (Admin)

- **PATCH** `/products/:productId`
- **Requires**: Admin authorization

#### Delete Product (Admin)

- **DELETE** `/products/:productId`
- **Requires**: Admin authorization

### Orders

#### Create Order

- **POST** `/orders`
- Supports both authenticated and guest checkout

#### Get User Orders

- **GET** `/orders/me`
- **Requires**: Bearer token

#### Get Order by ID

- **GET** `/orders/:orderId`

#### Get Order by Number

- **GET** `/orders/number/:orderNumber`
- Query param: `email` (for guest verification)

#### Update Order Status (Admin)

- **PATCH** `/orders/:orderId/status`
- **Requires**: Admin authorization

#### Cancel Order

- **PATCH** `/orders/:orderId/cancel`
- **Requires**: Bearer token

### File Upload

#### Upload Single File

- **POST** `/upload/single`
- Supports: PDF, JPG, PNG, AI, PSD, EPS
- Max size: 50MB

#### Upload Multiple Files

- **POST** `/upload/multiple`
- Up to 10 files
- Max size per file: 50MB

### Payment

#### Create Payment Intent

- **POST** `/payment/create-payment-intent`
- **Request Body**:
  ```json
  {
    "amount": 99.99,
    "currency": "usd",
    "metadata": {}
  }
  ```

#### Confirm Payment

- **POST** `/payment/confirm-payment`
- **Request Body**:
  ```json
  {
    "paymentIntentId": "pi_xxx"
  }
  ```

#### Stripe Webhook

- **POST** `/payment/webhook`
- Handles Stripe webhook events

#### Create Refund (Admin)

- **POST** `/payment/refund`
- **Requires**: Admin authorization

## Product Categories

- business-cards
- flyers
- brochures
- posters
- banners
- stationery
- invitations
- custom-printing
- other

## Order Status Workflow

1. **pending**: Order created, payment pending
2. **confirmed**: Payment successful
3. **processing**: Order is being prepared
4. **shipped**: Order has been shipped
5. **delivered**: Order delivered to customer
6. **cancelled**: Order cancelled

## Environment Variables

See `.env.example` for all required environment variables:

- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Security Features

- Helmet.js for security headers
- CORS with configurable origins
- Rate limiting (100 requests per 15 minutes)
- JWT authentication with 7-day expiration
- Password hashing with bcrypt
- Request validation with Joi
- MongoDB injection protection

## Error Handling

The API uses standardized error responses:

```json
{
  "message": "Error description"
}
```

HTTP Status Codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## License

ISC

# Development mode with auto-reload

npm run dev

# Production mode

npm start

````

The server will start on `http://localhost:3002` by default.

## API Endpoints

### Public Routes (No Authentication Required)

#### Sign Up
- **POST** `/signup`
- Creates a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "1234567890" // optional
  }
````

- **Response**: User object (without password)

#### Sign In

- **POST** `/signin`
- Authenticates a user and returns a JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt-token-here",
    "user": {
      "_id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "1234567890"
    }
  }
  ```

### Protected Routes (Authentication Required)

All protected routes require the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

#### Get Current User

- **GET** `/users/me`
- Returns the current user's information

#### Update User Profile

- **PATCH** `/users/me`
- Updates the current user's profile
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "phone": "0987654321"
  }
  ```

## Guest Checkout

For guest checkout functionality, no authentication is required. Users can:

- Browse products (to be implemented)
- Add items to cart (to be implemented)
- Complete checkout without signing up (to be implemented)

## Security Features

- **Helmet.js**: Sets secure HTTP headers
- **Rate Limiting**: Prevents too many requests from a single IP
- **Password Hashing**: Uses bcrypt with salt rounds
- **JWT Expiration**: Tokens expire after 7 days
- **CORS**: Configured for specific origins in production
- **Input Validation**: All inputs are validated using Celebrate/Joi

## Error Handling

The API uses custom error classes with appropriate HTTP status codes:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error

## Development

```bash
# Run with auto-reload
npm run dev

# Lint code
npm run lint
```

## Project Structure

```
printing_etc-backend/
├── app.js                 # Main application file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── config/
│   └── config.js         # Configuration settings
├── controllers/
│   └── users.js          # User-related business logic
├── errors/
│   ├── BadRequestError.js
│   ├── UnauthorizedError.js
│   ├── ForbiddenError.js
│   ├── NotFoundError.js
│   ├── ConflictError.js
│   └── errors.js         # Error exports
├── middlewares/
│   ├── auth.js           # JWT authentication middleware
│   ├── errorHandler.js   # Global error handler
│   ├── logger.js         # Request/error logging
│   └── validation.js     # Request validation schemas
├── models/
│   └── user.js           # User database model
└── routes/
    ├── index.js          # Main router
    └── users.js          # User routes
```

## Next Steps

- [ ] Implement product models and routes
- [ ] Implement cart functionality
- [ ] Implement order system
- [ ] Implement guest checkout
- [ ] Add address management for users
- [ ] Add payment integration (Stripe)
- [ ] Add email notifications
- [ ] Add admin panel authentication

## License

ISC
