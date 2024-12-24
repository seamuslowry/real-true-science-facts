resource "github_actions_secret" "webapp_api_token" {
  repository      = "real-true-science-facts"
  secret_name     = "AZURE_STATIC_WEB_APPS_API_TOKEN"
  plaintext_value = azurerm_static_web_app.realtruesciencefacts.api_key
}

resource "github_dependabot_secret" "webapp_api_token" {
  repository      = "real-true-science-facts"
  secret_name     = "AZURE_STATIC_WEB_APPS_API_TOKEN"
  plaintext_value = azurerm_static_web_app.realtruesciencefacts.api_key
}