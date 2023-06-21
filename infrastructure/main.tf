terraform {
  backend "gcs" {
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.google_cloud_project_id
  region  = var.google_cloud_region
  zone    = var.google_cloud_zone
}

data "google_project" "project" {
}

resource "google_pubsub_schema" "email-message" {
  name       = "email-message"
  type       = "AVRO"
  definition = file("${path.module}/../schemas/src/main/resources/avro/email-message.avsc")
}

resource "google_pubsub_topic" "raw-emails" {
  name = "raw-emails"

  depends_on = [google_pubsub_schema.email-message]
  schema_settings {
    schema   = "${data.google_project.project.id}/schemas/${google_pubsub_schema.email-message.name}"
    encoding = "BINARY"
  }
  message_retention_duration = "${31*24*60*60}s"
  message_storage_policy {
    allowed_persistence_regions = [var.google_cloud_region]
  }
}

resource "google_pubsub_topic" "validated-emails" {
  name = "validated-emails"

  depends_on = [google_pubsub_schema.email-message]
  schema_settings {
    schema   = "${data.google_project.project.id}/schemas/${google_pubsub_schema.email-message.name}"
    encoding = "BINARY"
  }
  message_retention_duration = "${31*24*60*60}s"
  message_storage_policy {
    allowed_persistence_regions = [var.google_cloud_region]
  }
}

resource "google_pubsub_subscription" "raw-emails-to-bigquery" {
  name  = "raw-emails-to-bigquery"
  topic = google_pubsub_topic.raw-emails.name

  bigquery_config {
    table            = "${google_bigquery_table.raw-emails.project}.${google_bigquery_table.raw-emails.dataset_id}.${google_bigquery_table.raw-emails.table_id}"
    use_topic_schema = true
    write_metadata   = true
  }

  depends_on = [google_project_iam_member.viewer, google_project_iam_member.editor]
}

resource "google_pubsub_subscription" "validated-emails-to-bigquery" {
  name  = "validated-emails-to-bigquery"
  topic = google_pubsub_topic.validated-emails.name

  bigquery_config {
    table            = "${google_bigquery_table.validated-emails.project}.${google_bigquery_table.validated-emails.dataset_id}.${google_bigquery_table.validated-emails.table_id}"
    use_topic_schema = true
    write_metadata   = true
  }

  depends_on = [google_project_iam_member.viewer, google_project_iam_member.editor]
}

resource "google_project_iam_member" "viewer" {
  project = data.google_project.project.project_id
  role    = "roles/bigquery.metadataViewer"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "editor" {
  project = data.google_project.project.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_bigquery_dataset" "pubsub" {
  dataset_id = "pubsub"
  location   = "EU"
}

resource "google_bigquery_table" "raw-emails" {
  deletion_protection = false
  table_id            = "raw-emails"
  dataset_id          = google_bigquery_dataset.pubsub.dataset_id

  schema = file("${path.module}/bigquery-emails-schema.json")
}

resource "google_bigquery_table" "validated-emails" {
  deletion_protection = false
  table_id            = "validated-emails"
  dataset_id          = google_bigquery_dataset.pubsub.dataset_id

  schema = file("${path.module}/bigquery-emails-schema.json")
}

resource "google_artifact_registry_repository" "images" {
  format        = "docker"
  repository_id = "images"
}

resource "google_compute_address" "smtp-to-pubsub" {
  name = "smtp-to-pubsub"
  lifecycle {
    prevent_destroy = true
  }
}

resource "google_compute_network" "k8s-main-cluster-network" {
  name                    = "k8s-${var.k8s_cluster_name}-cluster-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "k8s-main-cluster-subnetwork" {
  name               = "k8s-${var.k8s_cluster_name}-cluster-subnetwork"
  network            = google_compute_network.k8s-main-cluster-network.name
  ip_cidr_range      = "10.132.0.0/20"
  secondary_ip_range = [
    {
      range_name    = "k8s-${var.k8s_cluster_name}-cluster-pod-range"
      ip_cidr_range = "172.16.0.0/16"
    },
    {
      range_name    = "k8s-${var.k8s_cluster_name}-cluster-service-range"
      ip_cidr_range = "192.168.0.0/20"
    }
  ]
}

module "kubernetes-engine_safer-cluster" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/safer-cluster"
  version = "26.1.1"

  name       = var.k8s_cluster_name
  project_id = var.google_cloud_project_id
  region     = var.google_cloud_region

  network           = google_compute_network.k8s-main-cluster-network.name
  subnetwork        = google_compute_subnetwork.k8s-main-cluster-subnetwork.name
  ip_range_pods     = "k8s-${var.k8s_cluster_name}-cluster-pod-range"
  ip_range_services = "k8s-${var.k8s_cluster_name}-cluster-service-range"

  enable_private_endpoint = false

  node_pools = [
    {
      name         = "${var.k8s_cluster_name}-node-pool"
      machine_type = "e2-medium"
      preemptible  = true
    }
  ]
}

module "kubernetes-engine_auth" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/auth"
  version = "26.1.1"

  project_id           = var.google_cloud_project_id
  cluster_name         = module.kubernetes-engine_safer-cluster.name
  location             = module.kubernetes-engine_safer-cluster.location
  use_private_endpoint = false
}

resource "google_service_account" "k8s-default-workload-account" {
  account_id = "k8s-default-workload-account"
}

resource "google_project_iam_member" "k8s-pubsub-access" {
  project = var.google_cloud_project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.k8s-default-workload-account.email}"
}

resource "google_service_account_iam_binding" "k8s-workload-account-binding" {
  service_account_id = google_service_account.k8s-default-workload-account.name
  role               = "roles/iam.workloadIdentityUser"
  members            = ["serviceAccount:${var.google_cloud_project_id}.svc.id.goog[default/default]"]
}

resource "google_cloud_run_v2_service" "email-validator" {
  name     = "email-validator"
  location = var.google_cloud_region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    containers {
      image = "europe-west1-docker.pkg.dev/${var.google_cloud_project_id}/images/email-validator:${var.github_sha}"
      env {
        name  = "GOOGLE_CLOUD_PROJECT_NAME"
        value = var.google_cloud_project_id
      }
    }
  }
}

resource "google_pubsub_subscription" "email-validator" {
  name  = "email-validator"
  topic = google_pubsub_topic.raw-emails.name
  push_config {
    push_endpoint = google_cloud_run_v2_service.email-validator.uri
    oidc_token {
      service_account_email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    }
    attributes = {
      x-goog-version = "v1"
    }
  }
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "my-page-api" {
  name  = "my-page-api"
  topic = google_pubsub_topic.validated-emails.name
  push_config {
    push_endpoint = var.api_jobposting_endpoint
    oidc_token {
      service_account_email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    }
    attributes = {
      x-goog-version = "v1"
    }
  }
  retry_policy {
    minimum_backoff = "60s"
    maximum_backoff = "600s"
  }
}
