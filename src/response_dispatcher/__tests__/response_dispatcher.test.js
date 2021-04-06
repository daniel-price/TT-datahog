const responseDispatcher = require("../response_dispatcher").handler
const axios = require("axios")
const aws = require("../aws")

jest.mock("axios")
jest.mock("../aws")

describe("response_dispatcher", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it("Should not add message to retry queue if response sent to callbackUrl successfully", async () => {
    await responseDispatcher({
      Records: [
        {
          body: JSON.stringify({
            provider: "gas",
            callbackUrl: "a",
            data: [
              { amount: 22.27, billedOn: "2020-04-07T15:03:14.257Z" },
              { amount: 30, billedOn: "2020-05-07T15:03:14.257Z" },
            ],
          }),
        },
      ],
    })

    expect(aws.sendMessageToQueue).not.toHaveBeenCalled()
  })

  it("Should send message to retry queue if data not successfully received", async () => {
    axios.post.mockRejectedValue("Server not available")

    await responseDispatcher({
      Records: [
        {
          body: JSON.stringify({
            provider: "gas",
            callbackUrl: "a",
            data: [
              { amount: 22.27, billedOn: "2020-04-07T15:03:14.257Z" },
              { amount: 30, billedOn: "2020-05-07T15:03:14.257Z" },
            ],
          }),
        },
      ],
    })

    expect(aws.sendMessageToQueue).toHaveBeenCalledWith(
      "http://localhost:4566/000000000000/response_dispatcher_queue",
      {
        callbackUrl: "a",
        data: [
          { amount: 22.27, billedOn: "2020-04-07T15:03:14.257Z" },
          { amount: 30, billedOn: "2020-05-07T15:03:14.257Z" },
        ],
        provider: "gas",
        delaySeconds: 2,
      }
    )
  })

  it("Should send message to retry queue with double the previous delaySeconds if data not successfully received", async () => {
    axios.post.mockRejectedValue("Server not available")

    await responseDispatcher({
      Records: [
        {
          body: JSON.stringify({
            provider: "gas",
            callbackUrl: "a",
            delaySeconds: "8",
            data: [
              { amount: 22.27, billedOn: "2020-04-07T15:03:14.257Z" },
              { amount: 30, billedOn: "2020-05-07T15:03:14.257Z" },
            ],
          }),
        },
      ],
    })

    expect(aws.sendMessageToQueue).toHaveBeenCalledWith(
      "http://localhost:4566/000000000000/response_dispatcher_queue",
      {
        callbackUrl: "a",
        data: [
          { amount: 22.27, billedOn: "2020-04-07T15:03:14.257Z" },
          { amount: 30, billedOn: "2020-05-07T15:03:14.257Z" },
        ],
        provider: "gas",
        delaySeconds: 16,
      }
    )
  })
})
