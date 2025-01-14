import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { jsonResponse } from "../../../util/http";
import { getDeepLink, Platform } from "../../../util/link";

const ExpectedQueryParametersSchema = z.object({
  parentReferralCode: z.string(),
  code: z.string(),
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
