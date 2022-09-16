FROM node:14-alpine

# WORKDIR /app

# VOLUME ["/app"]

# COPY package*.json /app/

# RUN npm install --include=dev

# ENTRYPOINT /usr/local/bin/npm run start -- --host=0.0.0.0 --port=80 --disable-host-check --serve-path="/"
CMD [“/bin/sh”]
