import { AppEnvironmentVariable, getEnvironmentVariable } from "../../util/env";
import { DynamoDBService } from "../db";
import {
  CreateReferralRequestInput,
  ReferralRequest,
  ReferralRequestStatus,
} from "./type";
import { v4 } from "uuid";

export async function getReferralRequest({
  parentReferralCode,
  code,
  dbService,
}: {
  parentReferralCode: string;
  code: string;
  dbService: DynamoDBService<ReferralRequest>;
}) {
  return await dbService.queryOne({
    Key: {
      parentReferralCode,
      code,
    },
    TableName: getEnvironmentVariable(
      AppEnvironmentVariable.REFERRAL_REQUEST_TABLE_NAME
    ),
  });
}

export async function getReferralRequests({
  parentReferralCode,
  dbService,
}: {
  parentReferralCode: string;
  dbService: DynamoDBService<ReferralRequest>;
}) {
  return await dbService.exhaustiveQuery({
    queryInput: {
      TableName: getEnvironmentVariable(
        AppEnvironmentVariable.REFERRAL_REQUEST_TABLE_NAME
      ),
      KeyConditionExpression: "parentReferralCode = :parentReferralCode",
      ExpressionAttributeValues: {
        ":parentReferralCode": parentReferralCode,
      },
    },
  });
}

export async function createReferralRequest({
  timeToExpireInSeconds,
  referralRequestInput,
  dbService,
}: {
  timeToExpireInSeconds: number;
  referralRequestInput: Pick<ReferralRequest, "parentReferralCode" | "name">;
  dbService: DynamoDBService<ReferralRequest>;
}) {
  const expiresAt = new Date(Date.now() + timeToExpireInSeconds * 1000);

  const referralRequest: CreateReferralRequestInput = {
    ...referralRequestInput,
    expiresAt: expiresAt.toISOString(),
    status: ReferralRequestStatus.PENDING,
    createdAt: new Date().toISOString(),
    code: v4(),
  };

  await dbService.put({
    TableName: getEnvironmentVariable(
      AppEnvironmentVariable.REFERRAL_REQUEST_TABLE_NAME
    ),
    Item: referralRequest,
  });

  return referralRequest;
}

export async function updateReferralRequestStatus({
  referralRequest,
  dbService,
}: {
  referralRequest: ReferralRequest;
  dbService: DynamoDBService<ReferralRequest>;
}) {
  return await dbService.update({
    TableName: getEnvironmentVariable(
      AppEnvironmentVariable.REFERRAL_REQUEST_TABLE_NAME
    ),
    Key: {
      parentReferralCode: referralRequest.parentReferralCode,
      code: referralRequest.code,
    },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": referralRequest.status,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  });
}
