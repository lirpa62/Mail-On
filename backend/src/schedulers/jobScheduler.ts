import cron from "node-cron";
import { processJobs } from "../processors/jobProcessor";

export function startJobScheduler() {
  cron.schedule(
    "0 10,14,18 * * 1-5",
    async () => {
      console.log("🔔 월~금 10시·14시·18시에 실행됩니다");
      try {
        await processJobs();
      } catch (err) {
        console.error("❌ processJobs error:", err);
      }
    },
    {
      timezone: "Asia/Seoul",
    }
  );
}
