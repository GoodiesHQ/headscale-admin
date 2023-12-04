FROM node:20-alpine AS build

ARG ENDPOINT=/admin
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

# Build static application
RUN npm run build

FROM caddy:latest
WORKDIR /app
COPY --from=build /app/build/ ./build
COPY Caddyfile /etc/caddy/Caddyfile
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

# # Fresh container
# FROM node:20-alpine
# WORKDIR /app
# 
# # Copy built application
# COPY --from=build /app/build/ ./build
# COPY --from=build /app/package.json ./
# COPY --from=build /app/package-lock.json ./
# 
# # Install dependencies
# RUN npm install --omit=dev
# 
# # Run on default node port
# EXPOSE 3000
# CMD ["node", "/app/build/index.js"]