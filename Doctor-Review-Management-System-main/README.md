# Doctor-Review-Management-System

# Doctor Review and Recommendation Platform: Implementation Plan

## 1. Overview

This document outlines the implementation plan for a full-stack Doctor Review and Recommendation Platform. The project will be built using the MERN stack (MongoDB, Express, React, Node.js) and will include features like user authentication, doctor profiles, a review system, appointment booking, and an AI health assistant.

The implementation will follow a phased approach as detailed below, ensuring a structured and robust development process.

## 2. Technology Stack

### Frontend

- **Framework:** React (with Vite)
- **UI:** Tailwind CSS, Shadcn/UI
- **Icons:** Lucide React Icons
- **HTTP Client:** Axios
- **Routing:** React Router
- **State Management:** React Context API (Single Global Context)

### Backend

- **Framework:** Node.js with Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT using HttpOnly Cookies
- **Environment:** `dotenv` for environment variables
- **Middleware:** `cors`, `cookie-parser`

## 3. Database Schema (Mongoose Models)

### User Model (`models/User.js`)

- `name`: { type: String, required: true }
- `email`: { type: String, required: true, unique: true }
- `password`: { type: String, required: true }
- `role`: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' }

### Doctor Model (`models/Doctor.js`)

- `userId`: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
- `name`: { type: String, required: true }
- `specialization`: { type: String, required: true }
- `experience`: { type: Number, required: true }
- `fees`: { type: Number, required: true }
- `city`: { type: String, required: true, index: true }
- `bio`: { type: String }
- `isVerified`: { type: Boolean, default: false }

### Appointment Model (`models/Appointment.js`)

- `doctorId`: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }
- `patientId`: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
- `date`: { type: Date, required: true }
- `slot`: { type: String, required: true }
- `status`: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }

### Review Model (`models/Review.js`)

- `doctorId`: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }
- `patientId`: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
- `rating`: { type: Number, required: true, min: 1, max: 5 }
- `comment`: { type: String, required: true }

## 4. Project Structure

### Backend (`server/`)

```
server/
├── config/db.js
├── controllers/
│   ├── appointmentController.js
│   ├── authController.js
│   ├── chatController.js
│   ├── doctorController.js
│   └── reviewController.js
├── models/
│   ├── Appointment.js
│   ├── Doctor.js
│   ├── Review.js
│   └── User.js
├── routes/
│   ├── appointmentRoutes.js
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── doctorRoutes.js
│   └── reviewRoutes.js
└── index.js
```

### Frontend (`client/`)

```
client/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── context/AppContext.jsx
│   ├── components/
│   │   ├── AIChatWidget.jsx
│   │   ├── AppointmentCard.jsx
│   │   ├── DoctorCard.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── ReviewCard.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── DoctorProfile.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   ├── Search.jsx
│   │   └── Signup.jsx
│   └── utils/api.js
```

## 5. Core Implementation Rules

- All async operations must use `async/await`.
- All controller functions must be wrapped in `try/catch` blocks.
- Backend API responses must follow the format: `{ success: boolean, data: any, message: string }`.
- User roles must be verified for all privileged actions.
- Never expose sensitive data like passwords in API responses.
- All forms must have client-side and server-side validation.
- All frontend API requests must use Axios with `withCredentials: true`.
- State updates in React must be immutable.
- Backend CORS must be configured for `origin: CLIENT_URL` and `credentials: true`.
- All database schemas must be implemented exactly as defined.
- File and folder structures must be followed exactly.

## 6. Phased Implementation Plan

### Phase 1: Backend Core Setup

**Goal:** Initialize the backend server, establish database connection, and define all Mongoose models.
**Repo:** `Doctor-Review-Management-System`
**Folder:** `server/`

1.  **`server/index.js`**: Setup Express, middleware (`cors`, `cookie-parser`, `express.json`), connect to DB, and start server.
2.  **`server/config/db.js`**: Export `connectDB` function to connect to MongoDB using Mongoose.
3.  **`server/models/User.js`**: Create User schema with a pre-save hook to hash passwords.
4.  **`server/models/Doctor.js`**: Create Doctor schema.
5.  **`server/models/Appointment.js`**: Create Appointment schema.
6.  **`server/models/Review.js`**: Create Review schema.

### Phase 2: User Authentication

**Goal:** Implement user registration and login, issuing JWTs via HttpOnly cookies, and set up frontend context.
**Repo:** `Doctor-Review-Management-System`

1.  **`server/controllers/authController.js`**: Implement `signup`, `login`, and `logout` functions. `login` will issue a JWT in an HttpOnly cookie.
2.  **`server/routes/authRoutes.js`**: Define `POST /signup`, `POST /login`, `POST /logout` routes.
3.  **`server/index.js`&#32;(Update)**: Mount `authRoutes` at `/api/auth`.
4.  **`client/src/context/AppContext.jsx`**: Create `AppContext` and `AppProvider` to manage global state (`user`, `city`, `selectedDoctor`, `loading`).

