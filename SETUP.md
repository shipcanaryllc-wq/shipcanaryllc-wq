# ShipCanary Setup Guide

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up MongoDB:**
   - Install MongoDB locally, or
   - Use MongoDB Atlas (free tier available)
   - Update `MONGODB_URI` in server `.env` file

3. **Configure environment variables:**
   - Copy `server/env.example` to `server/.env`
   - Fill in your MongoDB connection string
   - Add AWS credentials (optional for development)
   - Set a strong JWT_SECRET

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## AWS S3 Setup (Optional for Development)

For production, you'll need AWS S3 configured:

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 upload permissions
3. Add credentials to `.env`:
   ```
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

## USPS API Integration

The application includes placeholder functions for USPS API integration. To integrate:

1. Get USPS API credentials
2. Update `server/routes/orders.js`:
   - Replace `calculateShippingCost()` with actual USPS rate API call
   - Replace `generatePlaceholderLabel()` with actual label generation
   - Update tracking number generation to use USPS response

3. Update `client/src/components/Dashboard/CreateLabel.js`:
   - Replace `calculateCost()` with API call to get real-time rates

## Testing

1. Create an account (you'll get $10 free credit)
2. Add a saved address
3. Add a saved package
4. Create a shipping label
5. Check order history

## Troubleshooting

- **MongoDB connection error**: Make sure MongoDB is running
- **Port already in use**: Change PORT in `.env` or kill the process using the port
- **AWS S3 errors**: The app will use placeholder URLs if AWS is not configured
- **CORS errors**: Make sure backend is running on port 5000

