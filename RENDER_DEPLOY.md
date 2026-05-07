# Render Deployment Guide for Printing Etc Backend

## Quick Deploy to Render (Free)

### Prerequisites

1. Push your backend code to GitHub
2. Have a MongoDB Atlas account (free tier)
3. Have your Cloudinary and Stripe credentials ready

### Step-by-Step Deployment

#### 1. Push to GitHub (if not already done)

```bash
cd /Users/williamhasrouty/projects/printing_etc-backend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/williamhasrouty/printing_etc-backend.git
git push -u origin main
```

#### 2. Set up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Get your connection string (looks like: mongodb+srv://username:password@cluster.mongodb.net/printingetc)

#### 3. Deploy on Render

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (printing_etc-backend)
4. Render will detect the render.yaml file

5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `CLOUDINARY_CLOUD_NAME`: From Cloudinary dashboard
   - `CLOUDINARY_API_KEY`: From Cloudinary dashboard
   - `CLOUDINARY_API_SECRET`: From Cloudinary dashboard
   - `STRIPE_SECRET_KEY`: From Stripe dashboard
   - `STRIPE_WEBHOOK_SECRET`: From Stripe webhook settings
   - `RESEND_API_KEY`: From Resend dashboard (for emails)

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your service URL (will be something like: https://printing-etc-backend.onrender.com)

#### 4. Update Frontend

After deployment, you'll need to update the frontend to use your backend URL:

- Set VITE_API_URL environment variable in the frontend
- Redeploy the frontend to GitHub Pages

#### 5. Test

Visit your frontend at: https://williamhasrouty.github.io/printing_etc
Products should now load from your live backend!

## Alternative: Railway (Another Free Option)

If you prefer Railway:

1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select your backend repository
4. Add environment variables from .env.example
5. Deploy!

## Notes

- Free tier on Render spins down after 15 minutes of inactivity
- First request after spin-down will be slow (~30 seconds)
- For production use, consider paid tier for always-on service
