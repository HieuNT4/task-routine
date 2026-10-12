# Lịch sinh hoạt — PWA nhắc nhở cá nhân

PWA chạy trên điện thoại, nhắc lịch sinh hoạt hàng ngày cho 1 người. Không server, không database,
không đăng nhập. Toàn bộ dữ liệu nằm trên máy (localStorage + IndexedDB). Deploy miễn phí trên Vercel.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Material UI · `@ducanh2912/next-pwa`
(bản fork đang được bảo trì của `next-pwa`, hỗ trợ App Router) · `idb` · `@mui/x-charts`.

## Chạy local

```bash
npm install
npm run dev          # http://localhost:3000 (PWA tắt khi dev)
npm run dev:pwa      # dev có bật service worker
npm run build && npm start   # bản production, có service worker
npm run lint && npm run typecheck
```

## Cấu trúc

```
src/
  app/                      # route mỏng, mỗi page chỉ render 1 screen
    page.tsx                # 1. Hôm nay
    checklist/              # 2. Checklist theo ngày + quản lý task
    tracking/               # 3. Theo dõi (cân, vòng bụng, ngủ, sảng khoái)
    meals/                  # 4. Lịch ăn + đi chợ
    health/                 # 5. Thuốc & khám
    settings/               # Thông báo, mục tiêu, xuất lịch .ics, sao lưu
    ~offline/               # trang fallback khi offline
  components/
    screens/                # HomeScreen, ChecklistScreen, ...
    TaskItem, TaskFormDialog, PostponeDialog, WaterCard, MetricsForm, MetricsChart, ...
    NotificationScheduler   # bộ lập lịch thông báo phía client
  context/AppDataContext    # state chung + mọi thao tác ghi dữ liệu
  lib/
    types.ts                # data model
    schedule.ts             # logic lặp lại + dời ngày
    notifications.ts        # lập kế hoạch & điều kiện thông báo
    db.ts                   # IndexedDB: completions, water, metrics
    storage.ts              # localStorage: tasks, settings, menu, shopping
    ics.ts                  # xuất lịch iCalendar
    defaults.ts             # task/menu mặc định
  theme/tokens.ts           # màu/bo góc dùng chung cho MUI theme và Tailwind
worker/index.ts             # custom service worker (bấm vào thông báo, push)
public/manifest.json, public/icons/
```

## Logic task

| Tần suất  | Trường dùng                                   | Ví dụ                         |
| --------- | --------------------------------------------- | ----------------------------- |
| `daily`   | —                                             | Uống nước, đánh răng          |
| `weekly`  | `daysOfWeek` (0 = CN … 6 = T7)                | Gội đầu T2/4/6                |
| `monthly` | `dayOfMonth`, `monthsOfYear` (tùy chọn)       | Tẩy giun ngày 5, tháng 1 và 7 |
| `yearly`  | `dayOfMonth`, `monthOfYear`                   | Khám tổng quát 15/12          |
| `custom`  | `customInterval` + `customUnit`, `nextDue`    | Giặt ga 2 tuần/lần            |

**Dời ngày** hoạt động theo 2 kiểu:

- Task theo lịch (daily/weekly/monthly/yearly): chỉ dời **lần đó**, lưu vào `reschedules[ngàyGốc] = ngàyMới`.
  Tần suất gốc giữ nguyên.
- Task `custom`: `nextDue = ngàyMới`, làm xong thì lần sau = ngày làm + chu kỳ, nên cả chuỗi lịch dịch theo.
  Task custom chưa làm sẽ hiện "Quá hạn" cho tới khi tick.

## Thông báo — đọc kỹ phần này

App không có server nên **không có Web Push thật**. Thông báo được tạo bởi `NotificationScheduler`
chạy trong app (kiểm tra mỗi 20 giây) và hiển thị qua service worker:

