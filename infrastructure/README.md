```shell
gcloud storage buckets create gs://terraform-state-plenary-plane-385610 --location europe-west1 --public-access-prevention
gcloud storage buckets update gs://terraform-state-plenary-plane-385610 --versioning

gcloud beta services identity create --project plenary-plane-385610 --service pubsub
```
