// 프록시 사용 시: NEXT_PUBLIC_API_URL 비우면 /api → 백엔드(8000)로 전달됨 (CORS 없음)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(
  path: string,
  options: RequestInit & { json?: object } = {}
): Promise<T> {
  const { json, ...init } = options;
  const headers: HeadersInit = { ...(init.headers as HeadersInit) };
  if (json !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const url = BASE_URL ? `${BASE_URL}${path}` : `/api${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json() as Promise<T>;
  return undefined as T;
}

// Engagement
export async function postEngagementVisit(accountId: string): Promise<{ ok: boolean }> {
  return request("/engagement/visit", { method: "POST", json: { account_id: accountId } });
}

// Quiz
export async function postQuizStart(
  accountId: string,
  quizId: string,
  difficultyLevel: "LOW" | "MID" | "HIGH"
): Promise<{ attempt_id: string }> {
  return request("/quiz/start", {
    method: "POST",
    json: { account_id: accountId, quiz_id: quizId, difficulty_level: difficultyLevel },
  });
}

export async function postQuizProgress(
  accountId: string,
  attemptId: string
): Promise<{ ok: boolean }> {
  return request("/quiz/progress", {
    method: "POST",
    json: { account_id: accountId, attempt_id: attemptId },
  });
}

export async function postQuizComplete(
  accountId: string,
  attemptId: string,
  score: number
): Promise<{ ok: boolean }> {
  return request("/quiz/complete", {
    method: "POST",
    json: { account_id: accountId, attempt_id: attemptId, score },
  });
}

export async function postQuizAbandon(
  accountId: string,
  attemptId: string
): Promise<{ ok: boolean }> {
  return request("/quiz/abandon", {
    method: "POST",
    json: { account_id: accountId, attempt_id: attemptId },
  });
}

export type QuizAttemptItem = {
  id: string;
  quiz_id: string;
  difficulty_level: string;
  status: string;
  score: number | null;
  created_at: string;
  finished_at: string | null;
};

export async function getQuizHistory(accountId: string): Promise<QuizAttemptItem[]> {
  return request(
    `/quiz/history?account_id=${encodeURIComponent(accountId)}`
  );
}

// Analytics
export async function getParticipation(
  fromDate: string,
  toDate: string
): Promise<{ finished_users: number; target_users: number; participation_rate: number }> {
  return request(
    `/analytics/participation?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`
  );
}

export async function getRetention4w(
  anchorDate: string
): Promise<{ retained_users: number; total_users: number; retention_rate: number }> {
  return request(
    `/analytics/retention/4w?anchor_date=${encodeURIComponent(anchorDate)}`
  );
}

// Kakao OAuth
export async function getKakaoOAuthLink(): Promise<{ url: string }> {
  return request("/kakao-authentication/request-oauth-link");
}

export async function getKakaoAccessToken(code: string): Promise<{
  user_info?: { id: number };
}> {
  return request(
    `/kakao-authentication/request-access-token-after-redirection?code=${encodeURIComponent(code)}`
  );
}

// Account (Kakao sync - returns account_id for localStorage)
export async function postAccountSync(kakaoId: number): Promise<{ account_id: string }> {
  return request("/account/sync", { method: "POST", json: { kakao_id: kakaoId } });
}
