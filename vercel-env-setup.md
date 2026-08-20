# Vercel Environment Variables Setup

## Required Environment Variables for CORS

Add these to your Vercel project settings:

```
CLIENT_URL=https://frontend-koaci-reporting-web.vercel.app
FRONTEND_URL=https://frontend-koaci-reporting-web.vercel.app
```

## Steps to update Vercel environment variables:

1. Go to your Vercel dashboard
2. Select your backend project: `backend-koaci-reporting`
3. Go to Settings → Environment Variables
4. Add/update these variables for both **Production** and **Preview** environments:

### Required Variables:
- `CLIENT_URL` = `https://frontend-koaci-reporting-web.vercel.app`
- `FRONTEND_URL` = `https://frontend-koaci-reporting-web.vercel.app`

### If you have mobile frontend:
- `CLIENT_URL` = `https://frontend-koaci-reporting-mobile.vercel.app`
- `FRONTEND_URL` = `https://frontend-koaci-reporting-mobile.vercel.app`

## Common CORS Issues & Solutions:

### Issue 1: Frontend URLs don't match
**Solution**: Check your actual frontend deployment URLs in Vercel and update the environment variables accordingly.

### Issue 2: Protocol mismatch
**Solution**: Make sure all URLs use `https://` in production (not `http://`).

### Issue 3: Missing environment variables
**Solution**: Ensure all environment variables from `.env` are added to Vercel.

### Issue 4: Origin header not being sent
**Solution**: Some requests (like API calls from mobile apps) might not send an Origin header. The updated code handles this.

## Testing after deployment:

1. Deploy the backend to Vercel
2. Check the Vercel logs for the "CORS request from origin:" messages
3. Compare those origins with your allowed origins list
4. Update the environment variables if needed

## Alternative: Permissive CORS for development

If you're still having issues, you can temporarily use this for debugging:

```typescript
app.use(cors({
  origin: true, // Allow all origins (ONLY for development!)
  credentials: true,
}));
```

**⚠️ Never use this in production!**
