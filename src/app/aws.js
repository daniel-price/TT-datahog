const AWS = require("aws-sdk")

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
})

const sqs = new AWS.SQS()

async function sendMessageToQueue(queueUrl, body) {
  const delaySeconds = body.nextDelaySeconds || 0
  try {
    await sqs
      .sendMessage({
        MessageAttributes: {
          provider: {
            DataType: "String",
            StringValue: body.provider,
          },
          callbackUrl: {
            DataType: "String",
            StringValue: body.callbackUrl,
          },
          data: {
            DataType: "String",
            StringValue: JSON.stringify(body.data || ""),
          },
          delaySeconds: {
            DataType: "String",
            StringValue: delaySeconds.toString(),
          },
        },
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
