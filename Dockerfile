FROM oven/bun:1.2.17

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Make the startup script executable
RUN chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the application with our custom startup script
CMD ["bun", "run", "start"]
