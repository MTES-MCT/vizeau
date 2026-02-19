# Node.js 24 LTS / Debian Trixie
FROM node:24-trixie-slim

RUN apt update && \
    apt install -y --no-install-recommends \
    git \
    make \
    gcc \
    g++ \
    cmake \
    libsqlite3-dev \
    libprotobuf-dev \
    protobuf-compiler \
    p7zip-full \
    && rm -rf /var/lib/apt/lists/*

# Tippecanoe
RUN apt update && \
    apt install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    git clone https://github.com/felt/tippecanoe.git /tmp/tippecanoe && \
    cd /tmp/tippecanoe && \
    make && \
    make install && \
    rm -rf /tmp/tippecanoe

# GDAL
RUN apt update && apt install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

CMD ["node", "index.js"]
