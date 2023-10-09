data "aws_region" "current" {}

data "aws_iam_role" "screencap_role" {
  count = var.lambda_role == "" ? 0 : 1
  name = var.lambda_role
}

resource "aws_iam_role" "screencap_role" {
  count = var.lambda_role == "" ? 1 : 0

  name = var.name

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "log_perms" {
  count = var.lambda_role == "" ? 1 : 0

  name = "log_perms"
  role = aws_iam_role.screencap_role[0].id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

locals {
  source_path = "${path.module}/lambda-code"
}

resource "null_resource" "zip" {
  triggers = {
    index_js     = filebase64sha256("${local.source_path}/src/index.js")
    package_json = filebase64sha256("${local.source_path}/package.json")
    package_lock = filebase64sha256("${local.source_path}/package-lock.json")
  }

  provisioner "local-exec" {
    command = "cd ${local.source_path} && npm install --production"
  }
}

# The native archive module can't handle directory symlinks
data "external" "package_zip" {
  program = ["${path.module}/zip.sh", "${path.module}/${var.name}-${null_resource.zip.id}.zip", local.source_path]
}

resource "aws_lambda_function" "lambda" {
  filename      = "${path.module}/${var.name}-${null_resource.zip.id}.zip"
  function_name = var.name
  handler       = "src/index.handler"
  role          = var.lambda_role == "" ? aws_iam_role.screencap_role[0].arn : data.aws_iam_role.screencap_role[0].arn
  runtime       = "nodejs18.x"
  timeout       = 60
  memory_size   = 3008

  source_code_hash = data.external.package_zip.result.hash

  # This has sparticuz/chromium 117; bump to appropriate latest version when upgrading
  layers = ["arn:aws:lambda:${data.aws_region.current.name}:764866452798:layer:chrome-aws-lambda:38"]

  environment {
    variables = var.env
  }

  tags = var.tags
}

resource "aws_lambda_permission" "gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.arn
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
