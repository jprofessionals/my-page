#### Create initial version of schema
```shell
gcloud pubsub schemas create raw-email --type=avro --definition-file=src/main/resources/avro/raw-email-message.avsc
```
