import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../../../lib/stack/referral/lambda/handle-referral-link";

import {
  getReferralRequest,
  ReferralRequestStatus,
} from "../../../../../lib/domain/referral";
import { getUserProfile } from "../../../../../lib/domain/user-profile";

jest.mock("../../../../../lib/domain/auth");
jest.mock("../../../../../lib/domain/referral");
jest.mock("../../../../../lib/domain/user-profile");

const mockGetReferralRequest = jest.mocked(getReferralRequest);

const mockGetUserProfile = jest.mocked(getUserProfile);

describe("stack/referral/lambda/handle-referral-link", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 404 if the referral request is not found", async () => {
    const event = {
      queryStringParameters: {
        parentReferralCode: "123",
        code: "abc",
      },
      headers: {
        "User-Agent": "windows",
      },
    } as unknown as APIGatewayProxyEvent;

    mockGetUserProfile.mockResolvedValue({
      name: "john",
      userId: "user1",
      referralCode: "123",
    });

    mockGetReferralRequest.mockResolvedValue(null);

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
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

    mockGetUserProfile.mockResolvedValue({
      name: "john",
      userId: "user1",
      referralCode: "123",
    });

    mockGetReferralRequest.mockResolvedValue({
      name: "item1",
      code: "abc",
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() - 1000),
      parentReferralCode: "parentReferralCode",
      status: ReferralRequestStatus.PENDING,
    });

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

    mockGetUserProfile.mockResolvedValue({
      name: "john",
      userId: "user1",
      referralCode: "123",
    });

    mockGetReferralRequest.mockResolvedValue({
      name: "item1",
      code: "abc",
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() - 1000),
      parentReferralCode: "parentReferralCode",
      status: ReferralRequestStatus.PENDING,
    });

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

    mockGetUserProfile.mockResolvedValue({
      name: "john",
      userId: "user1",
      referralCode: "123",
    });

    mockGetReferralRequest.mockResolvedValue({
      name: "item1",
      code: "abc",
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() - 1000),
      parentReferralCode: "parentReferralCode",
      status: ReferralRequestStatus.PENDING,
    });

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
