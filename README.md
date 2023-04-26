# my-page

Min side

# Local setup

## Install development tools

### NVM (Node Version Manager)
Install nvm - https://github.com/nvm-sh/nvm#installation or https://tecadmin.net/install-nvm-macos-with-homebrew/

### Node
Install node - `nvm install node`

## Running the API

Running the API locally (in IDEA or on commandline) requires a database - activate the profile `h2` or `local` (the `local`profile requires a running MySQL db (see application-local.properties for connection details))

The API can also be run using the maven wrapper locally `./mvnw -DskipTests -Dspring-boot.run.profiles=local clean spring-boot:run`

The api will run on localhost:8080 - See http://localhost:8080/api/swagger-ui/index.html for api doc

## Running the app

Build the app with `npm install` and run it with `npm run dev`. The app will run on http://localhost:3000 (with a proxy to the api running on localhost:8080).

### Local MySQl

There is a Docker Compose file for running a local MySQL with some semi-random testdata under `my-page-api`, this can be run with the following command: `docker-compose -f my-page-api/docker-compose.yaml up local-mypage-db -d`

Alternatively you can run a clean MySQL db without data using the following:
`docker run -e MYSQL_USER=mypage -e MYSQL_PASSWORD=mypage -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=mypage -d -p 3306:3306 mysql:5.7.8`

Both of these will set up MySQL to work when running the api with the `local` profile.

### CLI for Google Cloud

If you are only doing local development and testing, there is
no need to install the Google Cloud (gcloud) CLI tool. However,
if you are planning on deploying changes, you will need the tool.

Install gcloud cli - https://cloud.google.com/sdk/docs/install & https://cloud.google.com/code/docs/quickstarts

`gcloud init`

`gcloud components install app-engine-java`

`gcloud config set project my-page-jpro`


# Deploy

Both the API and the app runs in the same Google App Engine

### API

The API can be build and deployed using the maven wrapper `./mvnw -DskipTests package appengine:deploy`

The routing for the api is configured in dispatch.yaml and can be deployed with the command `gcloud app deploy dispatch.yaml`

### App

The app is build with `npm run build` and deployed with `gcloud app deploy`

