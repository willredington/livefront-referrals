import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
import { AppEnvironmentVariable } from "../../util/env";
import * as dynamo from "aws-cdk-lib/aws-dynamodb";

const getLambdaRelativeDirPath = (lambdaName: string) => {
  return join(__dirname, "lambda", lambdaName);
};

type ReferralStackProps = cdk.NestedStackProps;

export class ReferralStack extends cdk.NestedStack {
  public getReferralRequestLambda: lambda.Function;
  public createReferralRequestLambda: lambda.Function;
  public verifyReferralRequestLambda: lambda.Function;
  public completeReferralRequestLambda: lambda.Function;
  public handleReferralLinkLambda: lambda.Function;
  public referralRequestTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: ReferralStackProps) {
    super(scope, id, props);

    this.referralRequestTable = new dynamo.Table(this, "ReferralRequestTable", {
      partitionKey: {
        name: "parentReferralCode",
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: "code",
        type: dynamo.AttributeType.STRING,
      },
      timeToLiveAttribute: "expiresAt",
    });

    const tableEnvs = {
      [AppEnvironmentVariable.REFERRAL_REQUEST_TABLE_NAME]:
        this.referralRequestTable.tableName,
    };

    this.getReferralRequestLambda = new nodejs.NodejsFunction(
      this,
      "GetReferralRequestLambda",
      {
        entry: getLambdaRelativeDirPath("get-referral-requests.ts"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          ...tableEnvs,
        },
      }
    );

    this.referralRequestTable.grantReadData(this.getReferralRequestLambda);

    this.createReferralRequestLambda = new nodejs.NodejsFunction(
      this,
      "CreateReferralRequestLambda",
      {
        entry: getLambdaRelativeDirPath("create-referral-request.ts"),
        environment: {
          ...tableEnvs,
        },
      }
    );

    this.referralRequestTable.grantReadWriteData(
      this.createReferralRequestLambda
    );

    this.verifyReferralRequestLambda = new nodejs.NodejsFunction(
      this,
      "VerifyReferralRequestLambda",
      {
        entry: getLambdaRelativeDirPath("verify-referral-request.ts"),
        environment: {
          ...tableEnvs,
        },
      }
    );

    this.referralRequestTable.grantReadWriteData(
      this.verifyReferralRequestLambda
    );

    this.completeReferralRequestLambda = new nodejs.NodejsFunction(
      this,
      "CompleteReferralRequestLambda",
      {
        entry: getLambdaRelativeDirPath("complete-referral-request.ts"),
        environment: {
          ...tableEnvs,
        },
      }
    );

    this.referralRequestTable.grantReadWriteData(
      this.completeReferralRequestLambda
    );

    this.handleReferralLinkLambda = new nodejs.NodejsFunction(
      this,
      "HandleReferralLinkLambda",
      {
        entry: getLambdaRelativeDirPath("handle-referral-link.ts"),
        environment: {
          ...tableEnvs,
        },
      }
    );

    this.referralRequestTable.grantReadData(this.handleReferralLinkLambda);
  }
}
