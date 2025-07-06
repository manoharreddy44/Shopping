# P23 Shopping - E-commerce Platform

A full-stack e-commerce platform built with React, Node.js, Express, and MongoDB. This application provides a seamless shopping experience with user authentication, product management, shopping cart functionality, and order processing.

## Features

### 🛍️ Customer Features
- **Product Browsing**: Browse products with search and filtering
- **Shopping Cart**: Add/remove items, update quantities
- **User Authentication**: Register, login, and profile management
- **Product Reviews**: Rate and review products
- **Order Management**: View order history and track orders
- **Responsive Design**: Mobile-friendly interface

### 🏪 Seller Features
- **Product Management**: Add, edit, and delete products
- **Order Management**: View and update order status
- **Inventory Management**: Track product stock
- **Seller Dashboard**: Analytics and insights

### 👨‍💼 Admin Features
- **User Management**: Manage user accounts and roles
- **Product Oversight**: Monitor all products and sellers
- **Order Analytics**: View all orders and revenue
- **System Administration**: Platform-wide management

## Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd shopping-app
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Environment Setup

#### Backend Environment
Create a `.env` file in the `backend` directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopping-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment
The frontend is configured to connect to `http://localhost:5000/api` by default.

### 5. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the database and collections when it first connects.

## Running the Application

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
The backend server will start on `http://localhost:5000`

### 2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend application will start on `http://localhost:5173`

### 3. Access the Application
Open your browser and navigate to `http://localhost:5173`

## Demo Accounts

For testing purposes, you can use these demo accounts:

### Customer Account
- **Email**: user@example.com
- **Password**: password123

### Seller Account
- **Email**: seller@example.com
- **Password**: password123

### Admin Account
- **Email**: admin@example.com
- **Password**: password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products/new` - Create new product (Seller/Admin)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/products/review` - Add product review

### Orders
- `POST /api/orders/new` - Create new order
- `GET /api/orders/me` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id` - Update order status

### Users
- `GET /api/users/me` - Get user profile
- `PUT /api/users/me/update` - Update user profile
- `PUT /api/users/password/update` - Update password

## Project Structure

```
shopping-app/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Key Features Implementation

### Authentication System
- JWT-based authentication
- Role-based access control (User, Seller, Admin)
- Password hashing with bcrypt
- Protected routes

### Shopping Cart
- Local storage persistence
- Real-time quantity updates
- Stock validation
- Cart total calculation

### Product Management
- CRUD operations for products
- Image handling
- Category filtering
- Search functionality
- Rating and review system

### Order Processing
- Order creation and management
- Status tracking
- Stock management
- Payment simulation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Contact the development team

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Wishlist functionality
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Real-time chat support
- [ ] Advanced inventory management

---

**Happy Shopping! 🛍️** # Shopping
