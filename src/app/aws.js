const AWS = require("aws-sdk")

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
})

const sqs = new AWS.SQS()

async function sendMessageToQueue(queueUrl, body) {
  const delaySeconds = body.delaySeconds || 0

  try {
    await sqs
      .sendMessage({
        MessageBody: JSON.stringify(body),
        QueueUrl: queueUrl.replace("localhost", "host.docker.internal"), //another workaround for localstack
        DelaySeconds: delaySeconds,
      })
      .promise()
  } catch (e) {
    console.error(e)
  }
}

module.exports = { sendMessageToQueue }
