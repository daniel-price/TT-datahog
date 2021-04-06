const axios = require("axios")
const { sendMessageToQueue } = require("./aws")

const RETRY_QUEUE =
  "http://localhost:4566/000000000000/response_dispatcher_queue"

exports.handler = async function (event) {
  const { provider, callbackUrl, data, delaySeconds = 1 } = JSON.parse(
    event.Records[0].body
  )

  try {
    await axios.post(callbackUrl, { data })
  } catch (e) {
    const nextDelaySeconds = Math.min(delaySeconds * 2, 900)
    await sendMessageToQueue(RETRY_QUEUE, {
      provider,
      callbackUrl,
      data,
      delaySeconds: nextDelaySeconds,
    })
  }

  return true
}
