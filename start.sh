#Start the backend server (FastAPI) on port 7860
#Wait 3 seconds for the backend to initialize
#Start the frontend server (Next.js) on port 3000
#Handle graceful shutdown when you press Ctrl+C
#The script includes:
#Process management to run both servers in parallel
#Cleanup function to properly shut down both servers
#Error handling for graceful termination
#Clear console output to show server status

#!/bin/bash
cd "$(dirname "$0")"

# Prefer Python 3.11, fallback to python3.10, else error
if command -v python3.11 &> /dev/null; then
  PYTHON_BIN="python3.11"
elif command -v python3.10 &> /dev/null; then
  PYTHON_BIN="python3.10"
else
  echo "ERROR: Python 3.11 or 3.10 is required. Please install it and try again."
  exit 1
fi

# Remove old venv if it was created with the wrong Python version
if [ -d "venv" ]; then
  VENV_PYTHON=$(venv/bin/python3 --version 2>/dev/null)
  if [[ "$VENV_PYTHON" != *"3.11"* && "$VENV_PYTHON" != *"3.10"* ]]; then
    echo "Removing old virtual environment created with $VENV_PYTHON"
    rm -rf venv
  fi
fi

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  $PYTHON_BIN -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r api/requirements.txt

# Change to api directory and run the app
cd api
uvicorn index:app --reload --port 5000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}

# Function to log errors
error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1"
}

# Function to log success
success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1"
}

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 1
    else
        return 0
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_retries=30
    local retry_count=0
    
    log "Waiting for $service_name to be ready..."
    while [ $retry_count -lt $max_retries ]; do
        if curl -s "$url" > /dev/null; then
            success "$service_name is ready!"
            return 0
        fi
        retry_count=$((retry_count + 1))
        sleep 2
    done
    
    error "$service_name failed to start after $max_retries attempts"
    return 1
}

# Function to setup Python environment
setup_python_env() {
    log "Setting up Python environment..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log "Creating virtual environment..."
        $PYTHON_BIN -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    log "Upgrading pip..."
    pip install --upgrade pip

    # Install Backend dependencies
    log "Installing Backend dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..

    # Verify installations
    log "Verifying installations..."
    local max_retries=3
    local retry_count=0
    local success=false

    while [ $retry_count -lt $max_retries ] && [ "$success" = false ]; do
        local missing_deps=()
        
        # Check each dependency with its correct import name
        local deps=(
            "fastapi:fastapi"
            "uvicorn:uvicorn"
            "pydantic:pydantic"
            "python-multipart:multipart"
            "python-dotenv:dotenv"
            "PyPDF2:PyPDF2"
            "aiohttp:aiohttp"
            "httpx:httpx"
            "python-dateutil:dateutil"
            "requests:requests"
            "starlette:starlette"
            "typing-extensions:typing_extensions"
            "openai:openai"
        )

        for dep_pair in "${deps[@]}"; do
            IFS=':' read -r dep import_name <<< "$dep_pair"
            if ! $PYTHON_BIN -c "import ${import_name}" 2>/dev/null; then
                missing_deps+=("$dep")
            fi
        done
        
        if [ ${#missing_deps[@]} -eq 0 ]; then
            success=true
            success "All dependencies verified successfully"
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                error "Missing dependencies: ${missing_deps[*]}"
                log "Retrying installation... (Attempt $retry_count of $max_retries)"
                pip install ${missing_deps[*]}
            else
                error "Failed to install dependencies after $max_retries attempts"
                error "Missing dependencies: ${missing_deps[*]}"
                return 1
            fi
        fi
    done
}

# Function to start Backend
start_backend() {
    log "Starting Backend..."
    
    # Check if port 5000 is available
    if ! check_port 5000; then
        error "Port 5000 is already in use"
        return 1
    fi
    
    # Start Backend
    cd backend
    # Set PYTHONPATH to include the project root
    export PYTHONPATH="$(cd .. && pwd):${PYTHONPATH}"
    # Start backend and show output on console while also writing to log file
    $PYTHON_BIN -m uvicorn app:app --host 0.0.0.0 --port 5000 2>&1 | tee ../logs/backend.log &
    BACKEND_PID=$!
    cd ..
    
    # Wait for Backend to be ready
    if ! wait_for_service "http://localhost:5000/health" "Backend"; then
        error "Failed to start Backend"
        return 1
    fi
    
    echo $BACKEND_PID > logs/backend.pid
    success "Backend started successfully!"
    return 0
}

# Function to start Frontend
start_frontend() {
    log "Starting Frontend..."
    
    # Check if port 3000 is available
    if ! check_port 3000; then
        error "Port 3000 is already in use"
        return 1
    fi
    
    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        error "frontend directory not found"
        return 1
    fi
    
    cd frontend
    
    # Check for package.json
    if [ ! -f "package.json" ]; then
        error "package.json not found in frontend directory"
        cd ..
        return 1
    fi
    
    # Clean up node_modules and lock files
    log "Cleaning up node_modules and lock files..."
    rm -rf node_modules package-lock.json .next
    
    # Install dependencies
    log "Installing frontend dependencies..."
    npm install --verbose 2>&1 | tee -a ../logs/frontend.log
    
    # Build the frontend
    log "Building frontend..."
    npm run build 2>&1 | tee -a ../logs/frontend.log
    
    # Start Frontend
    log "Starting frontend server..."
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for Frontend to be ready
    if ! wait_for_service "http://localhost:3000" "Frontend"; then
        error "Failed to start Frontend"
        cd ..
        return 1
    fi
    
    echo $FRONTEND_PID > ../logs/frontend.pid
    success "Frontend started successfully!"
    cd ..
    return 0
}

# Function to clear logs
clear_logs() {
    log "Clearing all log files..."
    rm -f logs/*.log
    rm -f logs/*.pid
    log "Logs cleared successfully"
}

# Function to kill process on a port
kill_port() {
    local port=$1
    if lsof -ti :$port > /dev/null; then
        log "Killing process on port $port..."
        lsof -ti :$port | xargs kill -9
        sleep 1
    fi
}

# Function to kill all required ports
kill_required_ports() {
    log "Killing processes on required ports..."
    kill_port 5000  # Backend
    kill_port 3000  # Frontend
    log "All required ports cleared"
}

# Function to cleanup on exit
cleanup() {
    log "Cleaning up..."
    kill_required_ports
    clear_logs
    exit 1
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Create logs directory
    mkdir -p logs
    
    # Clear existing logs
    clear_logs
    
    # Kill processes on required ports
    kill_required_ports
    
    # Setup Python environment
    setup_python_env || cleanup
    
    # Start Backend
    start_backend || cleanup
    
    # Start Frontend
    start_frontend || cleanup
    
    success "All services started successfully!"
    log "Backend: http://localhost:5000"
    log "Frontend: http://localhost:3000"
    
    # Keep script running and handle cleanup on exit
    wait
}

# Run main function
main 