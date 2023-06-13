variable "slack_notification_channel_name" {
  type = string
}

variable "alert_policy_prefix" {
  type = string
}

data "google_monitoring_notification_channel" "slack" {
  display_name = var.slack_notification_channel_name
}

resource "google_monitoring_service" "smtp-to-pubsub" {
  service_id = "smtp-to-pubsub"
  display_name = "SMTP to PubSub"

  basic_service {
    service_type  = "GKE_SERVICE"
    service_labels = {
      "project_id": var.google_cloud_project_id
      "location": module.kubernetes-engine_safer-cluster.location
      "cluster_name": module.kubernetes-engine_safer-cluster.name
      "namespace_name": kubernetes_service_v1.smtp-to-pubsub.metadata[0].namespace
      "service_name": kubernetes_service_v1.smtp-to-pubsub.metadata[0].name
    }
  }
}

resource "google_monitoring_service" "email-validator" {
  service_id = "email-validator"
  display_name = "Email validator"

  basic_service {
    service_type  = "CLOUD_RUN"
    service_labels = {
      "service_name": google_cloud_run_v2_service.email-validator.name
      "location": google_cloud_run_v2_service.email-validator.location
    }
  }
}

resource "google_monitoring_alert_policy" "smtp-to-pubsub-logs" {
  for_each = {
    "WARN" = 0
    "ERROR" = 0
  }
  display_name = "${var.alert_policy_prefix} smtp-to-pubsub-${each.key}-logs"
  notification_channels = [data.google_monitoring_notification_channel.slack.name]
  combiner     = "AND"
  conditions {
    display_name = "${each.key} log_entry_count"
    condition_threshold {
      filter     = "resource.type = \"k8s_container\" AND resource.labels.container_name = \"smtp-to-pubsub\" AND metric.type = \"logging.googleapis.com/log_entry_count\" AND metric.labels.severity = \"${each.key}\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = each.value
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "300s"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields = ["resource.label.container_name"]
        per_series_aligner = "ALIGN_COUNT"
      }
    }
  }
  alert_strategy {
    auto_close = "604800s"
  }
}

resource "google_monitoring_alert_policy" "oldest-unacked-message-age" {
  for_each = toset([
    google_pubsub_subscription.email-validator.name,
    google_pubsub_subscription.raw-emails-to-bigquery.name,
    google_pubsub_subscription.validated-emails-to-bigquery.name,
  ])
  display_name = "${var.alert_policy_prefix} ${each.key}-oldest-unacked-message-age"
  notification_channels = [data.google_monitoring_notification_channel.slack.name]
  combiner     = "AND"
  conditions {
    display_name = "${each.key}-oldest-unacked-message-age"
    condition_threshold {
      filter     = "resource.type = \"pubsub_subscription\" AND resource.labels.subscription_id = \"${each.key}\" AND metric.type = \"pubsub.googleapis.com/subscription/oldest_unacked_message_age\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 5
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "300s"
        cross_series_reducer = "REDUCE_NONE"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }
  alert_strategy {
    auto_close = "604800s"
  }
}

resource "google_monitoring_alert_policy" "cloud-run-5xx-responses" {
  for_each = toset([
    google_cloud_run_v2_service.email-validator.name,
  ])
  display_name = "${var.alert_policy_prefix} ${each.key}-5xx-responses"
  notification_channels = [data.google_monitoring_notification_channel.slack.name]
  combiner     = "AND"
  conditions {
    display_name = "${each.key}-5xx-responses"
    condition_threshold {
      filter     = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${each.key}\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code = starts_with(\"5\")"
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 0
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "300s"
        cross_series_reducer = "REDUCE_SUM"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }
  alert_strategy {
    auto_close = "604800s"
  }
}
