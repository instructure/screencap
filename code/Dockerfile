# The chromium build only currently exists for amd64
FROM --platform=amd64 instructure/node:18

ENV NODE_ENV test

USER root

# Depedencies taken from here: https://github.com/puppeteer/puppeteer/blob/6098bab2ba68276c85a974e17c9fe3bdac8c4c58/docs/troubleshooting.md#chrome-doesnt-launch-on-linux (chromium) and 
# from here https://github.com/puppeteer/puppeteer/blob/6098bab2ba68276c85a974e17c9fe3bdac8c4c58/docker/Dockerfile (fonts)
# to allow chromium to run
RUN apt-get update --quiet=2 \
 && apt-get install --quiet=2 ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
     libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
     libpangocairo-1.0-0 libstdc++6  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
     libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
     fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf > /dev/null \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER docker

COPY --chown=docker:docker ./package.json ./package-lock.json ./
RUN npm install
COPY --chown=docker:docker  . ./
