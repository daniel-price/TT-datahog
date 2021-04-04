const app = require("../app");
const supertest = require("supertest");
const request = supertest(app);
const aws = require("../aws");

jest.mock("../aws");

describe("app", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("GET on / should respond with 'Server is running'", async () => {
    const res = await request.get("/");

    expect(res.status).toEqual(200);
    expect(res.text).toEqual("Server is running");
  });

  it("valid POST on / should respond with 'SUCCESS'", async () => {
    const res = await request
      .post("/")
      .query({ provider: "gas", callbackUrl: "http://google.com" });

    expect(res.status).toEqual(200);
    expect(res.text).toEqual("SUCCESS");
    expect(
      aws.sendMessageToQueue
    ).toHaveBeenCalledWith(
      "http://localhost:4566/000000000000/request_handler_queue",
      { callbackUrl: "http://google.com", provider: "gas" }
    );
  });

  it("POST with invalid provider on / should respond with 'SUCCESS'", async () => {
    const res = await request
      .post("/")
      .query({ provider: "elec", callbackUrl: "http://google.com" });

    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      message:
        "request.query.provider should be equal to one of the allowed values: gas, internet",
      errors: [
        {
          path: ".query.provider",
          message:
            "should be equal to one of the allowed values: gas, internet",
          errorCode: "enum.openapi.validation",
        },
      ],
    });
  });

  it("POST with invalid provider on / should respond with 'SUCCESS'", async () => {
    const res = await request
      .post("/")
      .query({ provider: "gas", callbackUrl: "internet" });

    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      message: 'request.query.callbackUrl should match format "uri"',
      errors: [
        {
          path: ".query.callbackUrl",
          message: 'should match format "uri"',
          errorCode: "format.openapi.validation",
        },
      ],
    });
  });
});
