import nodemailer from "nodemailer";
import pLimit from "p-limit";
import { fetchJobBoard, fetchJobDetail } from "../scrapers/jobBoardScraper";
import {
  getBoardState,
  updateBoardState,
} from "../repositories/boardStateRepo";
import {
  getSubscribers,
  updateSubscribers,
} from "../repositories/subscribersRepo";
import { sendEmail } from "./sendEmail";

const BOARD_ID = "ce/1813";
const MAX_CONCURRENCY = 5;

// Gmail SMTP 설정
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.PASSWORD,
//   },
// });

export async function processJobs(): Promise<void> {
  // 1) 이전에 처리한 게시글 번호 조회
  const { current_board_number: globalLast } = await getBoardState(BOARD_ID);
  const lastGlobalSeen = globalLast ?? 0;

  // 2) 전체 게시판 크롤링
  const jobs = await fetchJobBoard();
  const allJobs = jobs
    .filter((job) => !job.isNotice)
    .sort((a, b) => Number(a.number) - Number(b.number));

  if (allJobs.length === 0) {
    console.log("📭 No new jobs to process.");
    return;
  }

  // 3) 구독자별로 “놓친 글 + 새 글” 모두 처리
  const subscribers = await getSubscribers();
  const limit = pLimit(MAX_CONCURRENCY); // 동시에 최대 5개만 실행

  for (const subscriber of subscribers) {
    if (!subscriber.email) continue;

    const lastSent = subscriber.last_sent_board_number ?? 0;
    // 성공한 글 번호들만 담을 배열
    const successNumbers: number[] = [];
    // 해당 구독자가 놓친 글 + 새 글
    // subscriber 기준으로 > lastSent
    const pendingJobs = allJobs.filter((job) => Number(job.number) > lastSent);
    if (pendingJobs.length === 0) continue;

    console.log(
      `✉️  Sending ${pendingJobs.length} jobs to ${subscriber.email}(#${
        lastSent + 1
      }~#${pendingJobs[pendingJobs.length - 1].number})`
    );

    // 4) pendingJobs 각각 메일 발송 & per‐subscriber 상태 업데이트
    const tasks = pendingJobs.map((job) =>
      limit(async () => {
        try {
          const detail = await fetchJobDetail(job.link);
          if (!detail) throw new Error("No detail");
          sendEmail(subscriber.email!, detail.title, detail.content);
          // await transporter.sendMail({
          //   from: `"MailON" <no-reply@mail.mailon.com>`,
          //   to: subscriber.email!,
          //   subject: `[🍈MailOn] ${detail.title}`,
          //   html: detail.content,
          // });
          console.log(`✔ Sent post #${job.number} to ${subscriber.email}`);
          successNumbers.push(Number(job.number));
        } catch (err) {
          console.error(
            `❌ Failed to send post #${job.number} to ${subscriber.email}:`,
            err
          );
        }
      })
    );

    await Promise.all(tasks);
    // 성공한 게 하나도 없으면 업데이트 건너뛰기
    if (successNumbers.length === 0) continue;

    // 성공한 글 중 최대 번호로만 업데이트
    const maxSuccess = Math.max(...successNumbers);
    await updateSubscribers(subscriber.email!, maxSuccess);
  }
  // 4) 전역 상태 갱신: 전체 글 중 가장 높은 번호로
  const maxJobNumber = allJobs.length
    ? Math.max(...allJobs.map((j) => Number(j.number)))
    : lastGlobalSeen;
  const lastProcessedLink = allJobs[allJobs.length - 1].link;

  if (maxJobNumber > lastGlobalSeen) {
    await updateBoardState(BOARD_ID, maxJobNumber, lastProcessedLink);
    console.log(`🔄 Updated global state to #${maxJobNumber}`);
  } else {
    console.log("🔒 No global state changes");
  }
}
