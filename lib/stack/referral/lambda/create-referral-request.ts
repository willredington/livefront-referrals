import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { z } from "zod";
import { getUserIdFromRequest } from "../../../domain/auth";
import { DynamoDBService } from "../../../domain/db";
import {
  createReferralRequest,
  ReferralRequestSchema,
} from "../../../domain/referral";
import { getUserProfile } from "../../../domain/user-profile";
import { jsonResponse } from "../../../util/http";

const TIME_TO_EXPIRE_IN_SECONDS = 60 * 60 * 24 * 7; // 7 days

const dbService = new DynamoDBService({
  schema: ReferralRequestSchema,
});

const ExpectedJsonBodySchema = z.object({
  name: z.string(),
});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  if (!event.body) {
    return jsonResponse({
      statusCode: 400,
      body: {
        message: "Missing request body",
      },
    });
  }

  const jsonParseResult = ExpectedJsonBodySchema.safeParse(
    JSON.parse(event.body ?? "{}")
  );

  if (!jsonParseResult.success) {
    console.error("Invalid request body", jsonParseResult.error);
    return jsonResponse({
      statusCode: 400,
      body: {
        message: "Invalid request body",
      },
    });
  }

  try {
    const userId = getUserIdFromRequest(event);

    const userProfile = await getUserProfile({
      userId,
    });

    const referralRequest = await createReferralRequest({
      timeToExpireInSeconds: TIME_TO_EXPIRE_IN_SECONDS,
      referralRequestInput: {
        name: jsonParseResult.data.name,
        parentReferralCode: userProfile.referralCode,
      },
      dbService,
    });

    return jsonResponse({
      statusCode: 201,
      body: {
        referralRequest,
      },
    });
  } catch (error) {
    console.error("Error creating referral request", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Error creating referral request",
      },
    });
  }
};