- Nhắc đúng giờ từng task (các task cùng giờ gộp chung 1 thông báo).
- Nhắc lại sau N phút nếu chưa tick (`remindAgainMin`; "Tắt điện thoại" 22:45 → nhắc lại 22:50).
- 20:00 nếu chưa uống đủ nước → nhắc.
- 21:30 nhắc các việc còn lại trong ngày.
- Sáng CN (cắt móng, giặt đồ) và sáng T2 (cân) là các task weekly bình thường.
- Mở lại app trong vòng 15 phút sau giờ nhắc thì vẫn nhận được thông báo bị lỡ.

**Giới hạn:** thông báo chỉ chạy khi app đang mở hoặc vừa chuyển sang chạy nền (Android giữ được lâu hơn,
iOS dừng gần như ngay). Để nhắc chắc chắn khi đã tắt hẳn app, vào **Cài đặt → Xuất sang Lịch điện thoại
(.ics)**: app Lịch của điện thoại sẽ báo đúng giờ mà không cần server. Xuất lại sau khi sửa task.

### Test thông báo

Thông báo và service worker trên điện thoại **bắt buộc HTTPS**, nên hãy test trên bản deploy Vercel
(hoặc qua tunnel HTTPS miễn phí như `cloudflared tunnel --url http://localhost:3000`).

1. Cài app lên màn hình chính (xem bên dưới). Với iPhone, đây là điều kiện bắt buộc.
2. Mở app → **Cài đặt** → bật **Bật nhắc nhở** → cho phép thông báo.
3. Bấm **Gửi thử ngay**: thông báo phải hiện ra.
4. Bấm **Thử sau 10 giây**, rồi chuyển sang app khác/khoá màn hình: kiểm tra thông báo khi chạy nền.
5. Test nhắc theo giờ: thêm task có giờ = 2 phút sau giờ hiện tại, để app mở, chờ thông báo.
   Không tick task đó và chọn "Nhắc lại sau 5 phút" để test nhắc lại.
6. Trên desktop Chrome: `npm run build && npm start`, mở `http://localhost:3000` (localhost được coi là an toàn).

## Cài PWA lên điện thoại

**iPhone (iOS 16.4 trở lên, Safari):** mở URL bằng Safari → nút Chia sẻ → **Thêm vào MH chính** → mở app từ
icon vừa tạo → vào Cài đặt bật thông báo. Muốn xuất `.ics` thì mở URL bằng Safari (không phải trong app
đã cài) → Cài đặt → Xuất → chọn "Thêm tất cả" vào Lịch.

**Android (Chrome):** mở URL → menu ⋮ → **Cài đặt ứng dụng** / **Thêm vào màn hình chính** → mở app → bật
thông báo. Nên tắt tối ưu pin cho Chrome để thông báo chạy nền ổn định hơn.

## Deploy Vercel (miễn phí, gói Hobby)

Không cần Vercel CLI và không cần Firebase.

1. Push repo lên GitHub bằng tài khoản **hieu.nguyen2@tomosia.com** (xem mục bên dưới).
2. Vào [vercel.com/new](https://vercel.com/new) → Import repo → Framework: Next.js → Deploy.
   Không cần biến môi trường.
3. Mỗi lần push lên `main`, Vercel tự deploy lại.

Cách khác dùng CLI (tùy chọn): `npx vercel` rồi `npx vercel --prod`.

### Tránh push nhầm tài khoản GitHub

- SSH host `github.com` trong `~/.ssh/config` đã trỏ tới key Tomosia (`id_ed25519`), nên dùng remote SSH:
  `git remote add origin git@github.com:<tomosia-user>/doctor-men.git`.
- **Không dùng `gh repo create`** khi `gh` đang active tài khoản bee2b. Kiểm tra bằng `gh auth status`,
  chuyển bằng `gh auth switch`, hoặc tạo repo trên web GitHub.
- Repo này đã đặt git config local: `user.email = hieu.nguyen2@tomosia.com`.

## Sao lưu

Dữ liệu chỉ nằm trên 1 máy. Vào **Cài đặt → Sao lưu dữ liệu → Xuất file** định kỳ. Xoá dữ liệu Safari
hoặc gỡ app sẽ mất dữ liệu.
