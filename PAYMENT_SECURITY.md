# 🔒 SECURE PAYMENT PROCESSING - Implementation Guide

## ⚠️ CRITICAL SECURITY PRINCIPLE

**NEVER TRUST THE FRONTEND TO CONFIRM PAYMENT**

Payment confirmation MUST ONLY come from Stripe webhooks, never from the frontend. This prevents fraud where malicious users could mark orders as "paid" without actually paying.

---

## 🔄 Correct Payment Flow

### Step-by-Step Process

```
1. User creates order
   ↓
2. Backend creates order with status="pending"
   ↓
3. Frontend requests Stripe checkout session
   ↓
4. Backend creates Stripe Checkout Session
   ↓
5. User is redirected to Stripe's hosted checkout page
   ↓
6. User completes payment on Stripe
   ↓
7. Stripe sends webhook to backend
   ↓
8. Backend verifies webhook signature
   ↓
9. Backend marks order as "confirmed" ✅
   ↓
10. User is redirected to success page
```

---

## 📝 API Endpoints

### 1. Create Order (Pending Payment)

**POST** `/orders`

**Request Body:**

```json
{
  "items": [...],
  "subtotal": 99.99,
  "discount": {
    "code": "SAVE20",
    "amount": 19.99
  },
  "tax": 8.00,
  "shipping": 5.99,
  "total": 94.98,
  "shippingAddress": {...},
  "guestInfo": {...},  // Optional for guest checkout
  "notes": "Special instructions"
}
```

**Response:**

```json
{
  "_id": "order_id_here",
  "orderNumber": "PE-ABC123-XY45",
  "status": "pending",
  "paymentInfo": {
    "method": "card",
    "status": "pending"
  },
  ...
}
```

**⚠️ IMPORTANT:**

- Order is created with `status: "pending"`
- Payment status is `"pending"`
- Frontend CANNOT set these values!

---

### 2. Create Checkout Session

**POST** `/payment/checkout`

**Request Body:**

```json
{
  "orderId": "order_id_here"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_abc123...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_abc123..."
}
```

**Frontend Action:**

```javascript
// Redirect user to Stripe checkout
window.location.href = response.url;
```

**⚠️ Security Notes:**

- Only works for orders with `status: "pending"`
- Session ID is stored in order for reference only
- Session ID CANNOT be used to verify payment!

---

### 3. Stripe Webhook (Backend Only)

**POST** `/payment/webhook`

**⚠️ CRITICAL:** This endpoint:

- Is called by Stripe servers (not frontend)
- Verifies webhook signature for security
- Is the ONLY place where order status changes to "confirmed"

**Events Handled:**

#### `checkout.session.completed`

```javascript
// Payment successful
order.status = "confirmed";
order.paymentInfo.status = "succeeded";
order.paymentInfo.stripePaymentIntentId = session.payment_intent;
```

#### `checkout.session.expired`

```javascript
// Payment session expired
order.paymentInfo.status = "failed";
```

#### `charge.refunded`

```javascript
// Order refunded
order.status = "cancelled";
order.paymentInfo.status = "refunded";
```

---

### 4. Check Session Status (Optional)

**GET** `/payment/session/:sessionId`

**Response:**

```json
{
  "status": "paid",
  "customerEmail": "user@example.com",
  "amountTotal": 94.98
}
```

**Use Case:**

- Frontend can poll this to check if payment completed
- Useful for showing loading state
- Still should redirect to success page from Stripe

---

## 🚀 Frontend Implementation

### Example Flow (React)

