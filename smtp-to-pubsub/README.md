## Setup

### Create resources

#### Create Docker image repository
```shell
gcloud artifacts repositories create images --repository-format=docker --location=europe-west1 --description="Docker repository"
```

#### Create topic
```shell
gcloud pubsub topics create raw-email \
  --message-retention-duration=31d \
  --message-storage-policy-allowed-regions=europe-west1 \
  --message-encoding BINARY \
  --schema raw-email
```

### BigQuery

#### Create dataset and table
```shell
bq --location=EU mk --dataset pubsub
bq mk --table pubsub.raw-emails ./bigquery-raw-emails-schema.json

# This did not work for unknown reasons, had to be done manually in the GCP Console
gcloud projects add-iam-policy-binding my-page-jpro-test --member=serviceAccount:service-"$gcloud projects describe my-page-jpro-test --format 'value(projectNumber)'"\@gcp-sa-pubsub.iam.gserviceaccount.com --role=roles/bigquery.dataEditor --role=roles/bigquery.metadataViewer 
```

#### Create subscription
```shell
gcloud pubsub subscriptions create raw-email-to-bigquery \
  --topic=raw-email \
  --bigquery-table=my-page-jpro-test:pubsub.raw-emails \
  --use-topic-schema \
  --write-metadata
```

### Run as a container instance

#### Reserve an address
```shell
gcloud compute addresses create smtp-to-pubsub-instance --region=europe-west1
```

#### Create initial instance
```shell
gcloud compute instances create-with-container smtp-to-pubsub \
    --zone europe-west1-c \
    --container-image=europe-west1-docker.pkg.dev/my-page-jpro-test/images/smtp-to-pubsub:1.0-SNAPSHOT \
    --tags smtp-to-pubsub \
    --address smtp-to-pubsub-instance
```

#### Open port 25/TCP on firewall
```shell
gcloud compute firewall-rules create allow-smtp \
    --allow tcp:25 \
    --target-tags smtp-to-pubsub
```

#### Connect to inspect logs or similar
```shell
gcloud compute ssh smtp-to-pubsub --zone=europe-west1-c
```

#### Update container version
```shell
gcloud compute instances update-container smtp-to-pubsub --zone=europe-west1-c --container-image=europe-west1-docker.pkg.dev/my-page-jpro-test/images/smtp-to-pubsub:1.0-SNAPSHOT
```

