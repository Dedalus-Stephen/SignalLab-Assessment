FROM node:22-alpine

WORKDIR /app/apps/backend

# Copy package files and install deps
COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma /app/prisma
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Copy backend source and build
COPY apps/backend/ ./
RUN npm run build

WORKDIR /app
EXPOSE 3001
CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy --schema=/app/prisma/schema.prisma && npx prisma generate --schema=/app/prisma/schema.prisma && node dist/main.js"]