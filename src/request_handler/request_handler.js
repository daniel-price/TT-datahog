const axios = require("axios");

exports.handler = async function (event) {
  //just to test my localstack is set up correctly. Test using:
  //awslocal lambda invoke --function-name request_handler output.txt
  await axios.post(
    "https://webhook.site/e9f6dbce-5b3e-468a-ba7f-de7e4a6caa68",
    { event }
  );
};
