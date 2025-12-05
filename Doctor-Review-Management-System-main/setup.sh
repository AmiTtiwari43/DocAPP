#!/bin/bash
# Doctor Review Management System - Quick Start Script

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Doctor Review Management System - Quick Start               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📦 STEP 1: Installing Dependencies..."
echo "=================================="
echo ""

echo "🔧 Installing Backend Dependencies..."
cd server
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
else
    echo "❌ Backend installation failed. Please check npm and try again."
    exit 1
fi
echo ""

echo "🔧 Installing Frontend Dependencies..."
cd ../client
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully!"
else
    echo "❌ Frontend installation failed. Please check npm and try again."
    exit 1
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Installation Complete!"
echo ""
echo "🚀 NEXT STEPS:"
echo "=================================="
echo ""
echo "Open TWO terminal windows:"
echo ""
echo "Terminal 1 - Start Backend Server:"
echo "  $ cd server"
echo "  $ npm run dev"
echo "  ✓ Server will run on http://localhost:5000"
echo ""
echo "Terminal 2 - Start Frontend App:"
echo "  $ cd client"
echo "  $ npm run dev"
echo "  ✓ App will run on http://localhost:5173"
echo ""
echo "Then open your browser:"
echo "  http://localhost:5173"
echo ""
echo "📝 Default Test Flow:"
echo "  1. Click 'Sign Up'"
echo "  2. Create account as Patient"
echo "  3. Click 'Search Doctors'"
echo "  4. Click on any doctor 'View Profile'"
echo "  5. Select date and time slot to book"
echo "  6. Use AI Chat widget (bottom right)"
echo ""
echo "📚 Documentation:"
echo "  - QUICKSTART.md (5-minute guide)"
echo "  - SETUP.md (comprehensive guide)"
echo "  - DEVELOPMENT_GUIDE.md (common tasks)"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Happy Coding! 🎉"
echo ""
