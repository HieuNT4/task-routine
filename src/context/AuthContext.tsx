"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthValue {
  ready: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const messageFor = (code: string): string => {
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Email hoặc mật khẩu không đúng";
  }
  if (code.includes("email-already-in-use")) return "Email này đã có tài khoản";
  if (code.includes("weak-password")) return "Mật khẩu cần ít nhất 6 ký tự";
  if (code.includes("invalid-email")) return "Email không hợp lệ";
  if (code.includes("operation-not-allowed") || code.includes("configuration-not-found")) {
    return "Đăng nhập email chưa được bật trên Firebase";
  }
  return "Không đăng nhập được. Thử lại.";
};

const client = () => {
  if (!auth) throw new Error("Firebase chưa được cấu hình");
  return auth;
};

const run = async (action: () => Promise<unknown>): Promise<void> => {
  try {
    await action();
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const firebaseCode = isRecord(error) && typeof error.code === "string" ? error.code : code;
    throw new Error(messageFor(firebaseCode));
  }
};

const isRecord = (value: unknown): value is { code?: unknown } =>
  typeof value === "object" && value !== null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      user,
      signIn: (email, password) => run(() => signInWithEmailAndPassword(client(), email.trim(), password)),
      signUp: (email, password) =>
        run(() => createUserWithEmailAndPassword(client(), email.trim(), password)),
      logout: () => run(() => signOut(client())),
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
