/** 기본값: 같은 출처의 /api 로 요청 → next.config.js rewrites 로 백엔드(8000) 프록시 → CORS 없음 */
const DEFAULT_API_BASE = "/api";

const getBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  const base = (typeof raw === "string" ? raw.trim() : "") || DEFAULT_API_BASE;
  return base.replace(/\/$/, "");
};

function buildUrl(path: string): string {
  const base = getBaseUrl();
  const absolutePath = path.startsWith("/") ? path : `/${path}`;
  const url = base ? `${base}${absolutePath}` : `${DEFAULT_API_BASE}${absolutePath}`;
  return url;
}

const endpoints = {
  engagement: {
    visit: "/engagement/visit",
  },
  quiz: {
    start: "/quiz/start",
    complete: "/quiz/complete",
    abandon: "/quiz/abandon",
    history: "/quiz/history",
  },
  analytics: {
    participation: "/analytics/participation",
    retention4w: "/analytics/retention/4w",
    snapshots: "/analytics/snapshots",
  },
} as const;

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const url = buildUrl(path);
  console.log("[api] request URL:", url);
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const contentType = res.headers.get("Content-Type") || "";
    const text = await res.text();

    if (!res.ok) {
      const snippet = text.length > 150 ? text.slice(0, 150).trim() + "…" : text.trim();
      return { error: `HTTP ${res.status}: ${snippet || res.statusText}` };
    }

    if (!contentType.includes("application/json")) {
      return {
        error:
          "Expected JSON but received HTML/text. Check NEXT_PUBLIC_API_BASE_URL and endpoint path.",
      };
    }

    const data = text ? (JSON.parse(text) as T) : (undefined as T);
    return { data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

// --- Engagement ---
export async function recordVisit(userId: string) {
  return api<{ ok?: boolean; recorded?: boolean }>(endpoints.engagement.visit, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// --- Quiz ---
export type DifficultyLevel = "LOW" | "MID" | "HIGH";

export async function startQuiz(userId: string, quizId: string, difficultyLevel: DifficultyLevel) {
  return api<{ attemptId: string; startedAt: string }>(endpoints.quiz.start, {
    method: "POST",
    body: JSON.stringify({ userId, quizId, difficultyLevel }),
  });
}

export async function completeQuiz(userId: string, attemptId: string, score: number) {
  return api<{ completed?: boolean; attemptId?: string }>(endpoints.quiz.complete, {
    method: "POST",
    body: JSON.stringify({ userId, attemptId, score }),
  });
}

export async function abandonQuiz(userId: string, attemptId: string) {
  return api<{ ok?: boolean }>(endpoints.quiz.abandon, {
    method: "POST",
    body: JSON.stringify({ userId, attemptId }),
  });
}

export type QuizHistoryItem = {
  startedAt: string;
  quizId: string;
  difficultyLevel: string;
  score?: number;
  finishedAt?: string;
};

export async function getQuizHistory(userId: string) {
  const path = `${endpoints.quiz.history}?userId=${encodeURIComponent(userId)}`;
  const res = await api<{ attempts: QuizHistoryItem[] }>(path);
  if (res.error) return res;
  return { data: res.data?.attempts ?? [] };
}

// --- Analytics ---
export async function getParticipation(from: string, to: string) {
  const path = `${endpoints.analytics.participation}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  return api<{
    finishedUsers: number;
    targetUsers: number;
    participationRate: number;
  }>(path);
}

export async function getRetention4w(anchorDate: string) {
  const path = `${endpoints.analytics.retention4w}?anchorDate=${encodeURIComponent(anchorDate)}`;
  return api<{
    retainedUsers: number;
    totalUsers: number;
    retentionRate: number;
  }>(path);
}

export type SnapshotMetricType = "PARTICIPATION" | "RETENTION_4W" | "ALL";

export type SnapshotItem = {
  createdAt: string;
  metricType: string;
  numerator: number;
  denominator: number;
  rate: number;
  period?: string;
  anchor?: string;
  id?: string;
  metric_type?: string;
  period_from?: string;
  period_to?: string;
  anchor_date?: string;
  created_at?: string;
};

export async function getSnapshots(metricType: SnapshotMetricType) {
  const path =
    metricType === "ALL"
      ? endpoints.analytics.snapshots
      : `${endpoints.analytics.snapshots}?metricType=${encodeURIComponent(metricType)}`;
  const res = await api<{ snapshots: SnapshotItem[] }>(path);
  if (res.error) return res;
  const raw = res.data?.snapshots ?? [];
  const data: SnapshotItem[] = raw.map((s) => ({
    ...s,
    createdAt: s.created_at ?? s.createdAt ?? "",
    metricType: s.metric_type ?? s.metricType ?? "",
    period: s.period ?? s.period_from,
    anchor: s.anchor ?? (s.anchor_date != null ? String(s.anchor_date) : undefined),
  }));
  return { data };
}
