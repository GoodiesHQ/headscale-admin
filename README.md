# headscale-admin

Headscale-Admin is meant to be a simple, modern web interface for [juanfont/headscale](https://github.com/juanfont/headscale) - *"An open source, self-hosted implementation of the Tailscale control server."*

Headscale-Admin should currently be considered a beta application. It is very much still in active development and should not be treated as a final product, but when used properly, it should be safe to run in a production environment.

[![Star History Chart](https://api.star-history.com/svg?repos=goodieshq/headscale-admin&type=Timeline&size=mobile)](https://star-history.com/#goodieshq/headscale-admin&Timeline)

### Known Issues

- In headscale 0.23.0-alpha5, tags cannot be fully removed. [This is a bug #1849 in headscale](https://github.com/juanfont/headscale/issues/1849).

### Building

Headscale-Admin was built using [skeleton](https://github.com/skeletonlabs/skeleton) framework on top of SvelteKit + TailwindCSS. It uses svelte/adapter-static to produce only static files when built. They can be hosted on nearly any server or environment.

#### Endpoint
**Note:** If you are building Headscale-Admin from source and want to host it on an endpoint other than the base of the domain, e.g. "myheadscale.com/admin" then you must set the `ENDPOINT` environment variable when building. Otherwise, it will default to expecting to be hosted on the root path "myheadscale.com/" and redirects and resource loading will not work correctly if you place them in a child folder. Once built, it is recommended to rename the `build` directory to the same name as your `$ENDPOINT` variable so the requests can follow the folder structure and not have to be stripped or rewritten by a front end proxy. The provided Dockerfile shows this in practice.

##### Clone the repository

Clone a specific version without code history

```
git clone --depth 1 --branch <version> https://github.com/GoodiesHQ/headscale-admin
```

Alternatively, you can just clone the main branch for the latest release or `git checkout <version>` for a specific version.

```
git clone https://github.com/GoodiesHQ/headscale-admin
```

#### Set your ENDPOINT

If something other than the default '/' is desired, then set your `ENDPOINT` environment variable. The docker container uses the "/admin" endpoint by default, so that is what is shown in the examples.

Bash:

```
export ENDPOINT="/admin"
```

Cmd.exe:

```
set ENDPOINT=/admin
```

PowerShell:

```
$env:ENDPOINT=/admin
```

#### Build

You can create the production build by running:

```
npm run build
```
This will create a `build` directory.

#### Host Files

It is recommended that you replicate your path structure after the ENDPOINT you provided. If you used `/admin`, then rename the `build` directory as `admin` and place that directory in the root of your hosting. If you are hosting it on the root path (no `ENDPOINT` variable provided), then you can place the contents of the `build` directory directly into the root path.

### Build with Docker

The recommended way to deploy is by using docker. Pre-built images are provided and always use the `/admin` endpoint by default. If you want to build an image for a different endpoint, use build args.

```
# Using default /admin
docker build . -t headscale-admin
```

```
# Use the root path
docker build . -t headscale-admin --build-arg ENDPOINT=
```

```
# Using non-default /manager
docker build . -t headscale-admin --build-arg ENDPOINT=/manager
```

Then run. The image uses port 80 for hosting HTTP and it is expected that a front end proxy service will perform SSL certificate management.

```
docker run -p 8000:80 headscale-admin
```

#### Run With Docker

You can also use a pre-built image:

```
docker run -p 8000:80 goodieshq/headscale-admin:latest
```

#### Docker Compose

It is common to want to host both headscale and headscale-admin in the same docker compose configuration. My recommended method is to use Traefik which I have been running in front of headscale with no issues. This is an example deployment using Traefik.

Assumptions:

- Host is running at `tailscale.example.com`
- Your SSL cert resolver is called `myresolver`
- Traefik connects to a backend network called `proxy`
- You are in the America/Los_Angeles time zone
- A local directory called 'conf' contains your headscale 'config.yaml'
- You are using SQLite for the headscale database.

For larger deployments, it is recommended to use PostgreSQL. This can be done by:

- Adding a Postgres service to the docker-compose.yml file
- Created a non-external network called "backend"
  - Assign the postgres service to "backend" network only
  - Assign the headscale service to both "proxy" and "backend" networks to allow it to be reachable over the internet and also to reach the database without exposing the database to the public proxy network.
- Setting the Postgres settings in your config.yaml file

```
version: "3.9"

services:
  headscale:
    image: headscale/headscale:latest
    container_name: headscale
    restart: unless-stopped
    environment:
      - TZ=America/Los_Angeles
    volumes:
      - ./conf:/etc/headscale
      - headscale-data:/var/lib/headscale
    entrypoint: headscale serve
    networks:
      - proxy
    labels:
      traefik.enable: "true"
      traefik.docker.network: "proxy"
      # Configure service and router
      traefik.http.services.headscale.loadbalancer.server.port: 8080
      traefik.http.services.headscale.loadbalancer.server.scheme: http
      traefik.http.routers.headscale.rule: Host(`tailscale.example.com`)
      traefik.http.routers.headscale.entrypoints: websecure
      traefik.http.routers.headscale.tls.certresolver: myresolver
      traefik.http.routers.headscale.service: headscale
      # Configure CORS middleware if needed
      traefik.http.middlewares.headscale-cors.headers.accesscontrolallowmethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      traefik.http.middlewares.headscale-cors.headers.accesscontrolallowheaders: "*"
      traefik.http.middlewares.headscale-cors.headers.accesscontrolalloworiginlist: ""  # Add other origins if needed
      traefik.http.middlewares.headscale-cors.headers.accesscontrolmaxage: 100
      traefik.http.middlewares.headscale-cors.headers.addvaryheader: true
      traefik.http.routers.headscale.middlewares: headscale-cors
      # UDP ports for DERP, etc
      traefik.udp.services.headscale-udp-41641.loadbalancer.server.port: 41641
      traefik.udp.services.headscale-udp-3478.loadbalancer.server.port: 3478

  headscale-admin:
    image: goodieshq/headscale-admin:latest
    container_name: headscale-admin
    restart: unless-stopped
    networks:
      - proxy
    labels:
      traefik.enable: "true"
      traefik.docker.network: "proxy"
      traefik.http.services.headscale-admin.loadbalancer.server.port: 80
      traefik.http.services.headscale-admin.loadbalancer.server.scheme: http
      traefik.http.routers.headscale-admin.rule: Host(`headscale.example.com`) && PathPrefix(`/admin`)
      traefik.http.routers.headscale-admin.entrypoints: websecure
      traefik.http.routers.headscale-admin.tls.certresolver: myresolver

networks:
  proxy:
    external: true

volumes:
  headscale-data:
```

To set up this environment, you need to have a Traefik configuration:

Create an external network called `proxy`. Anything on this network, even if it is in a different docker-compose.yml file, will be able to be reached by Traefik and can therefore be reached over the Internet based on your Traefik labels.

```
docker network create proxy
```

You may need to play with your settings to get the right domain and SSL support working for you. This example uses cloudflare API and requires a `./env/cloudflare.env` (relative to docker-compose.yml) file to contain something like:

```
CF_API_EMAIL=myemail@example.com
CF_API_KEY=0011223344556677889900aabbccddeeff000
```

where the CF_API_KEY is your Global API key from your Cloudflare domain dashboard: 

<img width="355" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/7e4ff394-57b9-41eb-8084-76e4c4ed4347">

<img width="594" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/5219a2c9-f201-45aa-a0d5-ab8bc6218ddb">



The Traefik docker-compose.yml:

```
version: "3.9"

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.insecure=true"
      - "--log.level=DEBUG"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.dnschallenge=true"
      - "--certificatesresolvers.myresolver.acme.dnschallenge.provider=cloudflare"
      - "--certificatesresolvers.myresolver.acme.email=myemail@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
      - "--serverstransport.insecureskipverify=true"
    env_file:
      - ./env/cloudflare.env
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - proxy
    labels:
      traefik.enable: "true"
      traefik.docker.network: "proxy"
      traefik.http.routers.traefik.tls.certresolver: myresolver
      traefik.http.routers.traefik.rule: Host(`traefik.example.com`)
      traefik.http.routers.traefik.middlewares: hsts-header
      traefik.http.routers.traefik.service: api@internal
      #
      traefik.http.middlewares.hsts-header.headers.customResponseHeaders.Strict-Transport-Security: "max-age=63072000"

networks:
  proxy:
    external: true

volumes:
  letsencrypt: {}
```

### Creating an API Key

Your first API key must be created using the `headscale` CLI.

Natively:

```
headscale apikey create
```

Docker (running with container name "headscale"):

```
docker exec headscale headscale apikey create
```

### Home Page

A brief overview of the HeadScale environment with the number of users, nodes, and routes.
<img width="1088" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/c265475e-ed2b-4fa4-8ef7-1f4683aaca8a">



### Users Page

An overview of all headscale Users with a List or Tile layout.

- Create, Rename, and Delete Users
- Create, View, and Expire PreAuth Keys
- List User's Nodes with Online Indicators

<img width="1088" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/47c3dea0-2f5d-4654-b695-acb5900e615c">

<img width="1089" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/0f52191f-6e51-4834-8408-28c2da0efd38">

<img width="777" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/459d2dd7-6bca-4489-b1e1-2dbdbe9d4239">


### Nodes Page

An overview of all headscale Nodes with a List or Tile layout.

- Create and Delete Nodes
- Enable/Disable Advertised Routes
- Expire a Node

<img width="776" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/eae8253e-3aba-4cfa-af90-5012ad940405">

<img width="777" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/a60739b5-2549-4733-97c0-a75d8554527b">

<img width="775" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/47d48cd8-feed-4fc3-8b8e-97589934e2ab">


### Deploy Page

A web utility to craft a "tailscale up" command when deploying new nodes.

<img width="947" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/36194902-6ca4-4597-bc95-2293e8bfdad5">


### Settings Page

Store API URL and API Key information in the browser's LocalStorage. Set API refresh interval (how frequently users, preauth keys, nodes, and routes are updated). Use the legact headscale `/machines` API endpoint instead of `/nodes`. Enable/Disable console debugging (may get noisy).

<img width="949" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/673e142a-359d-4a40-900b-883ec25debce">

