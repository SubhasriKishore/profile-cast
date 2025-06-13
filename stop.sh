#!/bin/bash

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

# Function to clear logs
clear_logs() {
    log "Clearing all log files..."
    rm -f logs/*.log
    rm -f logs/*.pid
    log "Logs cleared successfully"
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Kill processes on required ports
    kill_required_ports
    
    # Clear logs
    clear_logs
    
    success "All services stopped successfully!"
}

# Run main function
main 