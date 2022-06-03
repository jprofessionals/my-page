# my-page
Min side



# Local setup
Install nvm - https://github.com/nvm-sh/nvm#installation or https://tecadmin.net/install-nvm-macos-with-homebrew/ 

Install node - `nvm install node`

Install gcloud cli - https://cloud.google.com/sdk/docs/install & https://cloud.google.com/code/docs/quickstarts

`gcloud init`

`gcloud components install app-engine-java`

`gcloud config set project my-page-jpro`

# Build
...

# Running locally
Run the api in IDEA and the app with the command `npm start`, the api will run on  localhost:8080 and the app on localhost:3000 (with a proxy to the local api).

# Deploy
Both the API and the app runs in the same Google App Engine 

### API
The API can be build and deployed using the maven wrapper `./mvnw -DskipTests package appengine:deploy`

The routing for the api is configured in dispatch.yaml and can be deployed with the command `gcloud app deploy dispatch.yaml`

### App
The app is build with `npm run build` and deployed with `gcloud app deploy`
