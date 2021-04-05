const axios = require("axios");
const { sendMessageToQueue } = require("./aws");

const RETRY_QUEUE =
  "http://localhost:4566/000000000000/response_dispatcher_queue";

exports.handler = async function (event) {
  const messageAttributes = event.Records[0].messageAttributes;
  const provider = messageAttributes.provider.stringValue;
  const callbackUrl = messageAttributes.callbackUrl.stringValue;

  try {
    await axios.post(callbackUrl, { data });
  } catch (e) {
    //the server isn't available, so add it back to the queue to be tried again
    //TODO: add delivery delay, with exponential backoff
    await sendMessageToQueue(RETRY_QUEUE, { provider, callbackUrl, data });
  }

  return true;
};
