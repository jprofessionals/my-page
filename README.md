# my-page

Min side

# Local setup

## Install development tools

### Option 1: Using Nix (recommended)

This project includes a `flake.nix` file
that sets up a complete development environment with all the required tools and dependencies.

#### Prerequisites
1. Install Nix package manager:
   ```bash
   sh <(curl -L https://nixos.org/nix/install) --daemon
   ```

2. Enable flakes and nix-command:
   ```bash
   mkdir -p ~/.config/nix
   echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
   ```

3. Install direnv (optional, but recommended):
   If you have installed nix - the easiest way is to continue down the rabbit hole and install [home-manager](https://github.com/nix-community/home-manager)
   to handle as much as possible of your setup - and then you would add it to your (presumably zsh) shell configuration
   part, quite possibly like this:
   ```
   # direnv - https://direnv.net/ - allows us to manage our shell environment with Nix.
   # It's a bit like nix-shell, but more powerful.
   # Remember to hook direnv into your shell!
   # For zsh Add `eval "$(direnv hook zsh)"` to the end of your Zsh initExtra in your host-specific home.nix.
   programs.direnv = {
      enable = true;          # Enable direnv itself
      nix-direnv.enable = true; # Enable the crucial nix-direnv integration
   };
   ```
   And then into your `home.nix` file, inside the `initExtra` part (at the end) you add this:
   ```nix
   # Hook direnv into the shell (see zsh.nix) - use this in stead of sdkman, etc
   eval "$(direnv hook zsh)"
   ```

#### Using the Nix development environment
1. Enter the development shell:
   ```bash
   nix develop
   ```

   Or if you have direnv installed and set up:
   ```bash
   direnv allow
   ```

2. All required tools (Java 21, Maven, Kotlin, Node.js, npm, Terraform, Google Cloud SDK) will be available in the shell.

### Option 2: Manual installation

#### NVM (Node Version Manager)
Install nvm - https://github.com/nvm-sh/nvm#installation or https://tecadmin.net/install-nvm-macos-with-homebrew/ 

#### Node
Install node - `nvm install node`

#### SDK Man

Install [SDK-man](https://sdkman.io/) to help you handle:

* Java 21
* Maven 3.x
* (and other tools like gradle, activemq, jmeter, kotlin, spring boot, apache tomcat, spark, quarkus cli, etc etc)

#### Terraform and Google Cloud SDK
Follow the installation instructions in the Infrastructure section below.

## Running the API

Running the API locally (in IDEA or on commandline) requires a database - activate the profile `h2` or
`local` (the `local`profile requires a running MySQL db
(see [application-local.properties](my-page-api/src/main/resources/application-local.properties) 
for connection details))

The API can also be run using the maven wrapper locally 
`./mvnw -Dspring-boot.run.profiles=local clean spring-boot:run`

The api will run on localhost:8080 - See http://localhost:8080/api/swagger-ui/index.html for api doc

## Running the app

The project relies on auto-generated code based on an OpenAPI specification, so for everything to work, 
you must first run:

```bash
npm run build:openapi
```

and

```bash
mvn clean compile
```

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

# Setup resources in a new account

## Database
```
gcloud sql instances create my-page-jpro-test --region europe-west1 --tier db-g1-small
gcloud sql databases create my-page --instance my-page-jpro-test
```

### Create tables with liquibase
#### One time setup to proxy connections to the database
```
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.2.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy
gcloud auth application-default login
```

#### Run the proxy in the background
```
./cloud-sql-proxy --address 127.0.0.1 --port 3306 my-page-jpro-test:europe-west1:my-page-jpro-test &
```

#### In the main shell run
```
cd my-page-api
../mvnw -Dliquibase.url=jdbc:mysql://root:@localhost:3306/my-page liquibase:update
cd..
```

#### Stop the proxy in the background
```
kill %1
```

### Github Actions
```
gcloud iam service-accounts create github-actions --display-name="Service account for Github Actions"
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/appengine.deployer
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/appengine.serviceAdmin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/storage.objectAdmin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/iam.serviceAccountUser
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/cloudbuild.builds.editor
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/cloudfunctions.developer
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/compute.instanceAdmin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/pubsub.editor
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/container.admin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/iam.roleAdmin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/artifactregistry.admin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/iam.serviceAccountAdmin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/compute.admin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/bigquery.dataOwner
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/resourcemanager.projectIamAdmin
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com --role=roles/monitoring.editor
gcloud iam service-accounts keys create ./github-actions-service-account-private-key.json --iam-account github-actions@my-page-jpro-test.iam.gserviceaccount.com
base64 -i github-actions-service-account-private-key.json | pbcopy
```

### App Engine
#### One time setup
```
gcloud app create --region=europe-west
```

#### Manual deploy
##### App
```
cd my-page-app
npm run build
gcloud app deploy my-page-app/app.yaml
cd ..
```

##### API
```
cd my-page-api
../mvnw package appengine:deploy
cd ..
```

##### One time setup for routing after the first version of services have been deployed
```
gcloud app deploy my-page-app/dispatch.yaml
```


### Google Identity Services

Follow this guide: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
