# ExtremeTrader Backend API

A complete backend API for the ExtremeTrader trading platform built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Email verification
  - Password reset functionality
  - Role-based access control

- **Trading Platform Features**
  - User registration with referral system
  - Trading packages management
  - Wallet integration (BEP20, ERC20, TRC20)
  - Transaction processing (deposits/withdrawals)
  - Income tracking and bonuses
  - Team management and genealogy

- **Security Features**
  - Rate limiting
  - Helmet for security headers
  - Input validation with express-validator
  - Account lockout after failed attempts
  - CORS configuration

- **Database Models**
  - User management with KYC
  - Transaction handling
  - Package management
  - Income/bonus tracking
  - Team structure and referrals

## Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Validation**: express-validator
- **File Upload**: multer
- **Email**: nodemailer

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   cd extremetrade/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/extremetrade

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your_refresh_token_secret_here
   JWT_REFRESH_EXPIRES_IN=30d

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@extremetrade.com
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or configure MongoDB Atlas connection.

5. **Run the application**
   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /request-password-reset` - Request password reset
- `POST /reset-password` - Reset password
- `POST /verify-email` - Verify email address

### User Routes (`/api/users`)
- `GET /dashboard` - Get user dashboard data
- `GET /wallets` - Get user wallet information
- `PUT /wallets` - Update wallet addresses

### Transaction Routes (`/api/transactions`)
- `GET /` - Get user transactions
- `POST /` - Create new transaction
- `GET /:id` - Get specific transaction
- `PUT /:id` - Update transaction status (admin)

### Package Routes (`/api/packages`)
- `GET /` - Get available packages
- `GET /:id` - Get specific package
- `POST /purchase` - Purchase a package

### Team Routes (`/api/team`)
- `GET /` - Get team information
- `GET /hierarchy` - Get team hierarchy
- `GET /statistics` - Get team statistics

### Income Routes (`/api/income`)
- `GET /` - Get income history
- `GET /summary` - Get income summary
- `GET /by-type` - Get income by type

## Database Schema

### Users Collection
- Basic user information (name, email, phone)
- Authentication data (password, tokens)
- Wallet addresses (BEP20, ERC20, TRC20)
- Balance and earnings
- KYC documentation
- Team and referral information

### Transactions Collection
- Transaction details (type, amount, status)
- Payment information
- Proof of payment uploads
- Admin processing data
- Blockchain information

### Packages Collection
- Package details (name, price, returns)
- Investment limits and requirements
- Features and benefits
- Risk levels and terms

### Income Collection
- Income types and amounts
- Source information
- Team level details
- Processing status

### Team Collection
- Referral relationships
- Team statistics
- Rank and achievements
- Performance metrics

## Configuration

The application uses a centralized configuration system in `config/config.js`. Key settings include:

- **Server settings**: Port, environment, frontend URL
- **Database settings**: MongoDB connection options
- **JWT settings**: Secrets and expiration times
- **Trading settings**: Minimum amounts, fees, bonuses
- **Security settings**: Rate limits, account lockout
- **Package settings**: Default packages and returns

## Security Features

1. **Password Security**
   - bcrypt hashing with 12 rounds
   - Password strength requirements
   - Account lockout after failed attempts

2. **JWT Security**
   - Separate access and refresh tokens
   - Token expiration handling
   - Secure token storage

3. **Input Validation**
   - Comprehensive request validation
   - SQL injection prevention
   - XSS protection

4. **Rate Limiting**
   - API rate limiting
   - Login attempt limiting
   - Account lockout mechanism

## Development

### Project Structure
```
backend/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
├── uploads/         # File uploads
└── server.js        # Main server file
```

### Running Tests
```bash
npm test
```

### Code Style
- Use ES6+ features
- Follow async/await patterns
- Implement proper error handling
- Add comprehensive logging

## Deployment

### Environment Variables
Set all required environment variables for production:
- Use strong JWT secrets
- Configure production database
- Set up email service
- Configure CORS for production frontend

### Docker Support
```dockerfile
# Example Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## API Documentation

### Response Format
All API responses follow a consistent format:

```json
{
  "status": "success|error",
  "message": "Description of the result",
  "data": {
    // Response data object
  },
  "errors": [
    // Array of validation errors (if any)
  ]
}
```

### Authentication
Include JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Error Handling
The API includes comprehensive error handling for:
- Validation errors
- Authentication errors
- Database errors
- Network errors
- Business logic errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 