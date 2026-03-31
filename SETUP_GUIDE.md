# Quick Setup Guide for Printing Etc Backend

## What's Been Built

The backend now includes:

✅ **User Authentication System**

- Sign up, sign in with JWT
- User profile management
- Guest checkout support

✅ **Product Management**

- Full CRUD operations
- Product categories (business cards, flyers, brochures, etc.)
- Product options (sizes, paper types, finishes, colors)
- Support for multiple product images

✅ **Order System**

- Create orders (authenticated & guest)
- Order tracking with unique order numbers
- Order status management
- User order history

✅ **File Upload System**

- Single and multiple file uploads
- Support for PDF, images, and design files
- Cloudinary integration for cloud storage

✅ **Payment Processing**

- Stripe payment intent creation
- Payment confirmation
- Webhook handling for payment events
- Refund support

## Next Steps

### 1. Install Dependencies

```bash
cd printing_etc-backend
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then update `.env` with your credentials:

```env
# MongoDB - Use local or cloud (MongoDB Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/printingetc

# JWT Secret - Generate a strong random key
JWT_SECRET=your-super-secret-key-here

# Cloudinary - Sign up at https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 3. Start MongoDB

If running locally:

```bash
mongod
```

Or use MongoDB Atlas for cloud hosting.

### 4. Run the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Server will be available at `http://localhost:3002`

### 5. Test the API

You can use tools like:

- **Postman** - Import the API endpoints
- **curl** - Command line testing
- **Thunder Client** (VS Code extension)

Example test:

```bash
# Health check
curl http://localhost:3002/

# Create a user
curl -X POST http://localhost:3002/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 6. Seed Products (Optional)

You may want to create a seed script to populate initial products. Create `seeds/products.js`:

```javascript
const Product = require("../models/product");

const sampleProducts = [
  {
    name: "Business Cards - Standard",
    description: "Professional business cards with premium finish",
    category: "business-cards",
    basePrice: 29.99,
    imageUrl: "https://example.com/business-card.jpg",
    images: [],
    options: {
      sizes: [
        { name: 'Standard (3.5" x 2")', dimensions: "3.5x2", priceModifier: 0 },
        {
          name: 'Square (2.5" x 2.5")',
          dimensions: "2.5x2.5",
          priceModifier: 5,
        },
      ],
      paperTypes: [
        { name: "Standard", priceModifier: 0 },
        { name: "Premium Matte", priceModifier: 10 },
        { name: "Glossy", priceModifier: 10 },
      ],
    },
    inStock: true,
    featured: true,
  },
  // Add more products...
];
```

### 7. Configure Stripe Webhook

For local development with Stripe webhooks:

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3002/payment/webhook`
4. Copy the webhook secret to your `.env` file

### 8. Frontend Integration

Update your frontend API base URL to point to:

- Development: `http://localhost:3002`
- Production: Your deployed backend URL

## API Documentation

See [README.md](./README.md) for complete API documentation including:

- All available endpoints
- Request/response formats
- Authentication requirements
- Error codes

## Admin Features (TODO)

The following features are marked as needing admin authentication:

- Create/Update/Delete products
- View all orders
- Update order status
- Process refunds

To implement admin functionality:

1. Add an `isAdmin` field to the User model
2. Create an admin authorization middleware
3. Apply the middleware to protected routes

Example admin middleware (`middlewares/admin.js`):

```javascript
const { ForbiddenError } = require("../errors/errors");

const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(new ForbiddenError("Admin access required"));
  }
  next();
};

module.exports = requireAdmin;
```

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For Atlas, ensure IP whitelist is configured

### Cloudinary Uploads Failing

- Verify credentials in `.env`
- Check file size (max 50MB)
- Ensure file type is supported

### Stripe Payments Not Working

- Use test mode keys during development
- Verify webhook secret is correct
- Check Stripe dashboard for payment intent status

### Port Already in Use

Change the port in `.env`:

```env
PORT=3003
```

## Support

For issues or questions:

1. Check the README.md
2. Review error logs in the console
3. Check MongoDB logs
4. Review Stripe dashboard for payment issues
