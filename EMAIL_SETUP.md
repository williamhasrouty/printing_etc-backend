# Email Notifications Setup Guide

This guide explains how to set up automated email notifications for your Printing Etc e-commerce platform using Resend.

## Overview

The application sends three types of transactional emails:

1. **Order Confirmation** - Sent immediately when order is created
2. **Payment Receipt** - Sent when payment is confirmed via Stripe webhook
3. **Status Updates** - Sent when order status changes (shipped, delivered, etc.)

## Prerequisites

- Resend account (free tier available)
- Domain for sending emails (or use Resend's testing domain)
- Access to your backend's `.env` file

---

## Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

**Free tier includes:**

- 100 emails/day
- 3,000 emails/month
- Perfect for testing and small-scale production

---

## Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to "API Keys" in the left sidebar
3. Click "Create API Key"
4. Name it (e.g., "Printing Etc Production")
5. Set permissions to "Sending access"
6. Copy the API key (starts with `re_`)

⚠️ **Important**: Save this key securely. You won't be able to see it again!

---

## Step 3: Configure Your Domain (Optional but Recommended)

### Option A: Use Your Own Domain (Professional)

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `printingetc.com`)
4. Add the provided DNS records to your domain registrar:
   - MX record
   - TXT records (SPF, DKIM)
5. Wait for verification (usually 5-15 minutes)

**Benefits:**

- Professional appearance (`orders@printingetc.com`)
- Better deliverability
- Increased trust from customers

### Option B: Use Resend's Testing Domain (Quick Start)

- Use `onboarding@resend.dev` as your sender
- Good for testing and development
- Limited to 100 emails/day

---

## Step 4: Update Environment Variables

Add the following to your `.env` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Printing Etc <orders@printingetc.com>
```

**For development:**

```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Printing Etc <onboarding@resend.dev>
```

**For production:**

```bash
RESEND_API_KEY=re_your_production_api_key_here
EMAIL_FROM=Printing Etc <orders@printingetc.com>
```

---

## Step 5: Test Email Sending

### Test Order Confirmation Email

1. Create a new order through your application
2. Check the terminal/logs for:
   ```
   ✅ Order confirmation email sent to customer@email.com (email_id)
   ```
3. Check your email inbox

### Test Payment Receipt Email

1. Complete a payment for an order
2. Stripe webhook will trigger the payment receipt email
3. Check terminal for:
   ```
   ✅ Payment receipt email sent to customer@email.com (email_id)
   ```

### Test Status Update Email

1. Update an order status via admin dashboard
2. Choose a status like "shipped" or "processing"
3. Add tracking number if shipping
4. Check terminal for:
   ```
   ✅ Status update email sent to customer@email.com (shipped) (email_id)
   ```

---

## Email Templates Included

### 1. Order Confirmation Email

**Sent:** When order is created  
**Includes:**

- Order number and date
- Itemized list of products
- Pricing breakdown (subtotal, tax, shipping, total)
- Discount information (if applicable)
- Shipping address
- Link to track order

### 2. Payment Receipt Email

**Sent:** When payment is confirmed  
**Includes:**

- Payment confirmation message
- Total amount paid
- Transaction ID
- Receipt details
- Link to view order

### 3. Status Update Emails

**Sent:** When order status changes  
**Includes:**

- Current status with icon
- Status-specific messages:
  - **Confirmed:** "Order confirmed and being prepared"
  - **Processing:** "We're working on your order"
  - **Shipped:** "Order on its way" + tracking number
  - **Delivered:** "Order delivered" + feedback request
  - **Cancelled:** "Order cancelled"
- Updated timestamp
- Link to track order

---

## Email Deliverability Best Practices

### 1. Verify Your Domain

- Add SPF, DKIM, and DMARC records
- This significantly improves deliverability

### 2. Use a Professional Sender Address

- ✅ `orders@printingetc.com`
- ✅ `noreply@printingetc.com`
- ❌ `gmail.com` or `yahoo.com` addresses

### 3. Monitor Email Activity

- Check Resend dashboard for:
  - Delivery rate
  - Bounce rate
  - Complaint rate
- Take action if bounce rate exceeds 5%

### 4. Handle Bounces

- Resend automatically handles hard bounces
- Monitor soft bounces in your dashboard
- Remove invalid emails from your system

---

## Troubleshooting

### Emails Not Sending

**Check 1: API Key is Set**

```bash
# In terminal
echo $RESEND_API_KEY
# Should show: re_xxxxx...
```

**Check 2: Console Logs**
Look for these messages:

```
⚠️  Email service not configured. Skipping order confirmation email.
```

If you see this, your API key is not set correctly.

**Check 3: Resend Dashboard**

- Go to "Logs" in Resend dashboard
- Check if emails are being sent
- Look for error messages

### Emails Going to Spam

**Solution 1: Verify Your Domain**
Properly configure SPF, DKIM, and DMARC records

**Solution 2: Warm Up Your Domain**

- Start with 10-20 emails/day
- Gradually increase over 2-3 weeks
- Monitor delivery metrics

**Solution 3: Improve Email Content**

- Avoid spam trigger words
- Include physical address in footer (already done)
- Maintain good text-to-image ratio

### Wrong Sender Address

Update `EMAIL_FROM` in `.env`:

```bash
EMAIL_FROM=Printing Etc <orders@yourdomain.com>
```

Then restart your server:

```bash
pm2 restart printing-etc-backend
```

---

## Monitoring & Analytics

### View Email Analytics in Resend

1. Log in to Resend dashboard
2. Go to "Analytics"
3. Monitor:
   - Sent emails
   - Delivered emails
   - Bounced emails
   - Clicked links

### Server Logs

Check your application logs for email sending status:

```bash
# PM2
pm2 logs printing-etc-backend | grep email

