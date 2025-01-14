import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../../../lib/stack/referral/lambda/handle-referral-link";

describe("stack/referral/lambda/handle-referral-link", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if its an unsupported platform", async () => {
    const event = {
      queryStringParameters: {
        parentReferralCode: "123",
        code: "abc",
      },
      headers: {
        "User-Agent": "windows",
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      JSON.stringify({
        message: "Invalid platform",
      })
    );
  });

  it("should return a redirect for android", async () => {
    const event = {
      queryStringParameters: {
        parentReferralCode: "123",
        code: "abc",
      },
      headers: {
        "User-Agent": "android",
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(302);
    expect(response.headers).toEqual(
      expect.objectContaining({
        Location:
          "https://play.google.com/store/apps/details?id=com.referral.app&referrer=parentReferralCode=123&code=abc",
      })
    );
  });

  it("should return a redirect for ios", async () => {
    const event = {
      queryStringParameters: {
        parentReferralCode: "123",
        code: "abc",
      },
      headers: {
        "User-Agent": "ipad",
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(302);
    expect(response.headers).toEqual(
      expect.objectContaining({
        Location:
          "https://apps.apple.com/us/app/id1234567890?app-argument=https://referral.com?parentReferralCode=123&code=abc",
      })
    );
  });
});
