import { z } from "zod";

export enum ReferralRequestStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  VERIFIED = "VERIFIED",
}

export const ReferralRequestSchema = z.object({
  parentReferralCode: z.string(),
  code: z.string(),
  status: z.nativeEnum(ReferralRequestStatus),
  name: z.string(),
  createdAt: z.coerce.date(), // is stored as a string in dynamo
  expiresAt: z.coerce.date(), // is stored as a string in dynamo
});

export type ReferralRequest = z.infer<typeof ReferralRequestSchema>;

// dynamo cannot process date object, so we need to convert it to string when inserting into dynamo
export type CreateReferralRequestInput = Omit<
  ReferralRequest,
  "createdAt" | "expiresAt"
> & {
  expiresAt: string;
  createdAt: string;
};
