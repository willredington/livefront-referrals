import * as cdk from "aws-cdk-lib";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

type ApiStackProps = cdk.NestedStackProps & {
  getReferralRequestLambda: lambda.Function;
  createReferralRequestLambda: lambda.Function;
  verifyReferralRequestLambda: lambda.Function;
  completeReferralRequestLambda: lambda.Function;
  handleReferralLinkLambda: lambda.Function;
};

export class ApiStack extends cdk.NestedStack {
  public api: apig.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new apig.RestApi(this, "Api");

    const v1Resource = this.api.root.addResource("v1");

    const referralResource = v1Resource.addResource("referral");

    referralResource
      .addResource("request")
      .addMethod(
        "POST",
        new apig.LambdaIntegration(props.createReferralRequestLambda)
      );

    referralResource
      .addResource("verify")
      .addMethod(
        "POST",
        new apig.LambdaIntegration(props.verifyReferralRequestLambda)
      );

    referralResource
      .addResource("complete")
      .addMethod(
        "POST",
        new apig.LambdaIntegration(props.completeReferralRequestLambda)
      );

    referralResource
      .addResource("list")
      .addMethod(
        "GET",
        new apig.LambdaIntegration(props.getReferralRequestLambda)
      );

    const linkResource = v1Resource.addResource("link");

    linkResource.addMethod(
      "GET",
      new apig.LambdaIntegration(props.handleReferralLinkLambda)
    );
  }
}
