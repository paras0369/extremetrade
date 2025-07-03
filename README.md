# ExtremeTrader - Advanced Trading Dashboard

A modern, responsive trading dashboard application built with React and Node.js, featuring real-time data, comprehensive user management, and advanced trading functionalities.

## 🚀 Features

### Frontend Features
- **Modern Dashboard UI** with dark theme and glassmorphism effects
- **Responsive Design** optimized for all devices
- **Interactive Quick Actions** for deposits, withdrawals, referrals, and analytics
- **Real-time Statistics** with beautiful data visualization
- **Multi-tab Navigation** (Overview, Trading, Team, Income, Profile)
- **Advanced Modal System** for all user interactions
- **Toast Notifications** for user feedback
- **Authentication System** with protected routes

### Backend Features
- **RESTful API** with Express.js
- **MongoDB Integration** with Mongoose ODM
- **JWT Authentication** with refresh token support
- **User Management** with roles and permissions
- **Trading Package System** with multiple investment options
- **Referral System** with multi-level commissions
- **Income Tracking** and analytics
- **Team Management** with hierarchical structure

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Notification system
- **CSS3** - Modern styling with animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Clone Repository
```bash
git clone https://github.com/paras0369/extremetrade.git
cd extremetrade
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start backend server
npm start
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/extremetrade
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

### Database Setup
The application will automatically create the required collections and indexes when you start the backend server.

## 🚀 Usage

1. **Start the Backend**: `cd backend && npm start`
2. **Start the Frontend**: `npm start`
3. **Access the Application**: Open `http://localhost:3000`
4. **Register/Login**: Create an account or use existing credentials
5. **Explore Features**: Navigate through different sections of the dashboard

## 📱 Quick Actions

### Deposit
- Select trading packages
- Multiple payment methods
- Real-time processing

### Withdraw
- Flexible withdrawal options
- Multiple payment methods
- Balance validation

### Refer Friends
- Generate referral codes
- Share on social media
- Track referral performance

### Analytics
- Performance metrics
- Income trends
- Team growth analytics

## 🔐 Authentication

The application uses JWT-based authentication with:
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Automatic token refresh
- Protected routes
- Session management

## 📊 Dashboard Sections

### Overview
- Account balance and statistics
- Recent transactions
- Quick action buttons
- Performance indicators

### Trading
- Available trading packages
- Investment options
- Package features and returns
- Purchase functionality

### Team
- Referral program details
- Team member management
- Referral statistics
- Sharing tools

### Income
- Income history and analytics
- Daily, weekly, monthly summaries
- Income sources breakdown
- Performance metrics

### Profile
- Personal information management
- Security settings
- Account preferences
- Password management

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark Theme**: Easy on the eyes
- **Responsive Layout**: Works on all screen sizes
- **Smooth Animations**: Enhanced user experience
- **Intuitive Navigation**: Easy to use interface
- **Loading States**: Visual feedback for actions

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Helmet security headers
- Input validation
- Rate limiting
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Paras Chaudhary**
- GitHub: [@paras0369](https://github.com/paras0369)
- Repository: [extremetrade](https://github.com/paras0369/extremetrade)

## 🚀 Deployment

### Frontend Deployment
The application can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

### Backend Deployment
The backend can be deployed to:
- Heroku
- AWS EC2
- DigitalOcean
- Railway

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

---

**Built with ❤️ by the ExtremeTrader Team**
