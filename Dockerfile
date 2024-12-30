# Use an official Bun runtime as a parent image
FROM oven/bun:latest

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Define the command to run the app
CMD ["bun", "start"]