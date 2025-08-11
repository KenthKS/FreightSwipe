# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install openssl, which is a dependency for Prisma
RUN apk add --no-cache openssl

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

RUN rm -rf node_modules && npm install

# Copy Prisma schema and migrations
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the app
CMD ["npm", "start"]
