const { exec } = require("child_process");

/**
 * Mocking the aws sdk to workaround a difficulty writing from a locally running app to SQS queues in localstack
 */
async function sendMessageToQueue(queueUrl, { provider, callbackUrl }) {
  const messageBody = `provider={DataType=String,StringValue="${provider}"},callbackUrl={DataType=String,StringValue="${callbackUrl}"}`;

  exec(
    `awslocal sqs send-message --queue-url ${queueUrl} --message-body ${messageBody} --message-attributes ${messageBody}`,
    (err, stout, sterr) => {
      if (err) console.log("err", err);
      if (stout) console.log("stout", stout);
      if (sterr) console.log("sterr", sterr);
    }
  );
}

module.exports = { sendMessageToQueue };
