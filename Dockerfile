ARG NODE_VERSION=22.20.0
FROM node:${NODE_VERSION}-slim

LABEL fly_launch_runtime="Node.js"


ENV NODE_ENV="production"

ARG PNPM_VERSION=10.18.2
RUN npm install -g pnpm@$PNPM_VERSION

RUN apt-get update -qq && \
apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY Backend/package.json ./Backend/package.json
RUN pnpm install --frozen-lockfile --filter backend --prod

COPY . .

EXPOSE 3000
CMD [ "pnpm", "start" ]
