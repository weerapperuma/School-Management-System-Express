#!/bin/bash

# School Management System Setup Script

echo "🚀 Setting up School Management System Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your database configuration"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your database configuration"
echo "2. Run the database schema: sqlcmd -S localhost -U your_username -P your_password -i database/schema.sql"
echo "3. Start the development server: npm run dev"
echo "4. Access the API at: http://localhost:3000"
echo ""
echo "Default admin credentials:"
echo "Email: admin@school.com"
echo "Password: Admin123!"
echo ""
