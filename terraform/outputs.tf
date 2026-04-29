output "instance_public_ip" {
  description = "Elastic IP de l'instance EC2"
  value       = aws_eip.app_eip.public_ip
}

output "instance_id" {
  description = "ID de l'instance EC2"
  value       = aws_instance.app_server.id
}

output "app_url" {
  description = "URL publique de l'application"
  value       = "http://${aws_eip.app_eip.public_ip}"
}

output "ssh_command" {
  description = "Commande SSH pour se connecter"
  value       = "ssh -i ~/.ssh/labsuser.pem ubuntu@${aws_eip.app_eip.public_ip}"
}
