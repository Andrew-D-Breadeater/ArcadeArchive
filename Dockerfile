# Use a lightweight Python Linux image
FROM python:3.11-slim

# Set environment variables to make Python output logs immediately (useful for debugging)
ENV PYTHONUNBUFFERED=1

# Create a working directory inside the container
WORKDIR /app

# Copy the requirements file first (to cache dependencies)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code
COPY src ./src

# The command to run the app
# Note: We point to src/app.py
CMD ["python", "src/app.py"]