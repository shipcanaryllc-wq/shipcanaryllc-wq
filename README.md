# ShipCanary

ShipCanary is a modern shipping label management platform with a React frontend, Node.js backend, MongoDB database, and AWS S3 integration for PDF storage.

## Features

- **Create Shipping Labels**: Easy-to-use interface with 5 USPS service options
- **Saved Addresses**: Save and reuse shipping addresses
- **Saved Packages**: Save frequently used package dimensions and weights
- **Order History**: View all orders with tracking numbers and status
- **Account Balance**: Track your balance with $10 free credit for new users
- **Secure Authentication**: JWT-based auth with fraud prevention

## Tech Stack

- **Frontend**: React, React Router, Material-UI styling
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Storage**: AWS S3 for PDF labels
- **Authentication**: JWT tokens
- **Security**: Rate limiting, account lockout, fraud prevention

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- AWS Account (for S3 storage)

### Setup

1. **Clone and install dependencies:**

```bash
npm run install-all
```

2. **Configure environment variables:**

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shipcanary
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=shipcanary-labels
USPS_API_KEY=your-usps-api-key
USPS_USER_ID=your-usps-user-id
```

3. **Start MongoDB:**

Make sure MongoDB is running on your system.

4. **Run the application:**

```bash
npm run dev
```

This will start both the backend server (port 5000) and the React frontend (port 3000).

## USPS Service Options

1. **Priority Mail** - 2-3 business days (Max: 70 lbs, 108" length)
2. **Priority Mail Express** - Overnight delivery (Max: 70 lbs, 108" length)
3. **First-Class Package** - Affordable shipping (Max: 15.999 lbs, 22" length)
4. **Parcel Select** - Economy shipping (Max: 70 lbs, 130" length)
5. **Media Mail** - Books, media only (Max: 70 lbs, 108" length)

## API Integration

The application includes placeholder functions for USPS API integration. You'll need to:

1. Replace the `calculateShippingCost()` function in `server/routes/orders.js` with actual USPS API calls
2. Replace the `generatePlaceholderLabel()` function with actual label generation from USPS API
3. Update the cost calculation in `client/src/components/Dashboard/CreateLabel.js` to match your API

## Project Structure

```
ShipCanary/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/        # Auth context
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth & fraud prevention
│   └── index.js
└── package.json
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on registration and login
- Account lockout after failed login attempts
- IP-based fraud detection
- Input validation and sanitization

## Development

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`
- API endpoints are prefixed with `/api`

## License

ISC

