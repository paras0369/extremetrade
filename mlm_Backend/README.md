# MLM Backend System

A comprehensive Multi-Level Marketing (MLM) backend system built with Node.js, Express.js, and MongoDB.

## Features

### User Management
- User registration with sponsor/referral system
- JWT-based authentication
- Profile management with bank account and USDT address
- User activation/deactivation functionality

### MLM System
- 4-level commission structure (10%, 5%, 2.5%, 1%)
- Signup bonus for both user and sponsor ($1 each)
- Reward income when team reaches $10k business ($500 reward)
- Team building and genealogy tracking
- Real-time commission calculations

### Wallet System
- Individual income tracking by type
- Total balance and available balance management
- Locked balance for pending withdrawals
- Transaction history with detailed breakdowns

### Withdrawal System
- Multiple withdrawal methods (Bank Transfer, USDT)
- Admin approval workflow
- Processing fee calculations
- Status tracking and notifications

### Dashboard & Analytics
- Comprehensive dashboard with earnings overview
- Team statistics and growth charts
- Income analytics by level and type
- Quick actions and notifications

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator, Joi
- **Email**: Nodemailer
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mlm-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/mlm_system
   JWT_SECRET=your_super_secret_jwt_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify-referral/:code` - Verify referral code

### User Management
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/bank-account` - Update bank account
- `PUT /api/user/usdt-address` - Update USDT address
- `GET /api/user/stats` - Get user statistics
- `PUT /api/user/:id/activate` - Activate user (Admin)
- `PUT /api/user/:id/deactivate` - Deactivate user (Admin)

### Wallet
- `GET /api/wallet` - Get wallet details
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/income-summary` - Get income breakdown
- `GET /api/wallet/stats` - Get wallet statistics

### Team Management
- `GET /api/team/direct` - Get direct team members
- `GET /api/team/level/:level` - Get team by level (1-4)
- `GET /api/team/complete` - Get complete team structure
- `GET /api/team/stats` - Get team statistics
- `GET /api/team/search` - Search team members

### Investments
- `POST /api/investment` - Process investment
- `GET /api/investment/history` - Get investment history
- `GET /api/investment/stats` - Get investment statistics

### Withdrawals
- `POST /api/withdrawal` - Create withdrawal request
- `GET /api/withdrawal/history` - Get withdrawal history
- `GET /api/withdrawal/:id` - Get withdrawal details
- `PUT /api/withdrawal/:id/cancel` - Cancel withdrawal
- `PUT /api/withdrawal/:id/approve` - Approve withdrawal (Admin)
- `PUT /api/withdrawal/:id/complete` - Complete withdrawal (Admin)
- `PUT /api/withdrawal/:id/reject` - Reject withdrawal (Admin)

### Dashboard
- `GET /api/dashboard` - Get dashboard summary
- `GET /api/dashboard/earnings-chart` - Get earnings chart data
- `GET /api/dashboard/team-growth-chart` - Get team growth data
- `GET /api/dashboard/income-analytics` - Get income analytics

## Commission Structure

### Level Commissions
- **Level 1 (Direct)**: 10% of investment
- **Level 2**: 5% of investment
- **Level 3**: 2.5% of investment  
- **Level 4**: 1% of investment

### Bonuses
- **Signup Bonus**: $1 for both new user and sponsor
- **Reward Income**: $500 when team business reaches $10,000

## Database Schema

### User Model
- Personal information (name, email, phone)
- Authentication data (password, status)
- MLM data (referral code, sponsor, level)
- Financial data (total investment, earnings, withdrawals)
- Bank account and USDT address

### Wallet Model
- Balance tracking (total, available, locked)
- Income breakdown by type
- Transaction summaries

### Transaction Model
- All financial transactions
- Commission tracking with levels
- Status and approval workflow

### Team Model
- Team structure and relationships
- Business volume tracking
- Level-wise organization

### Withdrawal Model
- Withdrawal requests and processing
- Multiple payment methods
- Admin approval workflow

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers

## Error Handling

- Centralized error handling middleware
- Comprehensive logging with Winston
- Validation error formatting
- Development vs production error responses

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic services
└── utils/          # Utility functions
```

### Adding New Features
1. Create/update models in `src/models/`
2. Add business logic in `src/services/`
3. Create controllers in `src/controllers/`
4. Add routes in `src/routes/`
5. Add validation in `src/middleware/validation.js`

## Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up MongoDB instance
2. Configure environment variables
3. Install dependencies: `npm install --production`
4. Start application: `npm start`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| SMTP_HOST | Email server host | - |
| SMTP_PORT | Email server port | 587 |
| SMTP_USER | Email username | - |
| SMTP_PASSWORD | Email password | - |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yourcompany.com or create an issue in the repository.