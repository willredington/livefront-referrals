import { z } from "zod";

export const UserProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  referralCode: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
