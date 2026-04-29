terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.3.0"
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  token      = var.aws_session_token
}

# ─── Récupérer le Security Group existant ─────────────────────
data "aws_security_group" "app_sg" {
  filter {
    name   = "group-name"
    values = ["tunis-buy-sell-sg"]
  }
}

# ─── EC2 Instance ─────────────────────────────────────────────
resource "aws_instance" "app_server" {
  ami                    = var.ubuntu_ami
  instance_type          = "t2.large"
  key_name               = var.key_name
  vpc_security_group_ids = [data.aws_security_group.app_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "tunis-buy-sell-buddy"
    Project = "tunis-buy-sell-buddy"
    Env     = "production"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# ─── Elastic IP ───────────────────────────────────────────────
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "tunis-buy-sell-eip"
  }
}