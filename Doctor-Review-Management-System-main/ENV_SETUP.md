# Environment Variables Setup

## Server (.env)

```env
# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Email (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Stripe (for payments - optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

## Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

## Email Setup (Gmail Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in EMAIL_PASS

## Stripe Setup (Optional)

1. Sign up at https://stripe.com
2. Get your API keys from Dashboard
3. Use test keys for development
4. Use live keys for production

## Notes

- Email service works in mock mode if credentials not provided (logs to console)
- Payment works in mock mode if Stripe not configured
- All features work without email/Stripe, but notifications won't be sent

