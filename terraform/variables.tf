variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1" # Virginia
}

variable "ubuntu_ami" {
  description = "Ubuntu 24.04 LTS AMI (us-east-1 — Canonical officiel)"
  type        = string
  # AMI Ubuntu 24.04 LTS (Noble Numbat) - us-east-1
  # Source: https://cloud-images.ubuntu.com/locator/ec2/
  default = "ami-0e86e20dae9224db8"
}

variable "key_name" {
  description = "Nom de la clé SSH AWS Academy (vockey)"
  type        = string
  default     = "vockey"
}
