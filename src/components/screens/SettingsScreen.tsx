"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/PageHeader";
import SectionTitle from "@/components/SectionTitle";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { buildICS, downloadFile } from "@/lib/ics";
import {
  notificationSupported,
  requestNotificationPermission,
  showNotification,
} from "@/lib/notifications";
import type { BackupFile } from "@/lib/types";
import { colors } from "@/theme/tokens";

type PermissionState = NotificationPermission | "unsupported";

const PERMISSION_TEXT: Record<PermissionState, string> = {
  granted: "Đã cấp quyền",
  denied: "Đã bị chặn — mở cài đặt trình duyệt/điện thoại để cho phép lại",
  default: "Chưa cấp quyền",
  unsupported: "Trình duyệt này không hỗ trợ (iPhone: cần cài app ra màn hình chính trước)",
};

const isStandalone = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function SettingsScreen() {
  const { settings, updateSettings, tasks, today, exportBackup, importBackup, resetAll } =
    useAppData();
  const { user, logout } = useAuth();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [standalone, setStandalone] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setPermission(notificationSupported() ? Notification.permission : "unsupported");
    setStandalone(isStandalone());
  }, []);

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSettings({ notificationsEnabled: false });
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(notificationSupported() ? result : "unsupported");
    updateSettings({ notificationsEnabled: result === "granted" });
  };

  const sendTest = (delayMs: number) => {
    const payload = {
      title: "Thông báo thử",
      body: delayMs > 0 ? `Gửi sau ${delayMs / 1000} giây — thông báo đã hoạt động.` : "Thông báo đã hoạt động.",
      tag: `test-${Date.now()}`,
    };
    window.setTimeout(() => void showNotification(payload), delayMs);
    setMessage({
      type: "success",
      text: delayMs > 0 ? `Sẽ gửi sau ${delayMs / 1000} giây. Thử khoá màn hình ngay.` : "Đã gửi.",
    });
  };

  const exportICS = () => {
    downloadFile("lich-sinh-hoat.ics", buildICS(tasks, today), "text/calendar;charset=utf-8");
  };

  const exportJSON = () => {
    downloadFile(
      `sinh-hoat-backup-${today}.json`,
      JSON.stringify(exportBackup(), null, 2),
      "application/json",
    );
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile;
      await importBackup(parsed);
      setMessage({ type: "success", text: "Đã khôi phục dữ liệu." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Không đọc được file" });
    }
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetAll();
    setConfirmReset(false);
    setMessage({ type: "success", text: "Đã đặt lại dữ liệu mặc định." });
  };

  const numberField = (
    label: string,
    value: number,
    unit: string,
    onChange: (v: number) => void,
  ) => (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      slotProps={{
        htmlInput: { inputMode: "numeric" },
        input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
      }}
    />
  );

  return (
    <Box className="SettingsScreen">
      <PageHeader title="Cài đặt" />

      <Box className="px-5">
        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <SectionTitle>Tài khoản</SectionTitle>
        <Card className="mb-2 flex flex-col gap-3 p-4">
          <Typography variant="body2" sx={{ color: colors.muted }}>
            {user?.email}. Phiên đăng nhập được giữ cho đến khi bạn đăng xuất. Dữ liệu nằm trên Firebase,
            dùng chung cho các điện thoại đăng nhập cùng tài khoản.
          </Typography>
          <Button variant="outlined" onClick={() => void logout()}>
            Đăng xuất
          </Button>
        </Card>

        <SectionTitle>Thông báo</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <FormControlLabel
            control={
              <Switch
                checked={settings.notificationsEnabled && permission === "granted"}
                onChange={(e) => toggleNotifications(e.target.checked)}
                disabled={permission === "unsupported" || permission === "denied"}
              />
            }
            label="Bật nhắc nhở"
          />
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Trạng thái: {PERMISSION_TEXT[permission]}
            {standalone ? " · Đang chạy dạng app" : " · Đang chạy trong trình duyệt"}
          </Typography>
          <Box className="flex gap-2">
            <Button variant="outlined" onClick={() => sendTest(0)} disabled={permission !== "granted"}>
              Gửi thử ngay
            </Button>
            <Button variant="outlined" onClick={() => sendTest(10_000)} disabled={permission !== "granted"}>
              Thử sau 10 giây
            </Button>
          </Box>
          <Alert severity="warning" sx={{ fontSize: 13 }}>
            Không có server nên thông báo chỉ chạy khi app đang mở hoặc vừa chạy nền. Để nhắc chắc chắn
            khi đã tắt app, hãy dùng thêm &quot;Xuất sang Lịch điện thoại&quot; bên dưới.
          </Alert>
        </Card>

        <SectionTitle>Mục tiêu & giờ nhắc</SectionTitle>
        <Card className="flex flex-col gap-4 p-4">
          <Box className="grid grid-cols-2 gap-3">
            {numberField("Nước mỗi ngày", settings.waterTargetMl, "ml", (v) =>
              updateSettings({ waterTargetMl: Math.max(250, v) }),
            )}
            {numberField("Mỗi lần bấm", settings.waterStepMl, "ml", (v) =>
              updateSettings({ waterStepMl: Math.max(50, v) }),
            )}
            <TextField
              type="time"
              label="Kiểm tra nước lúc"
              value={settings.waterCheckTime}
              onChange={(e) => updateSettings({ waterCheckTime: e.target.value || "20:00" })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="time"
              label="Nhắc cuối ngày"
              value={settings.endOfDayTime}
              onChange={(e) => updateSettings({ endOfDayTime: e.target.value || "21:30" })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          {numberField("Bù thông báo bị lỡ trong vòng", settings.catchUpMinutes, "phút", (v) =>
            updateSettings({ catchUpMinutes: Math.min(120, v) }),
          )}
        </Card>

        <SectionTitle>Lịch điện thoại</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Xuất toàn bộ task đang bật thành file .ics, mở bằng Lịch (Calendar) để điện thoại tự nhắc kể cả
            khi app đóng. Xuất lại sau khi sửa task hoặc dời ngày task tùy chỉnh.
          </Typography>
          <Button variant="contained" onClick={exportICS}>
            Xuất sang Lịch điện thoại (.ics)
          </Button>
        </Card>

        <SectionTitle>Sao lưu dữ liệu</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Bản sao lưu để phòng khi đổi tài khoản. Dữ liệu chính nằm trên Firebase.
          </Typography>
          <Box className="flex gap-2">
            <Button variant="outlined" onClick={exportJSON} fullWidth>
              Xuất file
            </Button>
            <Button variant="outlined" component="label" fullWidth>
              Khôi phục
              <Box component="input" type="file" hidden onChange={handleImport} />
            </Button>
          </Box>
        </Card>

        <SectionTitle danger>Vùng nguy hiểm</SectionTitle>
        <Card className="p-4">
          <Button color="error" variant={confirmReset ? "contained" : "outlined"} fullWidth onClick={handleReset}>
            {confirmReset ? "Bấm lần nữa để xoá hết" : "Đặt lại dữ liệu mặc định"}
          </Button>
        </Card>
      </Box>
    </Box>
  );
}
