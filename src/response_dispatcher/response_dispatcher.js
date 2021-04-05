const axios = require("axios");
const { sendMessageToQueue } = require("./aws");

const RETRY_QUEUE =
  "http://localhost:4566/000000000000/response_dispatcher_queue";

exports.handler = async function (event) {
  const messageAttributes = event.Records[0].messageAttributes;
  const provider = messageAttributes.provider.stringValue;
  const callbackUrl = messageAttributes.callbackUrl.stringValue;
  const data = messageAttributes.data.stringValue;
  const delaySeconds = messageAttributes.delaySeconds
    ? Number(messageAttributes.delaySeconds.stringValue)
    : 1;

  try {
    await axios.post(callbackUrl, { data });
  } catch (e) {
    const nextDelaySeconds = Math.min(delaySeconds * 2, 900);
    await sendMessageToQueue(RETRY_QUEUE, {
      provider,
      callbackUrl,
      data,
      nextDelaySeconds,
    });
  }

  return true;
};
