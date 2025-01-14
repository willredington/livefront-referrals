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
      `${API_URL}/referral/request`,
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

    const verifyReferralResponse = await axios.post(
      `${API_URL}/referral/verify`,
      null,
      {
        params: {
          code: referralRequest.code,
        },
      }
    );

    expect(verifyReferralResponse.status).toBe(200);

    const completeReferralResponse = await axios.post(
      `${API_URL}/referral/complete`,
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
