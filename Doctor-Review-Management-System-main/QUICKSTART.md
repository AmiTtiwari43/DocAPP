# Quick Start Guide - Doctor Review Management System

## 🚀 Get Started in 5 Minutes

### Prerequisites Checklist
- [ ] Node.js installed (v14+)
- [ ] MongoDB running locally or MongoDB Atlas connection string
- [ ] Git installed

### Step 1: Clone/Navigate to Project
```bash
cd /workspaces/Doctor-Review-Management-System
```

### Step 2: Backend Setup (Terminal 1)
```bash
cd server
npm install
```

**Update `.env` file** with your MongoDB connection:
```env
MONGO_URI=mongodb://localhost:27017/doctor-review
JWT_SECRET=your_secret_key_12345
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

**Start backend:**
```bash
npm run dev
```
✅ Backend runs on `http://localhost:5000`

### Step 3: Frontend Setup (Terminal 2)
```bash
cd client
npm install
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

### Step 4: Access the Application
Open your browser and go to `http://localhost:5173`

---

## 📋 Test the Application

### Test Account Credentials

**Patient Account:**
- Email: `patient@test.com`
- Password: `password123`

**Doctor Account:**
- Email: `doctor@test.com`
- Password: `password123`

### Create Test Data

1. **Signup as Patient**
   - Go to http://localhost:5173/signup
   - Fill in form and select "Patient" role
   - Click Sign Up

2. **Signup as Doctor**
   - Repeat signup process, select "Doctor" role
   - Go to Dashboard
   - Create your doctor profile with:
     - Name, Specialization, Experience, Fees, City

3. **Search for Doctors**
   - Go to Search page
   - Filter by city and specialization
   - View doctor profiles

4. **Book Appointment**
   - Click "View Profile" on a doctor
   - Select date and available time slot
   - Click "Book Now"

5. **Write Review**
   - After booking, return to doctor profile
   - Scroll to "Write a Review" section
   - Select rating and write comment
   - Submit review

6. **Use AI Chat**
   - Click the chat bubble at bottom right
   - Type symptoms like "headache", "fever", "cough"
   - Get AI recommendations

---

## 🔑 Key Credentials & Endpoints

### API Base URL
`http://localhost:5000/api`

### Important Endpoints

**Auth:**
- POST `/auth/signup` - Create new user
- POST `/auth/login` - Login user
- GET `/auth/me` - Current user profile
- POST `/auth/logout` - Logout

**Doctors:**
- GET `/doctors` - List doctors (with filters)
- GET `/doctors/top` - Top-rated doctors
- GET `/doctors/:id` - Doctor details
- POST `/doctors/profile` - Create doctor profile
- PUT `/doctors/profile` - Update profile

**Appointments:**
- GET `/appointments` - My appointments
- POST `/appointments` - Book appointment
- PUT `/appointments/:id` - Update status
- GET `/appointments/available-slots` - Get available slots

**Reviews:**
- GET `/reviews/:doctorId` - Doctor reviews
- POST `/reviews` - Add review
- DELETE `/reviews/:id` - Delete review

**Chat:**
- POST `/chat` - Get AI response

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module" Error
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port Already in Use
- Backend: Change PORT in `server/.env`
- Frontend: Use `npm run dev -- --port 5174`

### Issue: MongoDB Connection Failed
```bash
# Check MongoDB is running
mongosh

# Or use MongoDB Atlas connection string in .env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-review
```

### Issue: CORS Error
- Check CLIENT_URL in `server/.env` matches frontend URL
- Usually should be `http://localhost:5173`

### Issue: Blank Page on Frontend
- Check browser console (F12) for errors
- Ensure backend is running
- Check Network tab to see if API calls succeed

---

## 📁 Project Structure Summary

```
Doctor-Review-Management-System/
├── server/                          # Backend Express app
│   ├── controllers/                 # Business logic
│   ├── models/                      # MongoDB schemas
│   ├── routes/                      # API routes
│   ├── middleware/                  # Auth middleware
│   ├── config/                      # DB config
│   ├── .env                         # Environment variables
│   └── index.js                     # Entry point
│
├── client/                          # Frontend React app
│   ├── src/
│   │   ├── pages/                   # Route pages
│   │   ├── components/              # Reusable components
│   │   ├── context/                 # Global state
│   │   ├── utils/                   # API client
│   │   └── App.jsx                  # Main app
│   ├── .env                         # Environment variables
│   ├── vite.config.js              # Vite config
│   └── tailwind.config.js          # Tailwind config
│
└── SETUP.md                         # Detailed setup guide
```

---

## 🎨 Features Implemented

✅ **Authentication**
- User signup/login with JWT
- HttpOnly cookies for security
- Role-based access (Patient/Doctor)

✅ **Doctor Management**
- Search and filter doctors
- View detailed profiles
- Create/update doctor profiles

✅ **Appointments**
- Book appointments with available slots
- Track appointment status
- Confirm/cancel appointments

✅ **Reviews System**
- Write and view reviews
- 5-star rating system
- Average rating calculation

✅ **AI Health Assistant**
- Mock AI chat widget
- Symptom-based recommendations
- Floating chat interface

✅ **User Dashboards**
- Patient: View appointments & reviews
- Doctor: Manage profile & appointments
- Role-based views

✅ **Responsive Design**
- Mobile-friendly UI
- Tailwind CSS styling
- Clean and modern interface

---

## 🚀 Build for Production

### Backend Build
```bash
cd server
# Update .env with production values
npm run dev  # or npm start
```

### Frontend Build
```bash
cd client
npm run build
npm run preview
```

---

## 📚 Learn More

See `SETUP.md` for:
- Detailed installation instructions
- Complete API documentation
- Database schema details
- Security considerations
- Future enhancement ideas

---

## 💡 Tips & Tricks

1. **Use dummy data for testing:** Create multiple test accounts
2. **Check MongoDB:** Use MongoDB Compass to inspect database
3. **API Testing:** Use Postman/Insomnia for API testing
4. **React DevTools:** Install React DevTools browser extension
5. **Network Debugging:** Use browser DevTools Network tab

---

## 🤝 Support

For issues:
1. Check browser console (F12) for errors
2. Check terminal for backend errors
3. Verify .env files are correctly configured
4. Try restarting both server and frontend

---

**Ready to build? Start the servers and access the app!** 🎉