# Docker
docker logs container_name | grep email

# Direct
tail -f logs/app.log | grep email
```

---

## Cost Estimation

### Resend Pricing

**Free Tier:**

- 3,000 emails/month
- 100 emails/day
- Perfect for: 0-100 orders/month

**Pro Tier ($20/month):**

- 50,000 emails/month
- Unlimited daily sending
- Priority support
- Perfect for: 100-1,500 orders/month

**Email Usage Per Order:**

- Order confirmation: 1 email
- Payment receipt: 1 email
- Status updates: 1-3 emails (processing, shipped, delivered)

**Average:** 3-5 emails per order

### Example Calculations

**100 orders/month:**

- Email usage: 300-500 emails
- Cost: Free tier ✅

**500 orders/month:**

- Email usage: 1,500-2,500 emails
- Cost: Free tier ✅

**2,000 orders/month:**

- Email usage: 6,000-10,000 emails
- Cost: Pro tier ($20/month) ✅

---

## Security Considerations

### API Key Security

✅ **Do:**

- Store API key in `.env` file
- Add `.env` to `.gitignore`
- Use different keys for dev/production
- Rotate keys periodically

❌ **Don't:**

- Commit API keys to Git
- Share API keys publicly
- Use production keys in development

### Email Content Security

The email templates are HTML-based with:

- ✅ No executable JavaScript
- ✅ Inline CSS (maximum compatibility)
- ✅ Sanitized user input
- ✅ Secure links to your domain

---

## Advanced Configuration

### Custom Email Templates

Edit `/utils/email.js` to customize:

1. Email styling (colors, fonts)
2. Email content and messaging
3. Add your logo/branding

### Email Preferences

Future enhancement: Allow users to manage email preferences

- Opt out of marketing emails
- Choose notification frequency
- Preferences stored in user model

### Internationalization

To add multi-language support:

1. Detect user's language preference
2. Load appropriate email template
3. Use i18n library for translations

---

## Support & Resources

### Resend Documentation

- [Resend Docs](https://resend.com/docs)
- [Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [API Reference](https://resend.com/docs/api-reference)

### Need Help?

1. Check Resend status page
2. Review [Resend community](https://github.com/resendlabs/resend-node/discussions)
3. Contact Resend support (Pro tier only)

---

## Checklist

Before going to production:

- [ ] Resend account created
- [ ] API key generated and added to `.env`
- [ ] Domain verified (or using Resend test domain)
- [ ] SPF, DKIM, DMARC records configured
- [ ] Test emails sent successfully
- [ ] Sender address configured (`EMAIL_FROM`)
- [ ] Emails not going to spam
- [ ] Order confirmation emails working
- [ ] Payment receipt emails working
- [ ] Status update emails working
- [ ] Monitoring set up in Resend dashboard

---

## Summary

Your email notification system is now configured with:

✅ **Professional transactional emails**  
✅ **Automated sending at key points**  
✅ **Beautiful HTML templates**  
✅ **Reliable delivery via Resend**  
✅ **Production-ready implementation**

Customers will now receive:

1. Immediate order confirmation
2. Payment receipt when payment clears
3. Updates as order progresses to delivery

**Next Steps:**

1. Add your Resend API key to `.env`
2. Configure your sending domain
3. Test all email types
4. Monitor deliverability in Resend dashboard
