import { UserProfile } from "./type";

const testUserProfile: UserProfile = {
  userId: "userId-1",
  name: "John Doe",
  referralCode: "123456",
};

export async function getUserProfile(props: { userId: string }) {
  return testUserProfile;
}
