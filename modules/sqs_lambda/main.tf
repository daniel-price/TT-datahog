resource "aws_sqs_queue" "queue" {
  name          = "${var.source_dir}_queue"
  delay_seconds = 0
  visibility_timeout_seconds = 600
}

data "archive_file" "archive" {
  type        = "zip"
  source_dir  = "./src/${var.source_dir}"
  output_path = "./zips/${var.source_dir}.zip"
}

resource "aws_iam_role" "role" {
  name               = "${var.source_dir}_role"
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

resource "aws_lambda_function" "function" {
  filename         = data.archive_file.archive.output_path
  function_name    = var.source_dir
  role             = aws_iam_role.role.arn
  handler          = "${var.source_dir}.handler"
  runtime          = "nodejs14.x"
  source_code_hash = data.archive_file.archive.output_base64sha256
  publish          = true
}

resource "aws_iam_role_policy_attachment" "role_policy" {
  role       = aws_iam_role.role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_logs_pa" {
  role       = aws_iam_role.role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.queue.arn
  function_name                      = aws_lambda_function.function.arn
}

output "queue_url" {
  value = aws_sqs_queue.queue.id
}
