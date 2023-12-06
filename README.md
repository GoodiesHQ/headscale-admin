# headscale-admin

Headscale-Admin is a Web Interface for [juanfont/headscale](https://github.com/juanfont/).

### IN ACTIVE DEVELOPMENT

Headscale-Admin should **not** be considered a production-ready application. It is very much still in active development and should be treated as such. I am not a professional developer and therefore my production is not as streamlined as it otherwise could be.

### Known Issues

- No API key rotation yet
- No selection of PreAuthKey in deployment yet
- PreAuthKeys in general are ugly looking

### Building

Headscale-Admin was built using [skeleton](https://github.com/skeletonlabs/skeleton) framework on top of SvelteKit + TailwindCSS. It uses svelte/adapter-static to produce only static files when built. They can be hosted on nearly any server or environment.

**Note:** If you are building Headscale-Admin from source and want to host it on an endpoint other than the base of the domain, e.g. "myheadscale.com/admin" then you must set the `ENDPOINT` environment variable when building. Otherwise, it will default to expecting to be hosted on the root path "myheadscale.com/" and redirects and resource loading will not work correctly if you place them in a child folder. Once built, it is recommended to rename the `build` directory to the same name as your `$ENDPOINT` variable so the requests can follow the folder structure and not have to be stripped or rewritten by a front end proxy.

##### Clone the repository

Clone a specific version without code history

```
git clone --depth 1 --branch <version> https://github.com/GoodiesHQ/headscale-admin
```

Alternatively, you can just clone the main branch for the latest release

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

All that is left is to build the static release files.

```
npm run build
```

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
      # configure CORS middleware if needed
      traefik.http.middlewares.headscale-cors.headers.accesscontrolallowmethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      traefik.http.middlewares.headscale-cors.headers.accesscontrolallowheaders: "*"
      traefik.http.middlewares.headscale-cors.headers.accesscontrolalloworiginlist: ""  # Add other origins if needed
      traefik.http.middlewares.headscale-cors.headers.accesscontrolmaxage: 100
      traefik.http.middlewares.headscale-cors.headers.addvaryheader: true
      traefik.http.routers.headscale.middlewares: headscale-cors
      # UDP ports for DERP and Wireguard tunnel
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

You may need to play with your settings to get the right domain and SSL support working for you. This example uses cloudflare API and requires a `./env/cloudflare.env` file to contain something like:

```
CF_API_EMAIL=myemail@example.com
CF_API_KEY=0011223344556677889900aabbccddeeff000
```

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
<img width="1089" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/75fb74ec-aa31-433e-a51c-812de1c12592">

### Users Page

An overview of all headscale Users with a List or Tile layout.

- Create and Delete Users
- Create and Manage PreAuth Keys
- List User's Nodes with Online Indicators

<img width="1087" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/4c30aea5-c394-46ce-b555-a52fcda8d384">

<img width="1087" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/9d0b8a8a-108e-43ea-ba82-9dee4edaf831">

<img width="632" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/5a648b9b-e381-45b7-985e-a62989c6487e">

### Nodes Page

An overview of all headscale Nodes with a List or Tile layout.

- Create and Delete Nodes
- Enable/Disable Advertised Routes
- Expire a Node

<img width="1089" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/1aa275c9-cc4c-4fea-9580-629cb6bbfe43">

<img width="1094" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/6f95b076-c429-4d3b-8fd0-8e9bf0129ca8">

<img width="626" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/96a84390-5a0a-42ce-9c96-5809650589b4">

### Deploy Page

A web utility to craft a "tailscale up" command when deploying new nodes.

**NOTE:** currently there is no option yet to select a PreAuth Key. That will be in the next update.

<img width="1086" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/7e9a4d03-f839-408b-814c-e7801397b13a">

### Settings Page

Store API URL and API Key information in the browser's LocalStorage. Set API refresh interval (how frequently users, preauth keys, nodes, and routes are updated). Enable/Disable console debugging (may get noisy).

<img width="1087" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/6790339c-4a9d-4f8f-8975-e4983f59cad9">
