const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

// "Remember me" checked -> localStorage (survives browser close).
// Unchecked -> sessionStorage (cleared when the tab/browser closes).
function getActiveStorage(): Storage {
  return localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
}

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  },

  getUser(): string | null {
    return localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  },

  setSession(token: string, userJson: string, rememberMe: boolean): void {
    const target = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    target.setItem(TOKEN_KEY, token);
    target.setItem(USER_KEY, userJson);
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);
  },

  updateUser(userJson: string): void {
    getActiveStorage().setItem(USER_KEY, userJson);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
