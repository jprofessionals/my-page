terraform {
  backend "gcs" {
    bucket  = "terraform-state-plenary-plane-385610"
    prefix  = "terraform/state"
  }
}

provider "google" {
  project = "plenary-plane-385610"
  region  = "europe-west1"
  zone    = "europe-west1-c"
}

data "google_project" "project" {
}

resource "google_pubsub_schema" "raw-email-message" {
  name = "raw-email-message"
  type = "AVRO"
  definition = file("${path.module}/../schemas/src/main/resources/avro/raw-email-message.avsc")
}

resource "google_pubsub_topic" "validated-emails" {
  name = "validated-emails"

  depends_on = [google_pubsub_schema.raw-email-message]
  schema_settings {
    schema = "${data.google_project.project.id}/schemas/${google_pubsub_schema.raw-email-message.name}"
    encoding = "BINARY"
  }
  message_retention_duration = "${31*24*60*60}s"
  message_storage_policy {
    allowed_persistence_regions = ["europe-west1"]
  }
}
resource "google_pubsub_subscription" "validated-emails-to-bigquery" {
  name  = "validated-emails-to-bigquery"
  topic = google_pubsub_topic.validated-emails.name

  bigquery_config {
    table = "${google_bigquery_table.validated-emails.project}.${google_bigquery_table.validated-emails.dataset_id}.${google_bigquery_table.validated-emails.table_id}"
    use_topic_schema = true
    write_metadata = true
  }

  depends_on = [google_project_iam_member.viewer, google_project_iam_member.editor]
}

resource "google_project_iam_member" "viewer" {
  project = data.google_project.project.project_id
  role   = "roles/bigquery.metadataViewer"
  member = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "editor" {
  project = data.google_project.project.project_id
  role   = "roles/bigquery.dataEditor"
  member = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_bigquery_dataset" "pubsub" {
  dataset_id = "pubsub"
}

resource "google_bigquery_table" "validated-emails" {
  deletion_protection = false
  table_id   = "validated-emails"
  dataset_id = google_bigquery_dataset.pubsub.dataset_id

  schema = file("${path.module}/../smtp-to-pubsub/bigquery-raw-emails-schema.json")
}
