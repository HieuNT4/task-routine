"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/tokens";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="AuthScreen mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center bg-white px-6">
      <Typography variant="h1" component="h1">
        Lịch sinh hoạt
      </Typography>
      <Typography variant="body2" sx={{ color: colors.muted, mt: 1, mb: 4 }}>
        {mode === "signin" ? "Đăng nhập để xem lịch của bạn" : "Tạo tài khoản. Mỗi người một lịch riêng."}
      </Typography>
      <Box
        component="form"
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          type="email"
          label="Email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          type="password"
          label="Mật khẩu"
          value={password}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <Typography variant="body2" sx={{ color: colors.danger }}>
            {error}
          </Typography>
        )}
        <Button type="submit" variant="contained" size="large" disabled={busy || !email || password.length < 6}>
          {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
        <Button
          type="button"
          color="inherit"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
        >
          {mode === "signin" ? "Chưa có tài khoản? Tạo mới" : "Đã có tài khoản? Đăng nhập"}
        </Button>
      </Box>
    </Box>
  );
}
