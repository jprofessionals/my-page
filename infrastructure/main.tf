terraform {
  backend "gcs" {
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.google_cloud_project_id
}

data "google_project" "project" {
}

resource "google_service_account" "tavle-upload" {
  account_id = "tavle-upload-tf"
}

resource "google_storage_bucket" "tavle" {
  name          = "tavle-test-sa40ok8b"
  location      = "EU"
  storage_class = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  versioning {
    enabled = true
  }
  lifecycle_rule {
    condition {
      num_newer_versions = 30
      with_state = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }
  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 7
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_binding" "tavle-users" {
  bucket = google_storage_bucket.tavle.name
  role = "roles/storage.objectUser"
  members = [
    "serviceAccount:${google_service_account.tavle-upload.email}",
  ]
}

resource "google_storage_bucket_iam_binding" "tavle-viewers" {
  bucket = google_storage_bucket.tavle.name
  role = "roles/storage.objectViewer"
  members = [
    "serviceAccount:my-page-jpro@appspot.gserviceaccount.com",
  ]
}
