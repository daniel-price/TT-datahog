const axios = require("axios");

const BASE_REQUEST_URL = `http://host.docker.internal:3000/providers/`;

exports.handler = async function (event) {
  //just to test my localstack is set up correctly. Test using:
  //awslocal lambda invoke --function-name request_handler output.txt
  //Test SQS queue using:
  //awslocal sqs send-message --queue-url http://localhost:4566/000000000000/request_handler_queue --message-body "test"
  await axios.post(
    "https://webhook.site/e9f6dbce-5b3e-468a-ba7f-de7e4a6caa68",
    { event }
  );

  const messageAttributes = event.Records[0].messageAttributes;
  const provider = messageAttributes.provider.stringValue;
  const callbackUrl = messageAttributes.callbackUrl.stringValue;

  try {
    const response = await axios.get(`${BASE_REQUEST_URL}${provider}`);
    const data = response.data;

    await axios.post(
      "https://webhook.site/e9f6dbce-5b3e-468a-ba7f-de7e4a6caa68",
      { data }
    );
  } catch (e) {
    //the server isn't available, so add it back to the queue to be tried again
    //TODO: add delivery delay, with exponential backoff
    await axios.post(
      "https://webhook.site/e9f6dbce-5b3e-468a-ba7f-de7e4a6caa68",
      { event: "got error", error: e }
    );
  }
};
