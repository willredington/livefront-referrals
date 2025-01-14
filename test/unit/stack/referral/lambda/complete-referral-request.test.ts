import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import {
  getReferralRequest,
  ReferralRequestStatus,
} from "../../../../../lib/domain/referral";
import { getUserProfile } from "../../../../../lib/domain/user-profile";
import { handler } from "../../../../../lib/stack/referral/lambda/complete-referral-request";

jest.mock("../../../../../lib/domain/auth");
jest.mock("../../../../../lib/domain/referral");
jest.mock("../../../../../lib/domain/user-profile");

const mockGetReferralRequest = jest.mocked(getReferralRequest);

const mockGetUserProfile = jest.mocked(getUserProfile);

describe("stack/referral/lambda/complete-referral-request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if its expired", async () => {
    const event = {
      queryStringParameters: {
        code: "abc",
      },
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

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
      status: ReferralRequestStatus.VERIFIED,
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      JSON.stringify({
        message: "Referral request expired",
      })
    );
  });

  it("should return 409 if its in a bad state", async () => {
    const event = {
      queryStringParameters: {
        code: "abc",
      },
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    mockGetUserProfile.mockResolvedValue({
      name: "john",
      userId: "user1",
      referralCode: "123",
    });

    mockGetReferralRequest.mockResolvedValue({
      name: "item1",
      code: "abc",
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 1000),
      parentReferralCode: "parentReferralCode",
      status: ReferralRequestStatus.PENDING,
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(409);
  });

  it("should return 200", async () => {
    const event = {
      queryStringParameters: {
        code: "abc",
      },
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    mockGetUserProfile.mockResolvedValue({
      name: "john",
      userId: "user1",
      referralCode: "123",
    });

    const referralRequest = {
      name: "item1",
      code: "abc",
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 1000),
      parentReferralCode: "parentReferralCode",
      status: ReferralRequestStatus.VERIFIED,
    };

    mockGetReferralRequest.mockResolvedValue(referralRequest);

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(
      JSON.stringify({
        referralRequest: {
          ...referralRequest,
          status: ReferralRequestStatus.COMPLETED,
        },
      })
    );
  });
});
