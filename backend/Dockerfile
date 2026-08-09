FROM node:22-alpine

WORKDIR /app

# Install build tools required for native C++ modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]

