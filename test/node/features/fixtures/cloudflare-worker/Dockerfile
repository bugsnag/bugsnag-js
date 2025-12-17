ARG NODE_VERSION=12
FROM --platform=linux/amd64 node:$NODE_VERSION AS builder

# COPY ./zscaler-root-ca.crt* /usr/local/share/ca-certificates/
# RUN if [ -f /usr/local/share/ca-certificates/zscaler-root-ca.crt ]; then cat /usr/local/share/ca-certificates/zscaler-root-ca.crt >> /etc/ssl/certs/ca-certificates.crt; fi

# ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/zscaler-root-ca.crt

WORKDIR /app

COPY package* ./
RUN npm install

COPY . ./

RUN npm install --no-package-lock --no-save bugsnag-node*.tgz bugsnag-plugin-cloudflare-workers*.tgz

# Build the worker bundle
ENV WRANGLER_SEND_METRICS=false
RUN npx wrangler deploy --dry-run --outdir dist

# Runtime stage using workerd
FROM --platform=linux/amd64 jacoblincool/workerd:latest

WORKDIR /worker

# Copy the built worker
COPY --from=builder /app/dist/index.js .

# Create worker.capnp configuration file using RUN with echo
RUN printf 'using Workerd = import "/workerd/workerd.capnp";\n\
\n\
const config :Workerd.Config = (\n\
    services = [\n\
        (name = "main", worker = .worker),\n\
    ],\n\
    sockets = [\n\
        (service = "main", name = "http", address = "*:8080", http = ()),\n\
    ]\n\
);\n\
\n\
const worker :Workerd.Worker = (\n\
    modules = [\n\
        (name = "worker", esModule = embed "index.js"),\n\
    ],\n\
    compatibilityDate = "2025-12-16",\n\
    compatibilityFlags = ["nodejs_compat"],\n\
);\n' > worker.capnp

# EXPOSE 8080

CMD ["serve", "worker.capnp"]
