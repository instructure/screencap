resource "aws_api_gateway_rest_api" "api" {
  name        = var.name
  description = "Simple Screen Capturing utility"

  binary_media_types = ["*/*"]

  tags = var.tags
}

resource "aws_api_gateway_resource" "api_proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "api_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.api_proxy.id

  http_method      = "ANY"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.api_proxy.resource_id
  http_method = aws_api_gateway_method.api_proxy.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda.invoke_arn
  content_handling        = "CONVERT_TO_BINARY"
}

resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.api_proxy.resource_id
  http_method = aws_api_gateway_method.api_proxy.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.api_proxy.resource_id
  http_method = aws_api_gateway_method.api_proxy.http_method
  status_code = aws_api_gateway_method_response.response_200.status_code

  content_handling = "CONVERT_TO_BINARY"
}

resource "aws_api_gateway_deployment" "api" {
  depends_on = [aws_api_gateway_integration.lambda]

  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_domain_name" "api" {
  count = var.domain_name == "" ? 0 : 1

  domain_name = var.domain_name

  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.tags
}

resource "aws_api_gateway_base_path_mapping" "path_mapping" {
  count = var.domain_name == "" ? 0 : 1

  api_id      = aws_api_gateway_rest_api.api.id
  stage_name  = aws_api_gateway_deployment.api.stage_name
  domain_name = aws_api_gateway_domain_name.api[0].domain_name
}

resource "aws_api_gateway_usage_plan" "usageplan" {
  name = var.name

  api_stages {
    api_id = aws_api_gateway_rest_api.api.id
    stage  = aws_api_gateway_deployment.api.stage_name
  }

  tags = var.tags
}

resource "aws_api_gateway_api_key" "key" {
  for_each = var.keys
  name     = each.key

  tags = var.tags
}

resource "aws_api_gateway_usage_plan_key" "main" {
  for_each = var.keys

  key_id        = aws_api_gateway_api_key.key[each.key].id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.usageplan.id
}

output "base_url" {
  value = aws_api_gateway_deployment.api.invoke_url
}

output "domain_cname" {
  value = aws_api_gateway_domain_name.api.*.regional_domain_name
}

output "api_keys" {
  value = {for key, val in aws_api_gateway_api_key.key : key => val.value}
}