```javascript
// 1. Create Order
const createOrderAndCheckout = async () => {
  try {
    // Step 1: Create order (pending payment)
    const orderResponse = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems,
        subtotal: 99.99,
        tax: 8.00,
        shipping: 5.99,
        total: 113.98,
        shippingAddress: {...},
        guestInfo: {...}
      })
    });

    const order = await orderResponse.json();
    console.log('Order created:', order.orderNumber);

    // Step 2: Create Stripe checkout session
    const checkoutResponse = await fetch('/payment/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order._id
      })
    });

    const { url } = await checkoutResponse.json();

    // Step 3: Redirect to Stripe
    window.location.href = url;

  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Success Page

```javascript
// /order/success page
const OrderSuccess = () => {
  const [order, setOrder] = useState(null);
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id",
  );

  useEffect(() => {
    // Optionally verify session and fetch order
    const verifyPayment = async () => {
      const response = await fetch(`/payment/session/${sessionId}`);
      const data = await response.json();

      if (data.status === "paid") {
        // Payment confirmed! Show success message
        // Fetch order details, clear cart, etc.
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div>
      <h1>Payment Successful! ✅</h1>
      <p>Your order has been confirmed.</p>
    </div>
  );
};
```

---

## 🔧 Setup & Configuration

### 1. Environment Variables

Add to `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:3000  # or your production URL
```

### 2. Stripe Webhook Setup

#### Development (using Stripe CLI):

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3002/payment/webhook

# Copy the webhook secret (starts with whsec_) to .env
```

#### Production:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/payment/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
5. Copy the webhook secret to your production `.env`

### 3. CORS Configuration

Ensure your backend allows requests from your frontend:

```javascript
// In app.js
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production" ? [process.env.FRONTEND_URL] : "*",
  credentials: true,
};
app.use(cors(corsOptions));
```

---

## ✅ Security Checklist

- [x] **Order creation does NOT accept payment status from frontend**
- [x] **Payment status ONLY updated via webhook**
- [x] **Webhook signature is verified**
- [x] **Stripe Checkout Session used (not Payment Intents)**
- [x] **Order starts with status="pending"**
- [x] **Only webhook can change status to "confirmed"**
- [x] **Session ID stored for reference only (not verification)**
- [x] **Webhook secret is kept secure in environment variables**

---

## 🚨 Common Security Mistakes (AVOID THESE!)

### ❌ WRONG - Trusting Frontend

```javascript
// NEVER DO THIS!
const createOrder = async (req, res) => {
  const { paymentStatus } = req.body; // ❌ Frontend could fake this!

  const order = await Order.create({
    status: paymentStatus === "paid" ? "confirmed" : "pending", // ❌ INSECURE!
  });
};
```

### ❌ WRONG - Confirming Payment in Frontend

```javascript
// NEVER DO THIS!
const confirmPayment = async () => {
  await fetch("/orders/123/confirm", { method: "POST" }); // ❌ INSECURE!
};
```

### ❌ WRONG - Not Verifying Webhook Signature

```javascript
// NEVER DO THIS!
const handleWebhook = (req, res) => {
  const event = req.body;  // ❌ Could be fake!

  // Update order without verifying signature ❌ INSECURE!
  Order.findOneAndUpdate(...);
};
```

### ✅ CORRECT - Webhook Only

```javascript
// ✅ SECURE
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  // Verify signature first! ✅
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    STRIPE_WEBHOOK_SECRET,
  );

  if (event.type === "checkout.session.completed") {
    // Payment verified by Stripe ✅
    await Order.findByIdAndUpdate(orderId, {
      status: "confirmed",
      "paymentInfo.status": "succeeded",
    });
  }
};
```

---

## 🧪 Testing

### Test Payment Flow

1. **Create test order:**

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "subtotal": 100,
    "tax": 8,
    "shipping": 5,
    "total": 113,
    "shippingAddress": {...},
    "guestInfo": {...}
  }'
```

2. **Create checkout session:**

```bash
curl -X POST http://localhost:3002/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID"}'
```

3. **Open the returned URL in browser and complete test payment**

4. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Any future expiry, any CVC

5. **Check order status:**

```bash
curl http://localhost:3002/orders/ORDER_ID
```

Should show:

```json
{
  "status": "confirmed",
  "paymentInfo": {
    "status": "succeeded",
    "stripePaymentIntentId": "pi_..."
  }
}
```

### Test Webhook Locally

```bash
# Start Stripe webhook forwarding
stripe listen --forward-to localhost:3002/payment/webhook

# In another terminal, trigger test webhook
stripe trigger checkout.session.completed
```

---

## 📊 Order Status Workflow

```
                    CREATE ORDER
                         ↓
                    ┌─────────┐
                    │ PENDING │ ← Order created
                    └─────────┘
                         ↓
              User pays via Stripe
                         ↓
              ┌──────────────────┐
              │ Webhook Received │
              └──────────────────┘
                    ↓         ↓
           Payment OK?    Payment Failed?
                 ✅              ❌
                 ↓               ↓
          ┌───────────┐    ┌─────────┐
          │ CONFIRMED │    │ PENDING │
          └───────────┘    └─────────┘
                 ↓               ↓
          ┌───────────┐    (User can retry)
          │PROCESSING │
          └───────────┘
                 ↓
          ┌───────────┐
          │  SHIPPED  │
          └───────────┘
                 ↓
          ┌───────────┐
          │ DELIVERED │
          └───────────┘
```

---

## 🎯 Key Takeaways

1. **Backend creates order** with `status: "pending"`
2. **Backend creates Stripe session** linked to order
3. **User pays** on Stripe's hosted page
4. **Stripe webhook** confirms payment to backend
5. **Backend updates** order to `status: "confirmed"`
6. **Frontend** shows success (but doesn't control payment status)

**The golden rule:**

> Payment status is ONLY set by the backend via webhook, NEVER by the frontend.

---

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Security Best Practices](https://stripe.com/docs/security)

---

**Remember: Payment security is not optional. Always verify payments server-side!** 🔒
