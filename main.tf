provider "aws" {
  access_key                  = "mock_access_key"
  region                      = "us-east-1"
  s3_force_path_style         = true
  secret_key                  = "mock_secret_key"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    apigateway     = "http://localhost:4566"
    cloudformation = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    es             = "http://localhost:4566"
    firehose       = "http://localhost:4566"
    iam            = "http://localhost:4566"
    kinesis        = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    route53        = "http://localhost:4566"
    redshift       = "http://localhost:4566"
    s3             = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ses            = "http://localhost:4566"
    sns            = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    stepfunctions  = "http://localhost:4566"
    sts            = "http://localhost:4566"
  }
}

resource "aws_sqs_queue" "request_handler_queue" {
  name          = "request_handler_queue"
  delay_seconds = 0
}

data "archive_file" "request_handler_archive" {
  type        = "zip"
  source_dir  = "./src/request_handler"
  output_path = "./zips/request_handler.zip"
}

resource "aws_iam_role" "request_handler_role" {
  name               = "request_handler_role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "apigateway.amazonaws.com"
        ]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_function" "request_handler_function" {
  filename         = data.archive_file.request_handler_archive.output_path
  function_name    = "request_handler"
  role             = aws_iam_role.request_handler_role.arn
  handler          = "request_handler.handler"
  runtime          = "nodejs14.x"
  source_code_hash = data.archive_file.request_handler_archive.output_base64sha256
  publish          = true
}

resource "aws_iam_role_policy_attachment" "request_handler_role_policy" {
  role       = aws_iam_role.request_handler_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_logs_pa" {
  role       = aws_iam_role.request_handler_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_event_source_mapping" "request_handler_event_source_mapping" {
  event_source_arn = aws_sqs_queue.request_handler_queue.arn
  function_name    = aws_lambda_function.request_handler_function.arn
}

output "request_handler_queue_url" {
  value = aws_sqs_queue.request_handler_queue.id
}
