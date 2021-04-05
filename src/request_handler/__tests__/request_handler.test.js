const requestHandler = require("../request_handler").handler;
const axios = require("axios");
const aws = require("../aws");

jest.mock("axios");
jest.mock("../aws");

describe("requestHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("Should send message to dispatch queue if data successfully received", async () => {
    axios.get.mockResolvedValue({
      data: [
        { billedOn: "2020-04-07T15:03:14.257Z", amount: 22.27 },
        { billedOn: "2020-05-07T15:03:14.257Z", amount: 30 },
      ],
    });

    await requestHandler({
      Records: [
        {
          messageAttributes: {
            provider: { stringValue: "gas" },
            callbackUrl: { stringValue: "a" },
          },
        },
      ],
    });

    expect(aws.sendMessageToQueue).toHaveBeenCalledWith(
      "http://localhost:4566/000000000000/response_dispatcher_queue",
      {
        callbackUrl: "a",
        data: [
          { amount: 22.27, billedOn: "2020-04-07T15:03:14.257Z" },
          { amount: 30, billedOn: "2020-05-07T15:03:14.257Z" },
        ],
        provider: "gas",
      }
    );
  });

  it("Should send message to retry queue if data not successfully received", async () => {
    axios.get.mockRejectedValue("Server not available");

    await requestHandler({
      Records: [
        {
          messageAttributes: {
            provider: { stringValue: "gas" },
            callbackUrl: { stringValue: "a" },
          },
        },
      ],
    });

    expect(aws.sendMessageToQueue).toHaveBeenCalledWith(
      "http://localhost:4566/000000000000/request_handler_queue",
      {
        callbackUrl: "a",
        provider: "gas",
        nextDelaySeconds: 2,
      }
    );
  });

  it("Should send message to retry queue with double the previous delaySeconds if data not successfully received", async () => {
    axios.get.mockRejectedValue("Server not available");

    await requestHandler({
      Records: [
        {
          messageAttributes: {
            provider: { stringValue: "gas" },
            callbackUrl: { stringValue: "a" },
            delaySeconds: { stringValue: "8" },
          },
        },
      ],
    });

    expect(aws.sendMessageToQueue).toHaveBeenCalledWith(
      "http://localhost:4566/000000000000/request_handler_queue",
      {
        callbackUrl: "a",
        provider: "gas",
        nextDelaySeconds: 16,
      }
    );
  });
});
