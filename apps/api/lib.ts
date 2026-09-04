import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  AGORA_APP_ID: z.string(),
  AGORA_APP_CERTIFICATE: z.string(),

  PORT: z.string(),
  DATABASE_URL: z.string(),
});

const validateEnv = () => {
  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.error("Invalid environment variables:", parsedEnv.error);
    process.exit(1);
  }

  return parsedEnv.data;
};

const env = validateEnv();

export { env };
