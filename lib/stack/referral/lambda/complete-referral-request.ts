import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { z } from "zod";
import { getUserIdFromRequest } from "../../../domain/auth";
import { DynamoDBService } from "../../../domain/db";
import {
  getReferralRequest,
  ReferralRequestSchema,
  ReferralRequestStatus,
  updateReferralRequestStatus,
} from "../../../domain/referral";
import { getUserProfile } from "../../../domain/user-profile";
import { jsonResponse } from "../../../util/http";

const dbService = new DynamoDBService({
  schema: ReferralRequestSchema,
});

const ExpectedQueryParametersSchema = z.object({
  code: z.string(),
});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  const queryParametersParseResult = ExpectedQueryParametersSchema.safeParse(
    event.queryStringParameters
  );

  if (!queryParametersParseResult.success) {
    console.error("Invalid query parameters", queryParametersParseResult.error);
    return jsonResponse({
      statusCode: 400,
      body: {
        message: "Invalid query parameters",
      },
    });
  }

  const { code } = queryParametersParseResult.data;

  try {
    const userId = getUserIdFromRequest(event);

    const userProfile = await getUserProfile({
      userId,
    });

    const referralRequest = await getReferralRequest({
      parentReferralCode: userProfile.referralCode,
      code,
      dbService,
    });

    const isExpired = referralRequest.expiresAt < new Date();

    if (isExpired) {
      return jsonResponse({
        statusCode: 400,
        body: {
          message: "Referral request expired",
        },
      });
    }

    if (referralRequest.status !== ReferralRequestStatus.VERIFIED) {
      return jsonResponse({
        statusCode: 409,
        body: {
          message: "Referral is in an invalid state, cannot be completed",
        },
      });
    }

    const updatedReferralRequest = {
      ...referralRequest,
      status: ReferralRequestStatus.COMPLETED,
    };

    await updateReferralRequestStatus({
      dbService,
      referralRequest: updatedReferralRequest,
    });

    return jsonResponse({
      statusCode: 200,
      body: {
        referralRequest: updatedReferralRequest,
      },
    });
  } catch (error) {
    console.error("Error completing referral request", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Error completing referral request",
      },
    });
  }
};
