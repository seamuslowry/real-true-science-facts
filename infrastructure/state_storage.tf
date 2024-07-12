resource "azurerm_resource_group" "tfstate" {
  name     = "terraform"
  location = "East US"
}

resource "random_string" "random_number" {
  length  = 6
  special = false
  upper = false
  lower = false
}

resource "azurerm_storage_account" "tfstate" {
  name                     = "tfstateaccount${random_string.random_number.result}"
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  allow_nested_items_to_be_public = false
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstatecontainer${random_string.random_number.result}"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"
}