resource "azurerm_resource_group" "site" {
  name     = "realtruesciencefacts"
  location = "eastus2"
}

resource "azurerm_static_web_app" "realtruesciencefacts" {
  name                = "realtruesciencefacts"
  resource_group_name = azurerm_resource_group.site.name
  location            = azurerm_resource_group.site.location
}

resource "azurerm_static_web_app_custom_domain" "realtruesciencefactscustomdomain" {
  domain_name           = "realtruesciencefacts.com"
  static_web_app_id     = azurerm_static_web_app.realtruesciencefacts.id
  validation_type       = "dns-txt-token"
}

resource "cloudflare_record" "txt_verification" {
  zone_id = local.cloudflare_zone_id
  name    = "_dnsauth"
  type    = "TXT"
  value   = azurerm_static_web_app_custom_domain.realtruesciencefactscustomdomain.validation_token
  ttl     = 3600
}

resource "cloudflare_record" "cname_record" {
  zone_id = local.cloudflare_zone_id
  name    = "@"
  type    = "CNAME"
  value   = azurerm_static_web_app.realtruesciencefacts.default_host_name
  ttl     = 1
  proxied = true
}

resource "cloudflare_page_rule" "bypass_cache" {
  zone_id = local.cloudflare_zone_id
  target  = "realtruesciencefacts.com/*"

  actions {
    cache_level = "bypass"
  }
}