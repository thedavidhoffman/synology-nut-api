# Synology NUT API

This project runs a small Node.js HTTP API in Docker and reads UPS telemetry from Synology's built-in NUT (`upsd`) server.

## 🔋 Why?

I run [Homarr](https://homarr.dev/) for my homelab's dashboard (for my Synology servers). I have a UPS connected to one of my Synology servers. This project connects to the Synology server's built-in [NUT](https://networkupstools.org/) server that returns an html widget that can then be used on a Homarr board. It also exposes json data via an api.

## 🤖 Disclaimer

I created this project using Codex. I then made several passes (using AI) to clean up the code and bring it more in line with my specs.

## 🚀 What it exposes

- `GET /health` returns a basic health check
- `GET /api/ups` returns all UPS variables reported by NUT
- `GET /api/ups/{variable}` returns a single UPS variable such as `battery.charge`
- `GET /widget/ups` returns a styled HTML widget view of the same UPS telemetry

Example response from `GET /api/ups`:

```json
{
  "ups_name": "ups",
  "source": {
    "host": "192.168.1.10",
    "port": 3493
  },
  "data": {
    "battery.charge": "100",
    "battery.runtime": "3660",
    "input.voltage": "120.0",
    "ups.load": "18",
    "ups.status": "OL"
  }
}
```

## 🧰 Synology setup

1. In DSM, enable the Synology UPS service and the network UPS server. (Control Panel... Power & Hardware... UPS)
2. Add the Docker host as an allowed network UPS client if Synology asks for permitted IPs.
3. Note the Synology NAS IP address and the UPS device name.

The default NUT port is `3493`. Many Synology setups expose the UPS as `ups`, but some use another name. If you are unsure, start with `ups`.

## ⚙️ Configuration

The container uses environment variables:

- `NUT_HOST`: Synology NAS hostname or IP
- `NUT_PORT`: NUT server port, usually `3493`
- `NUT_UPS_NAME`: UPS device name, often `ups`
- `NUT_USERNAME`: optional username if your NUT server requires auth (for Synology enter: monuser)
- `NUT_PASSWORD`: optional password if your NUT server requires auth (for Synology enter: secret)
- `NUT_TIMEOUT_SECONDS`: timeout for NUT requests, default `5`
- `API_HOST`: API bind host, default `0.0.0.0`
- `API_PORT`: API bind port, default `8000`
- `RATE_LIMIT_HEALTH`: requests per minute allowed for `/health`, default `60`
- `RATE_LIMIT_API`: requests per minute allowed for `/api/ups` and `/api/ups/{variable}`, default `12`
- `RATE_LIMIT_WIDGET`: requests per minute allowed for `/widget/ups`, default `30`

## 🐳 Run with Docker Compose

Update [`docker-compose.yml`] with your Synology NAS address, then run:

```powershell
docker compose up --build -d
```

The API will be available at:

- [http://localhost:8000/health](http://localhost:8000/health)
- [http://localhost:8000/api/ups](http://localhost:8000/api/ups)
- [http://localhost:8000/widget/ups](http://localhost:8000/widget/ups)

## 🐳 Run with plain Docker

```powershell
docker build -t synology-nut-api .
docker run -d ^
  --name synology-nut-api ^
  -p 8000:8000 ^
  -e NUT_HOST=192.168.1.10 ^
  -e NUT_UPS_NAME=ups ^
  synology-nut-api
```

NOTE: update the external port to your needs. If you do change the external port, make sure you change the 8000 port value in the rest of this documentation accordingly. 🔌

## 📦 Pack the docker image as a tarball
```
docker save -o synology-nut-api.tar synology-nut-api:latest
```

You can then import the tarball in Synology's Container Manager via Image... Action... Import.

## 👨‍💼 Synology Container Manager

If you want to run the container directly on the Synology NAS:

1. Open Container Manager.
2. Build the image from this folder, or push it to a registry first.
3. Add the same environment variables shown above.
4. Publish container port `8000`.
5. Start the container and test `/health` or `/api/ups` or `/widget/ups`.

## 🏠 Add the widget to Homarr

You can add the HTML widget endpoint to a Homarr board by embedding [`/widget/ups`](http://localhost:8000/widget/ups).

1. Make sure Homarr can reach this app over the network.
2. Copy the widget URL for your environment, for example:
   `http://192.168.1.10:8000/widget/ups`
3. In Homarr, open your board in edit mode.
4. Add a widget that supports embedding an external page, such as an `iframe`, `website`, or `custom app` style tile depending on your Homarr version.
5. Paste the widget URL into the target URL field.
6. Resize the tile until the UPS card fits comfortably.
7. Save the board and confirm the widget loads and refreshes.

Notes:

- If Homarr is running in Docker on the same NAS, `localhost` usually will not work unless both containers share the same network namespace. Use the NAS IP address or the container/service name on a shared Docker network. 🌐
- If the widget does not load inside Homarr, first open the widget URL directly in your browser to confirm the API container is reachable. 🧪
- If your Homarr setup blocks iframe-style embeds for some widgets, use the widget type intended for external websites/pages rather than a simple link tile. 🪟

## 💻 Local development

```
npm test
npm start
npm start:dev (runs using a mock NutClient, enables local testing without having to deploy as a docker container on a system with a real NUT server)
```

## 📝 Notes

- ✨ This service speaks the NUT text protocol directly, so there is no extra runtime dependency beyond Node.js itself.
- 🛡️ If Synology denies access, confirm the Docker host or container network is allowed by the NAS firewall and by the Network UPS Server allowlist.
