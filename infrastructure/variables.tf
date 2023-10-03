variable "google_cloud_project_id" {
  type        = string
  description = "The ID of the Google Cloud Platform project"
}

variable "google_cloud_region" {
  type        = string
  description = "The region to be used for resources"
}

variable "google_cloud_zone" {
  type        = string
  description = "The zone to be used for the zonal resources"
}

variable "k8s_cluster_name" {
  type        = string
  description = "The name of the Google Kubernetes Engine cluster"
}

variable "github_sha" {
  type = string
}

variable api_jobposting_endpoint {
  type = string
}

