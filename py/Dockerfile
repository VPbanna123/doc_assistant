# Use Python 3.11.9 base image
FROM python:3.11.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
COPY apt.txt ./apt.txt
RUN apt-get update && xargs -a apt.txt apt-get install -y && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Expose Render port
EXPOSE 10000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
