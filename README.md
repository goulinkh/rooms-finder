<h3 align="center"><i><span style="font-size: 1.1em;">∃</span> S, S=Ø </i></h3>

---

A [RESTFul API](https://rooms-finder.goulin.fr/doc) with [a basic frontend](https://rooms-finder.goulin.fr) that helps the students of the University Paul Sabatier to easily find free amphitheaters and class rooms :

<p align="center"><img src="/resources/img/demo.gif" alt="rooms-finder"/></p>

`rooms-finder` is entirely built with Typescript & some Javascript, you are free to use the API to integrate functionalities to your app but don't abuse the system otherwise your IP will be blocked permanently, otherwise you can self host the API.

## Self host the backend service
### prerequisites
* Docker with Docker-compose
* A text editor

### 1. environment setup
You need a file in the root directory of the project called `.env` which contains the configuration of the service.
To quickly create a `.env` file you can just copy the `.env.sample` file and change it as you like.

#### Env variables

| Key              | Default value | Description                                                                                                                                                                                                                             |
| ---------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`           | `8080`        | the port of the HTTP server, this port is not the port that you will you, to change the public port of the app you have to change it inside of `docker-compose.override.yml` inside of `services.backend.ports` which is equal to 2002 |
| `ENV`            | `✖`           | This is a required value : `prod` or `dev`                                                                                                                                                                                              |
| `LOG`            | `true`        | if `false` the server will not log anything                                                                                                                                                                                             |
| `PLANNING_START` | `2019-09-01`  | the date of the first month to fetch plannings of                                                                                                                                                                                       |
| `PLANNING_END`   | `2020-01-01`  | the date of the last month to fetch plannings of                                                                                                                                                                                        |

### 2. Launching the server
One you created the `.env` file with all the required variables, you can start the server in the background with :
```bash
./scripts/docker-compose.sh up -d
```

You can see the logs of the server with :
```bash
./scripts/docker-compose.sh logs -f backend
```

## Issues
feel free to open an issue for feedback and issues.
