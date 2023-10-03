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