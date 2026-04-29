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
  region = var.aws_region
}

# ─── Security Group ────────────────────────────────────────────────────────────
resource "aws_security_group" "app_sg" {
  name        = "tunis-buy-sell-sg"
  description = "Security group for tunis-buy-sell-buddy"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "tunis-buy-sell-sg"
    Project = "tunis-buy-sell-buddy"
  }
}

# ─── EC2 Instance ──────────────────────────────────────────────────────────────
resource "aws_instance" "app_server" {
  ami                    = var.ubuntu_ami   # Ubuntu 24.04 LTS - us-east-1
  instance_type          = "t2.large"
  key_name               = var.key_name    # vockey (AWS Academy)
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "tunis-buy-sell-buddy"
    Project = "tunis-buy-sell-buddy"
    Env     = "production"
  }
}

# ─── Elastic IP (IP fixe qui ne change pas au redémarrage) ────────────────────
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "tunis-buy-sell-eip"
  }
}
