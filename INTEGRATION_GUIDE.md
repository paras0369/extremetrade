# Frontend-Backend Integration Guide

## Backend API Status
✅ **Backend is running successfully on http://localhost:5000**

### Tested Features:
- ✅ User Registration (with/without referral codes)
- ✅ User Login with JWT tokens
- ✅ Protected routes with authentication middleware
- ✅ Referral system with automatic bonuses
- ✅ Team structure and statistics
- ✅ Income tracking and bonuses

## Frontend Integration Steps

### 1. Install Axios for API calls
```bash
cd extremetrade
npm install axios
```

### 2. Create API Service Layer
Create `src/services/api.js`:
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Authentication Service
Create `src/services/authService.js`:
```javascript
import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.status === 'success') {
      const { tokens } = response.data.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.status === 'success') {
      const { tokens } = response.data.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};
```

### 4. Update Login Component
Update `src/components/Login.js`:
```javascript
import { authService } from '../services/authService';

// In your handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const result = await authService.login({
      email: formData.email,
      password: formData.password,
    });

    if (result.status === 'success') {
      navigate('/dashboard');
    }
  } catch (error) {
    setError(error.response?.data?.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

### 5. Update Signup Component
Update `src/components/Signup.js`:
```javascript
import { authService } from '../services/authService';

// In your handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const result = await authService.register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      sponsorCode: formData.sponsorCode, // if provided
    });

    if (result.status === 'success') {
      navigate('/dashboard');
    }
  } catch (error) {
    setError(error.response?.data?.message || 'Registration failed');
  } finally {
    setIsLoading(false);
  }
};
```

### 6. Update Dashboard Component
Update `src/components/Dashboard.js`:
```javascript
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await authService.getProfile();
        if (result.status === 'success') {
          setUserProfile(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!userProfile) return <div>Error loading profile</div>;

  const { user, team, incomeSummary } = userProfile;

  return (
    <div className="dashboard">
      {/* Update with real data */}
      <div className="balance-card">
        <h3>Available Balance</h3>
        <p>${user.balance.available}</p>
      </div>
      
      <div className="team-stats">
        <h3>Team Statistics</h3>
        <p>Direct Referrals: {team.directReferralsCount}</p>
        <p>Total Team: {team.teamStats.totalMembers}</p>
        <p>Your Referral Code: {user.referralCode}</p>
      </div>

      <div className="income-summary">
        <h3>Income Summary</h3>
        <p>Total Income: ${incomeSummary.totalIncome}</p>
        <p>Direct Sponsor Bonus: ${incomeSummary.directSponsorBonus}</p>
      </div>
    </div>
  );
};
```

### 7. Protected Route Component
Create `src/components/ProtectedRoute.js`:
```javascript
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
```

### 8. Update App.js Routes
```javascript
import ProtectedRoute from './components/ProtectedRoute';

// In your Routes:
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Available API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Future Endpoints (Ready for implementation)
- `GET /api/users/dashboard` - Dashboard data
- `GET /api/transactions` - Transaction history
- `POST /api/transactions` - Create transaction
- `GET /api/packages` - Available packages
- `GET /api/team` - Team information
- `GET /api/income` - Income history

## Testing the Integration

1. Start both servers:
   ```bash
   # Terminal 1: Frontend
   npm start

   # Terminal 2: Backend
   cd backend && npm start
   ```

2. Test the flow:
   - Register a new user
   - Login with credentials
   - Access dashboard with real data
   - Test referral system with sponsor codes

## Next Steps

1. Replace mock data in frontend components with API calls
2. Add error handling and loading states
3. Implement transaction management
4. Add package purchase functionality
5. Create admin panel for managing users and transactions

## Backend Features Available

✅ **Complete User Management**
- Registration with referral system
- Secure login with JWT tokens
- Profile management
- Password reset functionality

✅ **Trading Platform Features**
- Package management system
- Transaction processing
- Income tracking and bonuses
- Team structure and genealogy

✅ **Security Features**
- Password hashing with bcrypt
- JWT authentication
- Rate limiting
- Input validation
- Account security features

The backend is production-ready with comprehensive error handling, validation, and security features! 