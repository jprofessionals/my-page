```shell
gcloud storage buckets create "gs://terraform-state-$(gcloud config get project)" --location europe-west1 --public-access-prevention
gcloud storage buckets update "gs://terraform-state-$(gcloud config get project)" --versioning

gcloud services enable compute.googleapis.com pubsub.googleapis.com container.googleapis.com artifactregistry.googleapis.com run.googleapis.com
gcloud beta services identity create --service pubsub
```
