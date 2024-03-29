const axios = require("axios")
const { sendMessageToQueue } = require("./aws")

const RETRY_QUEUE = "http://localhost:4566/000000000000/request_handler_queue"
const RESPONSE_DISPATCHER_QUEUE =
  "http://localhost:4566/000000000000/response_dispatcher_queue"
const BASE_REQUEST_URL = `http://host.docker.internal:3000/providers/`

exports.handler = async function (event) {
  const { provider, callbackUrl, delaySeconds = 1 } = JSON.parse(
    event.Records[0].body
  )

  try {
    const response = await axios.get(`${BASE_REQUEST_URL}${provider}`)
    const data = response.data

    await sendMessageToQueue(RESPONSE_DISPATCHER_QUEUE, {
      provider,
      callbackUrl,
      data,
    })
  } catch (e) {
    //the server isn't available, so add it back to the queue (with a delay) to be tried again
    const nextDelaySeconds = Math.min(delaySeconds * 2, 900)
    await sendMessageToQueue(RETRY_QUEUE, {
      provider,
      callbackUrl,
      delaySeconds: nextDelaySeconds,
    })
  }

  return true
}