### Phase 3: Doctor Search & Recommendation

**Goal:** Build the API and UI for searching, filtering, and viewing doctors.
**Repo:** `Doctor-Review-Management-System`

1.  **`server/controllers/doctorController.js`**:

    - `getDoctors`: Fetch doctors with filters for `city` and `specialization`.
    - `getDoctorById`: Fetch a single doctor's profile.
    - `updateDoctor`: Allow doctors to update their profiles.
    - `getTopDoctors`: Implement ranking logic (weighted score) and return top-rated doctors.

2.  **`server/routes/doctorRoutes.js`**: Define routes for all controller functions.
3.  **`server/index.js`&#32;(Update)**: Mount `doctorRoutes` at `/api/doctors`.
4.  **`client/src/pages/Search.jsx`**: Build the search page with filters and display results.
5.  **`client/src/components/DoctorCard.jsx`**: Create a component to display doctor summary information.

### Phase 4: Appointments

**Goal:** Implement appointment booking and management functionality.
**Repo:** `Doctor-Review-Management-System`

1.  **`server/controllers/appointmentController.js`**:

    - `createAppointment`: Allow patients to book an appointment.
    - `getAppointmentsByUser`: Fetch all appointments for a logged-in patient or doctor.
    - `updateAppointmentStatus`: Allow doctors or patients to update appointment status (e.g., confirm, cancel).

2.  **`server/routes/appointmentRoutes.js`**: Define routes for all controller functions.
3.  **`server/index.js`&#32;(Update)**: Mount `appointmentRoutes` at `/api/appointments`.
4.  **`client/src/pages/DoctorProfile.jsx`**: Add a booking UI to the doctor's profile page.
5.  **`client/src/components/AppointmentCard.jsx`**: Create a component to display appointment details.

### Phase 5: Reviews

**Goal:** Enable patients to review doctors after a completed appointment.
**Repo:** `Doctor-Review-Management-System`

1.  **`server/controllers/reviewController.js`**:

    - `addReview`: The core logic. Verify that the patient has a 'completed' appointment with the doctor before allowing a review to be submitted.
    - `getReviewsByDoctor`: Fetch all reviews for a specific doctor.

2.  **`server/routes/reviewRoutes.js`**: Define routes for review controller functions.
3.  **`server/index.js`&#32;(Update)**: Mount `reviewRoutes` at `/api/reviews`.
4.  **`client/src/pages/DoctorProfile.jsx`&#32;(Update)**: Add a section to display reviews and a form for submitting new ones.
5.  **`client/src/components/ReviewCard.jsx`**: Create a component to display a single review.

### Phase 6: AI Health Assistant

**Goal:** Create a mock AI chat interface.
**Repo:** `Doctor-Review-Management-System`

1.  **`server/controllers/chatController.js`**: Create a `getMockAIResponse` function that takes symptoms as input and returns a canned, helpful (but not medical advice) suggestion.
2.  **`server/routes/chatRoutes.js`**: Define a `POST /` route for the chat controller.
3.  **`server/index.js`&#32;(Update)**: Mount `chatRoutes` at `/api/chat`.
4.  **`client/src/components/AIChatWidget.jsx`**: Build a chat widget using Shadcn/UI components that interacts with the chat API.

### Phase 7: Dashboards

**Goal:** Create personalized dashboards for patients, doctors, and admins.
**Repo:** `Doctor-Review-Management-System`

1.  **`client/src/pages/Dashboard.jsx`**: This component will conditionally render the correct dashboard based on the logged-in user's role.
2.  **Patient Dashboard**: Display lists of upcoming/past appointments and submitted reviews.
3.  **Doctor Dashboard**: Allow profile editing, show appointment requests, and display review statistics.
4.  **Admin Dashboard**: Provide functionality to verify doctors and manage all users. This will require new admin-specific controller functions and routes (e.g., in `doctorController` and a new `adminController`).

### Phase 8: Final Integration

**Goal:** Connect all the pieces with routing, navigation, and protected routes.
**Repo:** `Doctor-Review-Management-System`

1.  **`client/src/App.jsx`**: Set up all frontend routes using React Router, including nested routes for the dashboard.
2.  **`client/src/components/Navbar.jsx`**: Create a responsive navigation bar with links that change based on auth status and user role.
3.  **`client/src/components/ProtectedRoute.jsx`**: Implement a component that checks for user authentication before rendering a protected route. Redirect to `/login` if not authenticated.
4.  **`client/src/utils/api.js`**: Configure a global Axios instance with `baseURL` and `withCredentials: true`.
5.  **Environment Files**: Create `.env` files for both `client` and `server` to manage environment-specific variables (`MONGO_URI`, `CLIENT_URL`, `JWT_SECRET`, etc.).
6.  **Final Polish**: Ensure responsive design, loading states, and error handling are implemented throughout the application.
