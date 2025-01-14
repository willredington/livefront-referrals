import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ReferralStack } from "./stack/referral";
import { ApiStack } from "./stack/api";

export class ReferralsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const referralStack = new ReferralStack(this, "ReferralStack");

    new ApiStack(this, "ApiStack", {
      getReferralRequestLambda: referralStack.getReferralRequestLambda,
      createReferralRequestLambda: referralStack.createReferralRequestLambda,
      verifyReferralRequestLambda: referralStack.verifyReferralRequestLambda,
      completeReferralRequestLambda:
        referralStack.completeReferralRequestLambda,
      handleReferralLinkLambda: referralStack.handleReferralLinkLambda,
    });
  }
}
