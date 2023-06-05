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

variable "google_cloud_region" {
  type = string
  description = "The region to be used for resources"
}

variable "google_cloud_zone" {
  type = string
  description = "The zone to be used for the zonal resources"
}

variable "k8s_cluster_name" {
  type = string
  description = "The name of the Google Kubernetes Engine cluster"
}

provider "google" {
  project = var.google_cloud_project_id
  region  = var.google_cloud_region
  zone    = var.google_cloud_zone
}

data "google_project" "project" {
}

resource "google_pubsub_schema" "email-message" {
  name = "email-message"
  type = "AVRO"
  definition = file("${path.module}/../schemas/src/main/resources/avro/email-message.avsc")
}

resource "google_pubsub_topic" "raw-emails" {
  name = "raw-emails"

  depends_on = [google_pubsub_schema.email-message]
  schema_settings {
    schema = "${data.google_project.project.id}/schemas/${google_pubsub_schema.email-message.name}"
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
    schema = "${data.google_project.project.id}/schemas/${google_pubsub_schema.email-message.name}"
    encoding = "BINARY"
  }
  message_retention_duration = "${31*24*60*60}s"
  message_storage_policy {
    allowed_persistence_regions = [var.google_cloud_region]
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

resource "google_bigquery_table" "raw-emails" {
  deletion_protection = false
  table_id   = "raw-emails"
  dataset_id = google_bigquery_dataset.pubsub.dataset_id

  schema = file("${path.module}/bigquery-emails-schema.json")
}

resource "google_bigquery_table" "validated-emails" {
  deletion_protection = false
  table_id   = "validated-emails"
  dataset_id = google_bigquery_dataset.pubsub.dataset_id

  schema = file("${path.module}/bigquery-emails-schema.json")
}

resource "google_artifact_registry_repository" "images" {
  format        = "docker"
  repository_id = "images"
}

resource "google_compute_address" "smtp-to-pubsub" {
  name = "smtp-to-pubsub"
}

resource "google_compute_network" "k8s-main-cluster-network" {
  name = "k8s-${var.k8s_cluster_name}-cluster-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "k8s-main-cluster-subnetwork" {
  name = "k8s-${var.k8s_cluster_name}-cluster-subnetwork"
  network = google_compute_network.k8s-main-cluster-network.name
  ip_cidr_range = "10.132.0.0/20"
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

  name = "${var.k8s_cluster_name}-cluster"
  project_id = var.google_cloud_project_id
  region = var.google_cloud_region

  network = google_compute_network.k8s-main-cluster-network.name
  subnetwork = google_compute_subnetwork.k8s-main-cluster-subnetwork.name
  ip_range_pods = "k8s-${var.k8s_cluster_name}-cluster-pod-range"
  ip_range_services = "k8s-${var.k8s_cluster_name}-cluster-service-range"

  enable_private_endpoint = false

  node_pools = [
    {
      name = "${var.k8s_cluster_name}-node-pool"
      machine_type = "e2-medium"
      preemptible = true
    }
  ]
}
