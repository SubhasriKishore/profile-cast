#!/bin/bash

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source "venv/bin/activate"

# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
echo "Installing backend dependencies..."
pip install -r requirements.txt --no-cache-dir

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the backend server using uvicorn
echo "Starting backend server on port 8000..."
uvicorn app:app --host 0.0.0.0 --port 8000 --reload --log-level info