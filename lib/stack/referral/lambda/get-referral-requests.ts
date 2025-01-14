import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { getUserIdFromRequest } from "../../../domain/auth";
import { DynamoDBService } from "../../../domain/db";
import {
  getReferralRequests,
  ReferralRequestSchema,
} from "../../../domain/referral";
import { getUserProfile } from "../../../domain/user-profile";
import { jsonResponse } from "../../../util/http";

const dbService = new DynamoDBService({
  schema: ReferralRequestSchema,
});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  try {
    const userId = getUserIdFromRequest(event);

    const userProfile = await getUserProfile({
      userId,
    });

    const referralRequests = await getReferralRequests({
      parentReferralCode: userProfile.referralCode,
      dbService,
    });

    return jsonResponse({
      statusCode: 200,
      body: {
        referralRequests,
      },
    });
  } catch (error) {
    console.error("Error getting referral requests", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Error getting referral requests",
      },
    });
  }
};
