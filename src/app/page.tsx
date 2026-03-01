"use client";

import { useState, useEffect, useRef } from "react";
import {
  recordVisit,
  startQuiz,
  completeQuiz,
  abandonQuiz,
  getQuizHistory,
  getParticipation,
  getRetention4w,
  getSnapshots,
  type DifficultyLevel,
  type QuizHistoryItem,
  type SnapshotItem,
  type SnapshotMetricType,
} from "@/lib/api";

function Logo() {
  return (
    <div className="logo">
      <svg className="logo__symbol" viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path fill="var(--color-olive)" d="M8 8v32h12c11 0 20-9 20-16s-9-16-20-16H8z" />
        <ellipse cx="46" cy="24" rx="14" ry="15" fill="var(--color-olive)" />
        <circle cx="54" cy="36" r="5" fill="var(--color-brown)" />
      </svg>
      <span className="logo__text">DOOZZON Q</span>
    </div>
  );
}

const USER_ID_KEY = "oh_userId";
const QUIZ_COMPLETED_KEY = "oh_quiz_completed";

type Phase = "LOGIN" | "QUIZ" | "HOME";

export default function DashboardPage() {
  const [phase, setPhase] = useState<Phase>("LOGIN");
  const [userId, setUserIdState] = useState("");
  const [visitStatus, setVisitStatus] = useState<"idle" | "loading" | "recorded" | "error">("idle");
  const [visitError, setVisitError] = useState("");
  const visitRecordedThisLoad = useRef(false);

  const [quizId, setQuizId] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("LOW");
  const [startLoading, setStartLoading] = useState(false);
  const [startResult, setStartResult] = useState<{ attemptId: string; startedAt: string } | null>(null);
  const [startError, setStartError] = useState("");

  const [completeScore, setCompleteScore] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<QuizHistoryItem[] | null>(null);
  const [historyError, setHistoryError] = useState("");

  const [partFrom, setPartFrom] = useState("");
  const [partTo, setPartTo] = useState("");
  const [partLoading, setPartLoading] = useState(false);
  const [partData, setPartData] = useState<{
    finishedUsers: number;
    targetUsers: number;
    participationRate: number;
  } | null>(null);
  const [partError, setPartError] = useState("");

  const [anchorDate, setAnchorDate] = useState("");
  const [retLoading, setRetLoading] = useState(false);
  const [retData, setRetData] = useState<{
    retainedUsers: number;
    totalUsers: number;
    retentionRate: number;
  } | null>(null);
  const [retError, setRetError] = useState("");

  const [snapshotMetricType, setSnapshotMetricType] = useState<SnapshotMetricType>("ALL");
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotItem[] | null>(null);
  const [snapError, setSnapError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  type HomeNav = "quiz" | "history" | "analytics";
  const [homeNav, setHomeNav] = useState<HomeNav>("quiz");
  const HISTORY_PAGE_SIZE = 10;
  const [historyPage, setHistoryPage] = useState(0);

  const setUserId = (value: string) => {
    setUserIdState(value);
    if (value) localStorage.setItem(USER_ID_KEY, value);
    else localStorage.removeItem(USER_ID_KEY);
  };

  useEffect(() => {
    const stored = localStorage.getItem(USER_ID_KEY);
    const quizDone = localStorage.getItem(QUIZ_COMPLETED_KEY) === "true";
    if (stored) setUserIdState(stored);
    if (stored && quizDone) setPhase("HOME");
    else if (stored) setPhase("QUIZ");
    else setPhase("LOGIN");
  }, []);

  useEffect(() => {
    if (!userId || visitRecordedThisLoad.current) return;
    visitRecordedThisLoad.current = true;
    setVisitStatus("loading");
    setVisitError("");
    recordVisit(userId).then((res) => {
      if (res.error) {
        setVisitStatus("error");
        setVisitError(res.error);
      } else {
        setVisitStatus("recorded");
      }
    });
  }, [userId]);

  const handleStartQuiz = async () => {
    if (!userId.trim()) {
      setStartError("Set userId first.");
      return;
    }
    if (!quizId.trim()) {
      setStartError("Enter quizId.");
      return;
    }
    setStartLoading(true);
    setStartError("");
    setStartResult(null);
    const res = await startQuiz(userId.trim(), quizId.trim(), difficultyLevel);
    setStartLoading(false);
    if (res.error) setStartError(res.error);
    else if (res.data) setStartResult(res.data);
  };

  const handleCompleteQuiz = async () => {
    const attemptId = startResult?.attemptId;
    if (!attemptId) {
      setCompleteError("Start a quiz first to get attemptId.");
      return;
    }
    const scoreNum = Number(completeScore);
    if (Number.isNaN(scoreNum) || scoreNum < 0) {
      setCompleteError("Enter a valid score (number >= 0).");
      return;
    }
    setCompleteLoading(true);
    setCompleteError("");
    const res = await completeQuiz(userId.trim(), attemptId, scoreNum);
    setCompleteLoading(false);
    if (res.error) setCompleteError(res.error);
    else {
      setCompleteScore("");
      localStorage.setItem(QUIZ_COMPLETED_KEY, "true");
      setPhase("HOME");
    }
  };

  const handleLogin = async () => {
    if (!userId.trim()) return;
    setLoginLoading(true);
    const res = await getQuizHistory(userId.trim());
    setLoginLoading(false);
    if (res.error) setPhase("QUIZ");
    else if (res.data && res.data.length > 0) setPhase("HOME");
    else setPhase("QUIZ");
  };

  const handleLoadHistory = async () => {
    if (!userId.trim()) {
      setHistoryError("Set userId first.");
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    setHistory(null);
    const res = await getQuizHistory(userId.trim());
    setHistoryLoading(false);
    if (res.error) setHistoryError(res.error);
    else if (res.data) {
      setHistory(res.data);
      setHistoryPage(0);
    }
  };

  const handleFetchParticipation = async () => {
    if (!partFrom || !partTo) {
      setPartError("Set both from and to dates.");
      return;
    }
    setPartLoading(true);
    setPartError("");
    setPartData(null);
    const res = await getParticipation(partFrom, partTo);
    setPartLoading(false);
    if (res.error) setPartError(res.error);
    else if (res.data) setPartData(res.data);
  };

  const handleFetchRetention = async () => {
    if (!anchorDate) {
      setRetError("Set anchor date.");
      return;
    }
    setRetLoading(true);
    setRetError("");
    setRetData(null);
    const res = await getRetention4w(anchorDate);
    setRetLoading(false);
    if (res.error) setRetError(res.error);
    else if (res.data) setRetData(res.data);
  };

  const handleFetchSnapshots = async () => {
    setSnapLoading(true);
    setSnapError("");
    setSnapshots(null);
    const res = await getSnapshots(snapshotMetricType);
    setSnapLoading(false);
    if (res.error) setSnapError(res.error);
    else if (res.data) setSnapshots(res.data);
  };

  const handleLeave = async () => {
    const attemptId = startResult?.attemptId;
    if (attemptId && userId.trim()) {
      setLeaveLoading(true);
      const res = await abandonQuiz(userId.trim(), attemptId);
      setLeaveLoading(false);
      if (!res.error) {
        localStorage.setItem(QUIZ_COMPLETED_KEY, "true");
        setPhase("HOME");
      }
    } else {
      localStorage.setItem(QUIZ_COMPLETED_KEY, "true");
      setPhase("HOME");
    }
  };

  const handleRetryQuiz = () => {
    setStartResult(null);
    setStartError("");
    setCompleteError("");
    setCompleteScore("");
    setPhase("QUIZ");
  };

  if (phase === "LOGIN") {
    return (
      <div className="login-page">
        <header className="login-header">
          <div className="logo" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="" className="login-logo-icon" />
            <span className="logo__text">DOOZZON Q</span>
          </div>
          <button type="button" className="login-moon" aria-label="다크 모드" title="다크 모드">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          </button>
        </header>
        <main className="login-main">
          <div className="login-card">
            <h1 className="login-card__title">User 로그인</h1>
            <label htmlFor="login-user-id" className="login-card__label">USER ID</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </span>
              <input
                id="login-user-id"
                type="text"
                placeholder="Enter your ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-login"
              />
            </div>
            <button
              type="button"
              className="btn-continue"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? "확인 중…" : "계속하기"}
              <span aria-hidden>→</span>
            </button>
            <div className="login-dots" role="presentation">
              <span className="login-dots__active" />
              <span />
              <span />
            </div>
          </div>
        </main>
        <footer className="login-footer">
          <p className="login-footer__tagline">Refined experiences for intelligent learning</p>
          <p className="login-footer__copy">© 2026 DOOZZON Q • SEOUL</p>
        </footer>
      </div>
    );
  }

  const isQuizActive = phase === "QUIZ" || homeNav === "quiz";
  const totalHistory = history?.length ?? 0;
  const historyStart = historyPage * HISTORY_PAGE_SIZE;
  const historyEnd = Math.min(historyStart + HISTORY_PAGE_SIZE, totalHistory);
  const paginatedHistory = history?.slice(historyStart, historyEnd) ?? [];
  const totalPages = Math.max(1, Math.ceil(totalHistory / HISTORY_PAGE_SIZE));

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <img src="/logo.png" alt="" className="dashboard-header__logo-img" />
          <h1 className="dashboard-header__logo">DOOZZON Q</h1>
        </div>
        <div className="dashboard-header__icons">
          <button type="button" aria-label="설정">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button type="button" aria-label="프로필">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        </div>
      </header>
      <nav className="dashboard-nav">
        <button
          type="button"
          className={`dashboard-nav__link ${isQuizActive ? "dashboard-nav__link--active" : ""}`}
          onClick={() => phase === "HOME" && setHomeNav("quiz")}
        >
          <span className="nav-dot" aria-hidden />
          Quiz
        </button>
        <button
          type="button"
          className={`dashboard-nav__link ${homeNav === "history" ? "dashboard-nav__link--active" : ""}`}
          onClick={() => { setPhase("HOME"); setHomeNav("history"); }}
        >
          <span className="nav-dot" aria-hidden />
          Quiz History
        </button>
        <button
          type="button"
          className={`dashboard-nav__link ${homeNav === "analytics" ? "dashboard-nav__link--active" : ""}`}
          onClick={() => { setPhase("HOME"); setHomeNav("analytics"); }}
        >
          <span className="nav-dot" aria-hidden />
          Analytics
        </button>
        <span className="dashboard-nav__version">DASHBOARD</span>
      </nav>
      <main className={`dashboard-content ${homeNav === "analytics" ? "dashboard-content--analytics" : ""}`}>
      {(phase === "QUIZ" || homeNav === "quiz") && (
      <section className="dashboard-card">
        <h2 className="dashboard-card__title">Quiz Dashboard</h2>
        <div className="quiz-section">
          <span className="quiz-section__label">Start Quiz</span>
          <div className="quiz-section__row">
            <input type="text" placeholder="Quiz Category" value={quizId} onChange={(e) => setQuizId(e.target.value)} className="input" />
            <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value as DifficultyLevel)} className="select">
              <option value="LOW">LOW</option>
              <option value="MID">MID</option>
              <option value="HIGH">HIGH</option>
            </select>
            <button type="button" className="btn-start" onClick={handleStartQuiz} disabled={startLoading}>
              {startLoading ? "Starting…" : "Start"}
            </button>
          </div>
          {startError && <p className="text-error" style={{ margin: "8px 0 0" }}>{startError}</p>}
          {startResult && (
            <p className="text-success" style={{ margin: "8px 0 0", fontSize: 13 }}>attemptId: {startResult.attemptId}, startedAt: {startResult.startedAt}</p>
          )}
        </div>
        <div className="quiz-section">
          <span className="quiz-section__label">Complete Quiz</span>
          <div className="quiz-section__row">
            <input type="number" placeholder="Score" value={completeScore} onChange={(e) => setCompleteScore(e.target.value)} min={0} className="input" style={{ width: 100 }} />
            <button type="button" className="btn-complete" onClick={handleCompleteQuiz} disabled={completeLoading}>
              {completeLoading ? "Completing…" : "Complete"}
            </button>
          </div>
          {completeError && <p className="text-error" style={{ margin: "4px 0 0" }}>{completeError}</p>}
          {phase === "HOME" && (
            <p style={{ marginTop: 8 }}>
              <button type="button" className="recent-history__refresh" onClick={handleRetryQuiz}>퀴즈 다시 도전</button>
            </p>
          )}
        </div>
      </section>
      )}

      {homeNav === "history" && (
      <section className="dashboard-card history-card">
        <div className="history-card__head">
          <div className="history-card__title-wrap">
            <h2 className="history-card__title">Quiz 이력 조회</h2>
            <p className="history-card__subtitle">최근에 진행한 퀴즈 기록을 확인할 수 있습니다.</p>
          </div>
          <button type="button" className="btn-load-history" onClick={handleLoadHistory} disabled={historyLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {historyLoading ? "Loading…" : "Load history"}
          </button>
        </div>
        {historyError && <p className="text-error" style={{ marginBottom: 12 }}>{historyError}</p>}
        {history && (
          <>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Startedat</th>
                  <th>Quizid</th>
                  <th>Difficultylevel</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 24, color: "#999", textAlign: "center" }}>No records.</td></tr>
                ) : (
                  paginatedHistory.map((row, i) => (
                    <tr key={historyStart + i}>
                      <td>{row.startedAt}</td>
                      <td>{row.quizId}</td>
                      <td>
                        <span className={`badge badge--${row.difficultyLevel === "HIGH" ? "high" : row.difficultyLevel === "MID" ? "mid" : "low"}`}>
                          {row.difficultyLevel === "MID" ? "MEDIUM" : row.difficultyLevel}
                        </span>
                      </td>
                      <td>{row.score ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalHistory > 0 && (
              <div className="history-pagination">
                <p className="history-pagination__info">
                  Showing {historyStart + 1} to {historyEnd} of {totalHistory} entries
                </p>
                <div className="history-pagination__nav">
                  <button type="button" onClick={() => setHistoryPage((p) => Math.max(0, p - 1))} disabled={historyPage === 0} aria-label="이전">&#60;</button>
                  <button type="button" onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))} disabled={historyPage >= totalPages - 1} aria-label="다음">&#62;</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      )}

      {homeNav === "analytics" && (
      <>
      <div className="analytics-grid">
        <section className="analytics-card">
          <h2 className="analytics-card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Participation
          </h2>
          <div className="analytics-field">
            <span className="analytics-field__label">Start date</span>
            <input type="date" value={partFrom} onChange={(e) => setPartFrom(e.target.value)} className="input" />
          </div>
          <div className="analytics-field">
            <span className="analytics-field__label">End date</span>
            <input type="date" value={partTo} onChange={(e) => setPartTo(e.target.value)} className="input" />
          </div>
          <button type="button" className="btn-fetch" onClick={handleFetchParticipation} disabled={partLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {partLoading ? "Fetching…" : "Fetch Participation"}
          </button>
          {partError && <p className="text-error" style={{ marginTop: 12 }}>{partError}</p>}
          {partData && (
            <div className="analytics-metrics">
              <div className="analytics-metric">
                <div className="analytics-metric__label">Finished users</div>
                <div className="analytics-metric__value">{partData.finishedUsers}</div>
              </div>
              <div className="analytics-metric">
                <div className="analytics-metric__label">Target users</div>
                <div className="analytics-metric__value">{partData.targetUsers}</div>
              </div>
              <div className="analytics-metric analytics-metric--rate-green">
                <div className="analytics-metric__label">Participation rate</div>
                <div className="analytics-metric__value">{partData.participationRate}</div>
              </div>
            </div>
          )}
        </section>
        <section className="analytics-card">
          <h2 className="analytics-card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4v4h14V4"/><path d="M5 20v-4h14v4"/><path d="M5 8h14v3l-7 5-7-5V8z"/></svg>
            Retention
          </h2>
          <div className="analytics-field">
            <span className="analytics-field__label">Anchor date</span>
            <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className="input" />
          </div>
          <button type="button" className="btn-fetch" onClick={handleFetchRetention} disabled={retLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            {retLoading ? "Fetching…" : "Fetch Retention"}
          </button>
          {retError && <p className="text-error" style={{ marginTop: 12 }}>{retError}</p>}
          {retData && (
            <div className="analytics-metrics">
              <div className="analytics-metric">
                <div className="analytics-metric__label">Retained users</div>
                <div className="analytics-metric__value">{retData.retainedUsers}</div>
              </div>
              <div className="analytics-metric">
                <div className="analytics-metric__label">Total users</div>
                <div className="analytics-metric__value">{retData.totalUsers}</div>
              </div>
              <div className="analytics-metric analytics-metric--rate-brown">
                <div className="analytics-metric__label">Retention rate</div>
                <div className="analytics-metric__value">{retData.retentionRate}</div>
              </div>
            </div>
          )}
        </section>
      </div>
      <section className="snapshots-section">
        <div className="snapshots-head">
          <h2 className="snapshots-head__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            Snapshots
          </h2>
          <div className="snapshots-head__actions">
            <select value={snapshotMetricType} onChange={(e) => setSnapshotMetricType(e.target.value as SnapshotMetricType)} className="select">
              <option value="PARTICIPATION">PARTICIPATION</option>
              <option value="RETENTION_4W">RETENTION_4W</option>
              <option value="ALL">ALL</option>
            </select>
            <button type="button" className="btn-fetch" onClick={handleFetchSnapshots} disabled={snapLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              {snapLoading ? "Fetching…" : "Fetch Snapshots"}
            </button>
          </div>
        </div>
        {snapError && <p className="text-error" style={{ marginBottom: 12 }}>{snapError}</p>}
        {snapshots && (
          <>
            <table className="snapshots-table">
              <thead>
                <tr>
                  <th>Createdat</th>
                  <th>Metrictype</th>
                  <th>Num/Den</th>
                  <th>Rate</th>
                  <th>Period</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 24, color: "#999", textAlign: "center" }}>No snapshots.</td></tr>
                ) : (
                  snapshots.map((row, i) => (
                    <tr key={i}>
                      <td>{row.createdAt}</td>
                      <td><span className="metric-type-badge">{row.metricType}</span></td>
                      <td>{row.numerator} / {row.denominator}</td>
                      <td className="rate-cell">{row.rate}</td>
                      <td>{row.period ?? row.anchor ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button type="button" className="snapshots-load-more" aria-label="Load more">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              Load more entries
            </button>
          </>
        )}
      </section>
      </>
      )}
      </main>
      <footer className="dashboard-footer">
        <div className="dashboard-footer__palette">
          <span>color palette</span>
          <div className="dashboard-footer__circle dashboard-footer__circle--green" aria-hidden />
          <span>#859853</span>
          <div className="dashboard-footer__circle dashboard-footer__circle--brown" aria-hidden />
          <span>#2F2420</span>
        </div>
        <p className="dashboard-footer__copy">© 2026 DOOZZON Q • Color Palette: <em>Fresh Cabbage</em> & <em>Hot Chocolate</em></p>
      </footer>
      <button type="button" className="dashboard-fab" aria-label="다크 모드">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  );
}
