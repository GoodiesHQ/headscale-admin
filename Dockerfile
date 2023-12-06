ARG ENDPOINT=/admin
ARG PORT=80

FROM node:20-alpine AS build
ARG ENDPOINT
ENV ENDPOINT=$ENDPOINT

# Set up app directory
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies
RUN npm install

# Copy all required build files
COPY .eslintignore ./
COPY .eslintrc.cjs ./
COPY .npmrc ./
COPY .prettierignore ./
COPY .prettierrc ./
COPY postcss.config.cjs ./
COPY svelte.config.js ./
COPY tailwind.config.ts ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Copy source and static assets
COPY static/ ./static/
COPY src/ ./src/

# Build static application, endpoint is provided by $ENDPOINT
RUN npm run build 

FROM caddy:latest

ARG ENDPOINT
ARG PORT
ENV PORT=${PORT}

WORKDIR /app

# Use the endpoint name as the directory so it can be served without URL stripping
COPY --from=build /app/build/ ./${ENDPOINT}

COPY Caddyfile /etc/caddy/Caddyfile
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]