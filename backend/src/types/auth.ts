// export type VerifyResult =
//   | {
//       ok: true;
//       reason?: undefined;
//       message?: undefined;
//       lockedUntil?: undefined;
//     }
//   | {
//       ok: false;
//       reason: "wrong_code";
//       message: string;
//       lockedUntil?: undefined;
//     }
//   | { ok: false; reason: "expired"; message: string; lockedUntil?: undefined }
//   | { ok: false; reason: "locked"; message: string; lockedUntil: Date };

// export type SendCodeResult =
//   | { status: "ok"; expiresAt: string }
//   | { status: "subscriber"; expiresAt?: undefined }
//   | { status: "error"; expiresAt?: undefined; message: string };

export type SendCodeResult =
  | { status: "ok"; expiresAt: string }
  | { status: "subscriber" } // 이미 구독 중
  | { status: "locked"; lockedUntil: string } // 5회 초과 잠금
  | { status: "error" };

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "wrong_code"; message: string }
  | { ok: false; reason: "expired"; message: string }
  | { ok: false; reason: "locked"; message: string; lockedUntil: string }
  | { ok: false; reason: "error"; message: string };
