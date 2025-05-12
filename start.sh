#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}==>${NC} $1"
}

# Function to print error messages
print_error() {
    echo -e "${RED}Error:${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
print_status "Checking required tools..."

# Check for conda
if ! command_exists conda; then
    print_error "Conda is required but not installed"
    exit 1
fi

# Check for Node.js
if ! command_exists node; then
    print_error "Node.js is required but not installed"
    exit 1
fi

# Check for pnpm
if ! command_exists pnpm; then
    print_status "pnpm not found. Installing pnpm..."
    npm install -g pnpm || {
        print_error "Failed to install pnpm"
        exit 1
    }
fi

# Create .env.local if it doesn't exist
if [ ! -f "machine-monitoring/.env.local" ]; then
    print_status "Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > machine-monitoring/.env.local
fi

# Activate conda environment
print_status "Activating conda environment (cuda-env)..."
eval "$(conda shell.bash hook)"
conda activate cuda-env || {
    print_error "Failed to activate conda environment 'cuda-env'"
    print_status "Available environments:"
    conda env list
    exit 1
}

# Install backend dependencies
print_status "Installing backend dependencies..."
cd service
if [ ! -f "requirements.txt" ]; then
    print_error "requirements.txt not found in service directory"
    exit 1
fi

print_status "Installing Python packages in conda environment..."
pip install -r requirements.txt || {
    print_error "Failed to install backend dependencies. Error code: $?"
    print_status "Trying with verbose output..."
    pip install -r requirements.txt -v
    exit 1
}
cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd machine-monitoring
pnpm install || {
    print_error "Failed to install frontend dependencies. Error code: $?"
    exit 1
}
cd ..

# Function to cleanup processes on exit
cleanup() {
    print_status "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    conda deactivate
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Start backend
print_status "Starting backend server..."
cd service
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
print_status "Starting frontend development server..."
cd machine-monitoring
pnpm dev &
FRONTEND_PID=$!
cd ..

print_success "Services started successfully!"
print_success "Backend running at: http://localhost:5000"
print_success "Frontend running at: http://localhost:3000"
print_status "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 