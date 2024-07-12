resource "azurerm_resource_group" "site" {
  name     = "realtruesciencefacts"
  location = "eastus2"
}

resource "azurerm_static_web_app" "realtruesciencefacts" {
  name                = "realtruesciencefacts"
  resource_group_name = azurerm_resource_group.site.name
  location            = azurerm_resource_group.site.location
}