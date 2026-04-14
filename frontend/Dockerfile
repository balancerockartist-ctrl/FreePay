FROM node:20-slim

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY . .

ENV REACT_APP_BACKEND_URL=http://localhost:8001

CMD ["yarn", "start"]
