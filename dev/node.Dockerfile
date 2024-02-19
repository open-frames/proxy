FROM node:21.6-alpine

WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml /app/
RUN corepack enable && corepack prepare
COPY . .
RUN yarn install --immutable
RUN yarn build

WORKDIR /app/examples/nodejs

ENV PORT "8080"
CMD ["node", "dist/index.js"]
