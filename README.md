# Design

This solution uses AWS components (lambda and SQS) to make the retry mechanism fault-tolerant. Localstack is used to simulate AWS locally.

The solution is made up of:

- express app to handle requests - the OpenAPI schema can be found by querying `http://localhost:8000/spec`
- `request handler` SQS queue and lambda for collecting the data from the providers. Retries are handled using an exponential backoff algorithm.
- `response dispatcher` SQS queue and lambda for sending the data back to the provided callbackUrl. Retries are handled in the same way as above.

## Prerequisites

Requires

1. docker

2. localstack (installed by docker-compose)

3. terraform

4. awscli

`choco install terraform awscli`

Ensure docker is running

## Install

`npm run installAll`

## Test

`npm run testAll`

## Run

`docker-compose up` to start localstack

`npm run deployTf` to deploy SQS and Lambda terraform to localstack

`npm run startMockApi` to start the mock providers endpoint app

`npm run startApp` to start the app endpoint

## Example queries

NB: I made use of `webhook.site` for testing the callback

healthcheck: GET `http://localhost:8000`

request data: POST `http://localhost:8000/?provider=gas&callbackUrl=https://webhook.site/e9f6dbce-5b3e-468a-ba7f-de7e4a6caa68`

## Potential improvements

- Extract code for sending messages to queues, and any other shared code, into a shared library.
- Allow multiple providers to be requested, and aggregate the data. This can be done by having the request handler lambda retrieve data from each provider and aggregate them to pass to the response dispatcher. If any providers are unavailable, the whole message is added back to the retry queue to try again later.
- Replace the app endpoint with API Gateway
