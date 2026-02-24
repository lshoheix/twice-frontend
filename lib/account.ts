const ACCOUNT_ID_KEY = "account_id";

export function getStoredAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCOUNT_ID_KEY);
}

export function setStoredAccountId(id: string): void {
  localStorage.setItem(ACCOUNT_ID_KEY, id);
}
