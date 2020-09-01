variable "name" {
  default = "screencap"
}

variable "tags" {
  type = map(string)
  default = {}
}

variable "certificate_arn" {
  default = ""
}
variable "domain_name" {
  default = ""
}

variable "keys" {
  type = set(string)
  default = ["canvas"]
}