# Doctor Review and Recommendation Platform - Setup Guide

This is a complete MERN stack implementation of a Doctor Review and Recommendation Platform.

## Features Implemented

✅ User Authentication (JWT with HttpOnly Cookies)
✅ Doctor Profiles with verification
✅ Doctor Search & Filtering
✅ Appointment Booking System
✅ Review & Rating System
✅ Mock AI Health Assistant
✅ Role-based Dashboards (Patient, Doctor, Admin)
✅ Responsive UI with Tailwind CSS

## Tech Stack

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- React Router v6
- Axios
- Tailwind CSS
- Vite

## Project Structure

```
/
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── appointmentController.js
│   │   ├── reviewController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── chatRoutes.js
│   ├── .env
│   ├── package.json
│   └── index.js
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── DoctorCard.jsx
    │   │   ├── AppointmentCard.jsx
    │   │   ├── ReviewCard.jsx
    │   │   ├── AIChatWidget.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Search.jsx
    │   │   ├── DoctorProfile.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── NotFound.jsx
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── public/
    ├── .env
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── index.html
```

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Open `server/.env` and update:
     ```
     MONGO_URI=mongodb://localhost:27017/doctor-review
     JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
     CLIENT_URL=http://localhost:5173
     PORT=5000
     NODE_ENV=development
     ```

4. **Start the server:**
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - `.env` file is already created with:
     ```
     VITE_API_URL=http://localhost:5000/api
     ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (Protected)

### Doctors
- `GET /api/doctors` - Get all doctors (with filters)
- `GET /api/doctors/top` - Get top-rated doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors/profile` - Create doctor profile (Protected)
- `PUT /api/doctors/profile` - Update doctor profile (Protected)

### Appointments
- `POST /api/appointments` - Create appointment (Protected)
- `GET /api/appointments` - Get user's appointments (Protected)
- `PUT /api/appointments/:id` - Update appointment status (Protected)
- `GET /api/appointments/available-slots` - Get available slots

### Reviews
- `POST /api/reviews` - Add review (Protected)
- `GET /api/reviews/:doctorId` - Get reviews for doctor
- `DELETE /api/reviews/:id` - Delete review (Protected)

### Chat (AI Assistant)
- `POST /api/chat` - Get AI response for symptoms

## Usage

### As a Patient
1. Sign up with email and password
2. Search for doctors by city and specialization
3. View doctor profiles with reviews and ratings
4. Book appointments in available slots
5. Write reviews after completing appointments
6. Use the AI health assistant for general health queries
7. View all appointments in dashboard

### As a Doctor
1. Sign up as a doctor
2. Create and manage your profile
3. View appointment requests
4. Confirm or cancel appointments
5. See patient reviews and ratings

### As an Admin
1. Access admin panel (requires admin role in DB)
2. Verify doctor profiles
3. Manage users and appointments

## Key Features

### 1. Authentication
- JWT-based authentication with HttpOnly cookies
- Secure password hashing with bcryptjs
- Role-based access control

### 2. Doctor Management
- Complete doctor profiles
- Search and filter by city and specialization
- Verification status
- Average rating calculation

### 3. Appointments
- Easy booking with available slot checking
- Appointment status tracking (pending, confirmed, completed, cancelled)
- Conflict prevention

### 4. Reviews
- Five-star rating system
- Text-based reviews
- Only verified reviews from patients with completed appointments
- Average rating calculation for each doctor

### 5. AI Chat Widget
- Mock AI assistant for health queries
- Quick symptom-based recommendations
- Floating widget interface

### 6. Responsive Design
- Mobile-first approach
- Tailwind CSS for styling
- Clean and intuitive UI

## Database Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['patient', 'doctor', 'admin'], default: 'patient')
}
```

### Doctor Schema
```javascript
{
  userId: ObjectId (ref: User, required),
  name: String (required),
  specialization: String (required),
  experience: Number (required),
  fees: Number (required),
  city: String (required, indexed),
  bio: String,
  isVerified: Boolean (default: false)
}
```

### Appointment Schema
```javascript
{
  doctorId: ObjectId (ref: Doctor, required),
  patientId: ObjectId (ref: User, required),
  date: Date (required),
  slot: String (required),
  status: String (enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending')
}
```

### Review Schema
```javascript
{
  doctorId: ObjectId (ref: Doctor, required),
  patientId: ObjectId (ref: User, required),
  rating: Number (required, min: 1, max: 5),
  comment: String (required)
}
```

## Security Considerations

- Passwords are hashed using bcryptjs
- JWT tokens stored in HttpOnly cookies
- CORS configured for frontend origin
- User role verification for privileged operations
- Appointment verification before review submission

## Error Handling

All endpoints follow this response format:
```javascript
{
  success: boolean,
  data: any (optional),
  message: string
}
```

## Development Tips

1. Use Postman or Insomnia to test API endpoints
2. Check browser console for React errors
3. Use MongoDB Compass to inspect database
4. Enable CORS in browser dev tools if needed
5. Test with different user roles

## Troubleshooting

**Port already in use:**
- Change PORT in server/.env or kill process on port

**MongoDB connection error:**
- Ensure MongoDB is running
- Check MONGO_URI in server/.env

**CORS errors:**
- Verify CLIENT_URL matches frontend URL
- Check browser console for details

**Module not found errors:**
- Run `npm install` in both server and client directories
- Clear node_modules and reinstall if issues persist

## Future Enhancements

- Real AI integration for health recommendations
- Video consultation support
- Payment integration
- Admin dashboard
- Email notifications
- Advanced search filters
- Doctor specialization categories
- Patient health records

## License

MIT License - Feel free to use this project for learning and development.

## Support

For issues or questions, please create an issue in the repository.

---

**Happy coding!** 🚀
