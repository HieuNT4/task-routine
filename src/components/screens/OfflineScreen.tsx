import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { colors } from "@/theme/tokens";

export default function OfflineScreen() {
  return (
    <Box className="OfflineScreen flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
      <Typography variant="h2">Đang offline</Typography>
      <Typography variant="body2" sx={{ color: colors.muted, mt: 1 }}>
        Trang này chưa được lưu sẵn. Quay lại màn hình Hôm nay — dữ liệu của bạn vẫn nằm trên máy.
      </Typography>
    </Box>
  );
}
