// export interface VerifySuccess {
//   ok: true;
//   verified: true;
// }
// export interface VerifyFailure {
//   ok: false;
//   verified: false;
//   message: string;
//   lockedUntil?: string;
// }
// export type VerifyResult = VerifySuccess | VerifyFailure;

// export type SendCodeResult =
//   | { status: "ok"; expiresAt: string }
//   | { status: "subscriber" }
//   | { status: "error"; message: string };

export type SendCodeResult =
  | { status: "ok"; expiresAt: string }
  | { status: "subscriber" } // 이미 구독 중
  | { status: "locked"; lockedUntil: string } // 5회 초과 잠금
  | { status: "error" };

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "wrong_code"; message: string }
  | { ok: false; reason: "expired"; message: string }
  | { ok: false; reason: "locked"; message: string; lockedUntil: string };
