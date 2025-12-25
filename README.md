# Personal Finance Manager - Backend API

A comprehensive RESTful API for managing personal finances, built with Node.js, Express, and MongoDB. This backend service provides secure endpoints for tracking transactions, managing budgets, setting financial goals, and generating detailed financial reports.

## 🚀 Features

### Core Functionality
- **User Management**: Secure authentication with JWT tokens and optional MFA
- **Transaction Tracking**: Record and categorize income and expenses
- **Budget Management**: Create and monitor budgets with alert thresholds
- **Financial Goals**: Set and track progress toward financial objectives
- **Recurring Expenses**: Automate tracking of regular payments
- **Categories**: Organize transactions with custom categories
- **Reports & Analytics**: Generate detailed financial insights
- **Data Export**: Export financial data in CSV format
- **Notifications**: Email and push notifications for budget alerts and goal reminders

### Security Features
- JWT-based authentication
- Multi-factor authentication (MFA) support
- Password hashing with bcrypt
- Rate limiting and account lockout protection
- Secure environment variable management

### Advanced Features
- Automated notification system with cron jobs
- Comprehensive error handling
- CORS support for cross-origin requests
- MongoDB connection pooling and optimization
- RESTful API design with proper HTTP status codes

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **Security**: MFA with Speakeasy, QR code generation
- **Email**: Nodemailer for notifications
- **Scheduling**: Node-cron for automated tasks
- **Export**: JSON2CSV for data export
- **Environment**: dotenv for configuration

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/financeapp
   JWT_SECRET=your_jwt_secret_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Database Setup**
   - Ensure MongoDB is running locally or configure cloud MongoDB URI
   - The application will automatically connect and create necessary collections

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

#### Users
- `POST /users/register` - Register new user
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/enable-mfa` - Enable multi-factor authentication

#### Transactions
- `GET /transactions` - Get user transactions
- `POST /transactions` - Create new transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

#### Categories
- `GET /categories` - Get user categories
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Budgets
- `GET /budgets` - Get user budgets
- `POST /budgets` - Create new budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

#### Goals
- `GET /goals` - Get user goals
- `POST /goals` - Create new goal
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal

#### Reports
- `GET /reports/summary` - Get financial summary
- `GET /reports/monthly` - Get monthly reports
- `GET /reports/category-breakdown` - Get spending by category

#### Export
- `GET /export/transactions` - Export transactions as CSV
- `GET /export/budgets` - Export budgets as CSV

## 🗂️ Project Structure

```
backend/
├── controllers/          # Request handlers
│   ├── usersCtrl.js
│   ├── transactionCtrl.js
│   ├── budgetCtrl.js
│   ├── goalCtrl.js
│   ├── categoryCtrl.js
│   ├── reportCtrl.js
│   ├── notificationCtrl.js
│   ├── recurringExpenseCtrl.js
│   └── exportCtrl.js
├── middlewares/          # Custom middleware
│   ├── isAuth.js
│   └── errorHandlerMiddleware.js
├── model/               # Database schemas
│   ├── User.js
│   ├── Transaction.js
│   ├── Budget.js
│   ├── Goal.js
│   ├── Category.js
│   ├── Notification.js
│   └── RecurringExpense.js
├── routes/              # API routes
│   ├── userRouter.js
│   ├── transactionRouter.js
│   ├── budgetRouter.js
│   ├── goalRouter.js
│   ├── categoryRouter.js
│   ├── reportRouter.js
│   ├── notificationRouter.js
│   ├── recurringExpenseRouter.js
│   └── exportRouter.js
├── services/            # Business logic
│   └── notificationService.js
├── utils/               # Utility functions
├── app.js              # Application entry point
├── package.json        # Dependencies and scripts
└── .env               # Environment variables
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8000 |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `EMAIL_HOST` | SMTP server host | Optional |
| `EMAIL_PORT` | SMTP server port | Optional |
| `EMAIL_USER` | Email username | Optional |
| `EMAIL_PASS` | Email password | Optional |

### MongoDB Configuration
The application uses optimized MongoDB connection settings:
- Connection timeout: 30 seconds
- Socket timeout: 45 seconds
- Connection pool: 5-10 connections

## 🚦 Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

### Create a transaction
```bash
curl -X POST http://localhost:5000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "type": "expense",
    "category": "Food",
    "amount": 25.50,
    "description": "Lunch at restaurant"
  }'
```

### Create a budget
```bash
curl -X POST http://localhost:5000/api/v1/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "name": "Monthly Food Budget",
    "category": "Food",
    "amount": 500,
    "period": "monthly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

## 🔒 Security

- All passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- MFA support with TOTP (Time-based One-Time Password)
- Input validation and sanitization
- Rate limiting on authentication endpoints
- Secure HTTP headers with CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MongoDB is running
   - Check MONGO_URI in .env file
   - Ensure network connectivity

2. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **Email Notifications Not Working**
   - Configure EMAIL_* environment variables
   - Check SMTP server settings
   - Verify app password for Gmail

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.