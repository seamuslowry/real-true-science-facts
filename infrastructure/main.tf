terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }

  # the storage container for this backend is managed by this state
  backend "azurerm" {
      resource_group_name  = "terraform"
      storage_account_name = "tfstateaccount612179"
      container_name       = "tfstatecontainer612179"
      key                  = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}