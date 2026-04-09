FROM node:22-alpine

WORKDIR /app/apps/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json* ./
RUN npm install

COPY apps/frontend/ ./

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
