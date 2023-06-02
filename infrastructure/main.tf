terraform {
  backend "gcs" {
    bucket  = "terraform-state-plenary-plane-385610"
    prefix  = "terraform/state"
  }
}

variable "google_cloud_project_id" {
  type = string
  description = "The ID of the Google Cloud Platform project"
}

provider "google" {
  project = var.google_cloud_project_id
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

resource "google_artifact_registry_repository" "images" {
  format        = "docker"
  repository_id = "images"
}

resource "google_compute_address" "smtp-to-pubsub" {
  name = "smtp-to-pubsub"
}

module "gce-container" {
  source = "terraform-google-modules/container-vm/google"
  version = "~> 3.1.0"

  container = {
    image = "${google_artifact_registry_repository.images.location}-docker.pkg.dev/${var.google_cloud_project_id}/images/smtp-to-pubsub:1.0-SNAPSHOT"
    name = "smtp-to-pubsub"
  }

  restart_policy = "Always"
}

resource "google_compute_instance" "smtp-to-pubsub" {
  name         = "smtp-to-pubsub"
  machine_type = "f1-micro"
  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = module.gce-container.source_image
    }
  }

  metadata = {
    gce-container-declaration = module.gce-container.metadata_value
    google-logging-enabled    = "true"
    google-monitoring-enabled = "true"
  }

  labels = {
    container-vm = module.gce-container.vm_container_label
  }

  tags = ["smtp-to-pubsub"]

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.smtp-to-pubsub.address
    }
  }

  service_account {
    email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    scopes = [
      "cloud-platform"
    ]
  }
}

resource "google_compute_firewall" "allow-smtp" {
  name        = "allow-smtp"
  network     = "default"

  allow {
    protocol  = "tcp"
    ports     = ["25"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags = ["smtp-to-pubsub"]
}
