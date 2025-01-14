import { z } from "zod";

export enum AppEnvironmentVariable {
  REFERRAL_REQUEST_TABLE_NAME = "REFERRAL_REQUEST_TABLE_NAME",
}

export function getEnvironmentVariable(envVar: AppEnvironmentVariable) {
  try {
    return z.string().parse(process.env[envVar]);
  } catch {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
}
