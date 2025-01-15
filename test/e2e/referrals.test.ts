import "dotenv/config";
import axios from "axios";
import { z } from "zod";

const API_URL = z.string().parse(process.env.API_URL);

describe("e2e/referrals", () => {
  it("happy path", async () => {
    const randomName =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const newReferralResponse = await axios.post(
      `${API_URL}/v1/referral/request`,
      {
        name: randomName,
      }
    );

    expect(newReferralResponse.status).toBe(201);
    expect(newReferralResponse.data).toEqual(
      expect.objectContaining({
        referralRequest: {
          name: randomName,
          code: expect.any(String),
          parentReferralCode: expect.any(String),
          expiresAt: expect.any(String),
          createdAt: expect.any(String),
          status: "PENDING",
        },
      })
    );

    const referralRequest = newReferralResponse.data.referralRequest;

    console.log(JSON.stringify(referralRequest, null, 2));

    const referralLink = `${API_URL}/v1/link?parentReferralCode=${referralRequest.parentReferralCode}&code=${referralRequest.code}`;

    const androidReferralLinkResponse = await axios.get(referralLink, {
      headers: {
        "User-Agent": "android",
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    expect(androidReferralLinkResponse.status).toBe(302);
    expect(androidReferralLinkResponse.headers.location).toContain(
      "play.google.com"
    );

    const iosReferralLinkResponse = await axios.get(referralLink, {
      headers: {
        "User-Agent": "iphone",
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    expect(iosReferralLinkResponse.status).toBe(302);
    expect(iosReferralLinkResponse.headers.location).toContain(
      "apps.apple.com"
    );

    const verifyReferralResponse = await axios.post(
      `${API_URL}/v1/referral/verify`,
      null,
      {
        params: {
          code: referralRequest.code,
        },
      }
    );

    expect(verifyReferralResponse.status).toBe(200);

    const completeReferralResponse = await axios.post(
      `${API_URL}/v1/referral/complete`,
      null,
      {
        params: {
          code: referralRequest.code,
        },
      }
    );

    expect(completeReferralResponse.status).toBe(200);
  });
});
