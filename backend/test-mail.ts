import * as dotenv from "dotenv";
dotenv.config();

import { sendOtpEmail } from "./src/lib/mailer";

const TEST_TO = process.argv[2];

if (!TEST_TO) {
  console.error("Usage: npx ts-node test-mail.ts your@email.com");
  process.exit(1);
}

console.log(`Sending test OTP email to: ${TEST_TO}`);

sendOtpEmail(TEST_TO, "Test User", "123456")
  .then(() => console.log("✅ Email sent successfully!"))
  .catch((err) => console.error("❌ Failed:", err.message));
