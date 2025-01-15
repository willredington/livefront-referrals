import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { jsonResponse } from "../../../util/http";
import { getDeepLink, Platform } from "../../../util/link";
import {
  ReferralRequest,
  ReferralRequestSchema,
} from "../../../domain/referral/type";
import { DynamoDBService } from "../../../domain/db";
import { getReferralRequest } from "../../../domain/referral";

const ExpectedQueryParametersSchema = z.object({
  parentReferralCode: z.string(),
  code: z.string(),
});

const dbService = new DynamoDBService<ReferralRequest>({
  schema: ReferralRequestSchema,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

  const { parentReferralCode, code } = queryParametersParseResult.data;

  const referralRequest = await getReferralRequest({
    parentReferralCode,
    code,
    dbService,
  });

  if (!referralRequest) {
    return jsonResponse({
      statusCode: 404,
      body: {
        message: "Referral request not found",
      },
    });
  }

  const userAgent = event.headers["User-Agent"] || "";
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  try {
    if (!isAndroid && !isIOS) {
      return jsonResponse({
        statusCode: 400,
        body: {
          message: "Invalid platform",
        },
      });
    }

    const deepLink = getDeepLink({
      parentReferralCode,
      code,
      platform: isAndroid ? Platform.ANDROID : Platform.IOS,
    });

    return {
      body: "",
      statusCode: 302,
      headers: {
        Location: deepLink,
      },
    };
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
