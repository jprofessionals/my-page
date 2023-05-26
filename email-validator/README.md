```shell
gcloud projects add-iam-policy-binding my-page-jpro-test \
  --member="serviceAccount:service-$(gcloud projects describe my-page-jpro-test --format 'value(projectNumber)')@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role=roles/iam.serviceAccountTokenCreator 
```
```shell
gcloud functions deploy email-validator \
    --gen2 \
    --region=europe-west1 \
    --runtime=java17 \
    --source=. \
    --entry-point=EmailValidatorFunction \
    --trigger-topic=raw-email
```

#### Allow Github Actions to deploy the function
```shell
gcloud iam service-accounts add-iam-policy-binding \
    "$(gcloud projects describe my-page-jpro-test --format 'value(projectNumber)')-compute@developer.gserviceaccount.com" \
    --member serviceAccount:github-actions@my-page-jpro-test.iam.gserviceaccount.com \
    --role roles/iam.serviceAccountUser
```
