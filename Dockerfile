FROM node:18-bullseye

# Install system dependencies dan Python untuk Piper
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    espeak-ng \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install build tools
RUN python3 -m pip install --upgrade pip setuptools wheel

# Install Piper TTS dengan semua dependencies
RUN python3 -m pip install --no-cache-dir piper-tts pathvalidate
# RUN python3 -m pip install piper-tts pathvalidate


WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci

# Copy application code
# COPY models/ ./models/
COPY server.js .

# Expose port 3000
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]
