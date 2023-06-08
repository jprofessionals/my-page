provider "kubernetes" {
  cluster_ca_certificate = module.gke_auth.cluster_ca_certificate
  host                   = module.gke_auth.host
  token                  = module.gke_auth.token
}

resource "kubernetes_default_service_account_v1" "default" {
  metadata {
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.k8s-default-workload-account.email
    }
  }
}

resource "kubernetes_deployment_v1" "smtp-to-pubsub" {
  metadata {
    name   = "smtp-to-pubsub"
    labels = {
      app = "smtp-to-pubsub"
    }
  }

  spec {
    replicas = "2"
    selector {
      match_labels = {
        app = "smtp-to-pubsub"
      }
    }

    template {
      metadata {
        labels = {
          app = "smtp-to-pubsub"
        }
      }
      spec {
        service_account_name = kubernetes_default_service_account_v1.default.metadata[0].name
        container {
          name  = "smtp-to-pubsub"
          image = "europe-west1-docker.pkg.dev/my-page-jpro-test/images/smtp-to-pubsub:${var.github_sha}"
          resources {
            requests = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }
          port {
            name           = "smtp"
            container_port = 25
            protocol       = "TCP"
          }
          env {
            name  = "GOOGLE_CLOUD_PROJECT_NAME"
            value = var.google_cloud_project_id
          }
        }
      }
    }
  }

  timeouts {
    create = "3m"
    update = "3m"
  }
}

resource "kubernetes_service_v1" "smtp-to-pubsub" {
  metadata {
    name   = "smtp-to-pubsub"
    labels = {
      app = "smtp-to-pubsub"
    }
    annotations = {
      "cloud.google.com/l4-rbs" = "enabled"
    }
  }

  spec {
    type     = "LoadBalancer"
    selector = {
      app = "smtp-to-pubsub"
    }
    port {
      port        = 25
      target_port = "smtp"
      protocol    = "TCP"
    }
    external_traffic_policy     = "Local"
    load_balancer_source_ranges = [
      "0.0.0.0/0"
    ]
    load_balancer_ip = google_compute_address.smtp-to-pubsub.address
  }
}

resource "kubernetes_network_policy_v1" "smtp-to-pubsub" {
  metadata {
    name   = "smtp-to-pubsub"
    labels = {
      "app" = "smtp-to-pubsub"
    }
    annotations = {
      "policy.network.gke.io/enable-logging" = "true"
    }
  }

  spec {
    pod_selector {
      match_labels = {
        app = "smtp-to-pubsub"
      }
    }
    policy_types = ["Ingress", "Egress"]
    ingress {}
    egress {}
  }
}
