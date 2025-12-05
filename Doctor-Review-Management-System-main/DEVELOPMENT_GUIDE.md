# 🛠️ Development Guide - Common Tasks & Commands

## 📦 Installation & Setup

### Fresh Start
```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Install frontend dependencies
cd ../client
npm install

# 3. Go back to root
cd ..
```

### Remove & Reinstall
```bash
# If you encounter issues:
cd server && rm -rf node_modules package-lock.json && npm install
cd ../client && rm -rf node_modules package-lock.json && npm install
```

---

## 🚀 Running the Application

### Development Mode (Recommended)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs with nodemon (auto-reload on code changes)
# Access: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Access: http://localhost:5173
# Vite hot module reload enabled
```

### Production Build

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run build    # Creates optimized build in dist/
npm run preview  # Preview production build locally
```

---

## 🗄️ Database Management

### Local MongoDB

**Start MongoDB:**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux with systemctl
sudo systemctl start mongod

# Windows (if installed as service)
net start MongoDB
```

**Stop MongoDB:**
```bash
# macOS
brew services stop mongodb-community

# Linux
sudo systemctl stop mongod
```

**Access MongoDB CLI:**
```bash
mongosh
# or
mongo
```

### MongoDB Compass (GUI)
- Download: https://www.mongodb.com/products/compass
- Connect to: `mongodb://localhost:27017`
- Create database: `doctor-review`

### MongoDB Atlas (Cloud)
1. Visit: https://cloud.mongodb.com
2. Create account & cluster
3. Copy connection string
4. Update `server/.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-review?retryWrites=true&w=majority
   ```

---

## 🧪 Testing the API

### Using Postman
1. Download: https://www.postman.com/downloads/
2. Create requests to endpoints
3. Use environment variables for URLs

### Using cURL

**Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"password123",
    "role":"patient"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email":"john@example.com",
    "password":"password123"
  }'
```

**Get Current User:**
```bash
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

**Get All Doctors:**
```bash
curl 'http://localhost:5000/api/doctors?city=Mumbai&specialization=Cardiologist'
```

### Using Insomnia
- Similar to Postman
- Download: https://insomnia.rest

---

## 🔧 Configuration & Environment

### Backend Environment Variables

**`server/.env`:**
```env
# Database
MONGO_URI=mongodb://localhost:27017/doctor-review

# JWT Secret (change this in production!)
JWT_SECRET=your_super_secret_key_12345

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Server
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables

**`client/.env`:**
```env
# API Base URL
VITE_API_URL=http://localhost:5000/api
```

---

## 🐛 Debugging

### Backend Debugging

**Using console.log:**
```javascript
// In controllers or routes
console.log('Debug info:', data);
console.error('Error:', error);
```

**Using debugger:**
```javascript
// Add breakpoint
debugger;

// Run with inspector
node --inspect index.js
// Then open chrome://inspect in Chrome
```

### Frontend Debugging

**Browser DevTools:**
- F12 or Right-click > Inspect
- Console tab for errors
- Network tab for API calls
- Application tab for cookies & localStorage

**React Developer Tools:**
- Extension: https://chrome.google.com/webstore
- Inspect components & state

**VS Code Debugger:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server/index.js"
    }
  ]
}
```

---

## 🎨 Code Formatting & Linting

### Install Prettier & ESLint (Optional)

**Backend:**
```bash
cd server
npm install --save-dev prettier eslint
```

**Frontend:**
```bash
cd client
npm install --save-dev prettier eslint eslint-plugin-react
```

### Format Code
```bash
# Format all files
npx prettier --write .

# Format specific file
npx prettier --write src/App.jsx
```

---

## 📝 Common Tasks

### Adding a New API Endpoint

**1. Create Controller Function:**
```javascript
// server/controllers/myController.js
exports.myFunction = async (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**2. Create Route:**
```javascript
// server/routes/myRoutes.js
const express = require('express');
const { myFunction } = require('../controllers/myController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.post('/', authMiddleware, myFunction);

module.exports = router;
```

**3. Mount Route in index.js:**
```javascript
const myRoutes = require('./routes/myRoutes');
app.use('/api/my-endpoint', myRoutes);
```

### Adding a New React Component

**1. Create Component:**
```jsx
// client/src/components/MyComponent.jsx
import React from 'react';

const MyComponent = ({ prop }) => {
  return (
    <div>
      <h1>My Component</h1>
    </div>
  );
};

export default MyComponent;
```

**2. Import & Use:**
```jsx
import MyComponent from '../components/MyComponent';

// In another component:
<MyComponent prop="value" />
```

### Adding a New Page

**1. Create Page:**
```jsx
// client/src/pages/MyPage.jsx
import React from 'react';

const MyPage = () => {
  return (
    <div className="min-h-screen">
      <h1>My Page</h1>
    </div>
  );
};

export default MyPage;
```

**2. Add Route in App.jsx:**
```jsx
import MyPage from './pages/MyPage';

// In Routes:
<Route path="/my-page" element={<MyPage />} />
```

---

## 🚨 Troubleshooting

### Port Already in Use

**Find process using port:**
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Or change port in .env:**
```env
PORT=5001
```

### CORS Errors

**Check:**
1. Verify `CLIENT_URL` in `server/.env`
2. Ensure frontend URL matches
3. Check browser console for exact error

**Solution:**
```javascript
// server/index.js
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Restart MongoDB
brew services restart mongodb-community

# Check connection string in .env
MONGO_URI=mongodb://localhost:27017/doctor-review
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if package is in package.json
npm list <package-name>
```

### Hot Reload Not Working

**Backend:**
- Ensure `nodemon` is installed: `npm install -g nodemon`
- Check `package.json` has `"dev": "nodemon index.js"`

**Frontend:**
- Restart Vite dev server
- Clear browser cache
- Check `vite.config.js` configuration

---

## 📊 Performance Tips

### Frontend Optimization
```javascript
// Use React.memo for component optimization
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// Use useCallback to memoize functions
const handleClick = useCallback(() => {
  // Function logic
}, [dependencies]);

// Use useMemo for expensive calculations
const value = useMemo(() => {
  return expensiveCalculation();
}, [dependencies]);
```

### Backend Optimization
```javascript
// Use indexes for frequently queried fields
userSchema.index({ email: 1 });

// Use lean() for read-only queries
const doctors = await Doctor.find().lean();

// Use select() to limit fields
const user = await User.findById(id).select('name email');
```

---

## 📚 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)

### Tools
- [Postman](https://postman.com)
- [MongoDB Compass](https://mongodb.com/compass)
- [VS Code](https://code.visualstudio.com)
- [Node Inspector](chrome://inspect)

### NPM Packages Used
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.3",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "react": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0",
  "tailwindcss": "^3.2.4"
}
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Update JWT_SECRET in production
- [ ] Update MONGO_URI to production database
- [ ] Set NODE_ENV=production
- [ ] Remove console.logs
- [ ] Test all features
- [ ] Update CLIENT_URL for CORS
- [ ] Build frontend: `npm run build`
- [ ] Commit to git
- [ ] Deploy to hosting service

---

## 🎓 Learning Path

1. **Understand the Architecture** - Read SETUP.md
2. **Run the Application** - Follow QUICKSTART.md
3. **Explore the Code** - Check each component
4. **Modify & Extend** - Use examples above
5. **Test & Debug** - Use debugging tools
6. **Deploy** - Follow deployment checklist

---

**Happy Developing! 🚀**
