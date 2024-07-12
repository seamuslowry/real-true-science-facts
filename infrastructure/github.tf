resource "github_actions_secret" "webapp_api_token" {
  repository      = "real-true-science-facts"
  secret_name     = "AZURE_STATIC_WEB_APPS_API_TOKEN"
  plaintext_value = local.static_webapp_api_key
}
