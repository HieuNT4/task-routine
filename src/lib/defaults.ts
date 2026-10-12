import { addDays, dayOfWeek, diffDays, startOfWeek } from "./date";
import { nextOccurrence } from "./schedule";
import type { MenuPlan, Settings, ShoppingItem, Task, TaskCategory, WeekMenu } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  waterTargetMl: 2500,
  waterStepMl: 300,
  waterCheckTime: "20:00",
  endOfDayTime: "21:30",
  notificationsEnabled: false,
  catchUpMinutes: 15,
};

type Seed = Omit<Task, "createdAt" | "isActive" | "category"> & {
  category?: TaskCategory;
  isActive?: boolean;
};

const nextWeekday = (today: string, dow: number): string => {
  const diff = (dow - dayOfWeek(today) + 7) % 7;
  return addDays(today, diff);
};

const SNACK =
  "Nếu đói, chọn đúng 1 món, ăn trước 22:30:\n• Táo 1 quả (150g)\n• Chuối 1 quả (100g)\n• Sữa chua không đường 1 hộp (100g)\n• Trứng gà luộc 1 quả (50g)";

export const buildDefaultTasks = (today: string): Task[] => {
  const seeds: Seed[] = [
    {
      id: "wake-up",
      name: "Thức dậy + uống nước",
      time: "07:00",
      frequency: "daily",
      note: "Uống 300ml nước",
    },
    {
      id: "morning-care",
      name: "Vệ sinh sáng",
      time: "07:00",
      frequency: "daily",
      note: "Đánh răng + rửa mặt Cereta + dưỡng Babe + chống nắng",
    },
    {
      id: "meal-breakfast",
      name: "Ăn sáng",
      time: "07:15",
      frequency: "daily",
      category: "meal",
      mealSlot: "breakfast",
    },
    {
      id: "sup-d3",
      name: "Vitamin D3",
      time: "07:30",
      frequency: "daily",
      category: "supplement",
      note: "1000–2000 IU, uống cùng bữa sáng (bữa có chất béo)",
    },
    {
      id: "coffee-1",
      name: "Cà phê cốc 1",
      time: "09:00",
      frequency: "daily",
    },
    {
      id: "stand-up",
      name: "Đứng dậy đi lại",
      time: "10:00",
      frequency: "daily",
      note: "Mỗi 50 phút ngồi làm: đứng dậy đi lại 2–3 phút",
    },
    {
      id: "meal-lunch",
      name: "Ăn trưa",
      time: "12:00",
      frequency: "daily",
      category: "meal",
      mealSlot: "lunch",
      note: "T2, T4, T6: cơm văn phòng 1 suất (40.000đ). T3, T5, T7, CN: cơm mang.",
    },
    {
      id: "coffee-2",
      name: "Cà phê cốc 2",
      time: "12:30",
      frequency: "daily",
      note: "Không uống sau 13:30",
    },
    {
      id: "sup-omega3",
      name: "Omega-3",
      time: "12:30",
      frequency: "daily",
      category: "supplement",
      note: "250–500mg EPA+DHA, uống cùng bữa trưa",
    },
    {
      id: "walk",
      name: "Đi bộ nhanh 30 phút",
      time: "17:30",
      frequency: "weekly",
      daysOfWeek: [1, 2, 3, 4, 5],
      category: "exercise",
      remindAgainMin: 30,
    },
    {
      id: "resistance",
      name: "Kháng lực 15 phút",
      time: "18:00",
      frequency: "weekly",
      daysOfWeek: [2, 4, 6],
      category: "exercise",
      note: "Hít đất 10×2 · Squat 15×2 · Plank 30 giây×2",
    },
    {
      id: "shower",
      name: "Tắm",
      time: "18:00",
      frequency: "daily",
      note: "Nước ấm, dưới 10 phút",
    },
    {
      id: "hair-wash",
      name: "Gội đầu Selsun",
      time: "18:00",
      frequency: "weekly",
      daysOfWeek: [1, 3, 5],
      note: "Để 2–3 phút trên da đầu. Ngày khác nếu gội thì dùng dầu dịu.",
    },
    {
      id: "moisturize",
      name: "Dưỡng ẩm Babe toàn thân",
      time: "18:10",
      frequency: "daily",
      note: "Bôi trong 3 phút sau khi tắm",
    },
    {
      id: "meal-dinner",
      name: "Ăn tối",
      time: "19:00",
      frequency: "daily",
      category: "meal",
      mealSlot: "dinner",
    },
    {
      id: "sup-zinc",
      name: "Kẽm",
      time: "21:00",
      frequency: "daily",
      category: "supplement",
      note: "15–30mg, sau ăn tối 2 tiếng. Đợt ngắn 1–2 tháng, tắt task khi hết đợt.",
    },
    {
      id: "meal-snack",
      name: "Bữa phụ nếu đói",
      time: "21:30",
      frequency: "daily",
      category: "meal",
      mealSlot: "snack",
      note: "Chỉ 1 món. Không ăn sau 22:30.",
    },
    {
      id: "night-hygiene",
      name: "Vệ sinh tối",
      time: "22:30",
      frequency: "daily",
      note: "Đánh răng + chỉ nha khoa + rửa mặt + dưỡng ẩm",
    },
    {
      id: "phone-off",
      name: "Tắt điện thoại",
      time: "22:45",
      frequency: "daily",
      remindAgainMin: 5,
      note: "Để xa giường",
    },
    {
      id: "sleep",
      name: "Ngủ",
      time: "23:00",
      frequency: "daily",
      note: "Ngủ 7 tiếng. Không ngủ nướng cuối tuần.",
    },

    {
      id: "weigh-in",
      name: "Cân + đo bụng",
      time: "07:05",
      frequency: "weekly",
      daysOfWeek: [1],
      note: "Sáng, lúc đói. Nhập số ở tab Theo dõi.",
    },
    {
      id: "nail-cut",
      name: "Cắt móng",
      time: "08:00",
      frequency: "weekly",
      daysOfWeek: [0],
      category: "chore",
    },
    {
      id: "laundry",
      name: "Giặt quần áo",
      time: "08:30",
      frequency: "weekly",
      daysOfWeek: [0],
      category: "chore",
    },
    {
      id: "grocery",
      name: "Đi chợ",
      time: "09:00",
      frequency: "weekly",
      daysOfWeek: [0],
      category: "chore",
      note: "Danh sách mua 2 tuần ở tab Ăn uống",
    },
    {
      id: "bedding",
      name: "Giặt ga gối",
      time: "09:30",
      frequency: "custom",
      customInterval: 2,
      customUnit: "week",
      nextDue: nextWeekday(today, 0),
      category: "chore",
      note: "Chủ nhật, 2 tuần một lần. Phơi nắng.",
    },
    {
      id: "personal-buy",
      name: "Mua sản phẩm cá nhân",
      time: "10:00",
      frequency: "monthly",
      dayOfMonth: 1,
      category: "chore",
    },

    {
      id: "chk-derma",
      name: "Khám da liễu",
      time: "09:00",
      frequency: "custom",
      customInterval: 3,
      customUnit: "month",
      nextDue: addDays(today, 4),
      category: "checkup",
      note: "Việc đang chờ: làm trong tuần này",
    },
    {
      id: "chk-uro",
      name: "Khám tiết niệu",
      time: "09:00",
      frequency: "custom",
      customInterval: 6,
      customUnit: "month",
      nextDue: addDays(today, 10),
      category: "checkup",
      note: "Việc đang chờ: làm trong tháng này",
    },
    {
      id: "chk-blood",
      name: "Xét nghiệm máu",
      time: "07:30",
      frequency: "custom",
      customInterval: 6,
      customUnit: "month",
      nextDue: addDays(today, 18),
      category: "checkup",
      note: "Việc đang chờ: làm trong tháng này. Nhịn ăn sáng.",
    },
    {
      id: "chk-deworm",
      name: "Tẩy giun",
      time: "08:00",
      frequency: "monthly",
      dayOfMonth: 5,
      monthsOfYear: [1, 7],
      category: "checkup",
    },
    {
      id: "chk-dental",
      name: "Khám răng",
      time: "09:00",
      frequency: "monthly",
      dayOfMonth: 10,
      monthsOfYear: [1, 7],
      category: "checkup",
    },
    {
      id: "chk-general",
      name: "Khám tổng quát",
      time: "08:00",
      frequency: "yearly",
      dayOfMonth: 15,
      monthOfYear: 12,
      category: "checkup",
    },
  ];

  const createdAt = new Date().toISOString();
  return seeds.map((s) => {
    const task: Task = {
      category: "routine",
      isActive: true,
      remindAgainMin: 15,
      createdAt,
      ...s,
    };
    return task.frequency === "custom"
      ? task
      : { ...task, nextDue: nextOccurrence(task, today, today) };
  });
};

const day = (breakfast: string, lunch: string, dinner: string) => ({
  breakfast,
  lunch,
  dinner,
  snack: SNACK,
});

const KHOAI_CHUOI =
  "Khoai lang 1 củ (130g)\nTrứng gà luộc 2 quả (100g)\nSữa tươi không đường 1 hộp (200ml)\nChuối 1 quả (100g)";
const NGO_TAO =
  "Ngô luộc 1 bắp (200g)\nTrứng gà luộc 2 quả (100g)\nSữa tươi không đường 1 hộp (200ml)\nTáo 1 quả (150g)";
const NGO_OI =
  "Ngô luộc 1 bắp (200g)\nTrứng gà luộc 2 quả (100g)\nSữa tươi không đường 1 hộp (200ml)\nỔi 1 quả (150g)";
const KHOAI_CAM =
  "Khoai lang 1 củ (130g)\nTrứng gà luộc 2 quả (100g)\nSữa tươi không đường 1 hộp (200ml)\nCam 1 quả (150g)";
const SUA_CHUA = "Sữa chua không đường 1 hộp (100g)";
const COM_VP = "Cơm văn phòng 1 suất (40.000đ) — chọn thịt nạc + củ";

const week1: WeekMenu = {
  1: day(
    KHOAI_CHUOI,
    COM_VP,
    `Cơm trắng 1 chén (100g)\nThịt lợn nạc luộc 1 phần (150g)\nCà rốt luộc 1 củ (100g)\nSu hào luộc 1 củ (100g)\nTrứng gà luộc 1 quả (50g)\n${SUA_CHUA}`,
  ),
  2: day(
    NGO_TAO,
    "Cơm trắng 1 chén (100g)\nThịt lợn nạc luộc 1 phần (150g)\nCà rốt + su hào luộc 200g\nMang từ tối hôm trước",
    `Bún 1 chén (150g)\nĐậu phụ sốt cà chua 2 miếng (200g)\nSalad dưa chuột + cà chua 200g\n${SUA_CHUA}`,
  ),
  3: day(
    KHOAI_CHUOI,
    "Cơm văn phòng 1 suất (40.000đ)",
    `Cơm trắng 1 chén (100g)\nHàu hấp 1 phần (200g)\nBí đỏ hấp 1 miếng (200g)\n${SUA_CHUA}`,
  ),
  4: day(
    NGO_TAO,
    "Cơm trắng 1 chén (100g)\nHàu hấp 1 phần (150g)\nBí đỏ hấp 200g\nMang từ tối hôm trước",
    `Cơm trắng 1 chén (100g)\nCá rán 1 phần (150g)\nSalad cà rốt + củ cải 200g\nTrứng gà luộc 1 quả (50g)\n${SUA_CHUA}`,
  ),
  5: day(
    KHOAI_CHUOI,
    "Cơm văn phòng 1 suất (40.000đ)",
    `Phở 1 chén (150g)\nThịt gà luộc bỏ da 1 phần (150g)\nKhoai tây hấp 1 củ (200g)\n${SUA_CHUA}`,
  ),
  6: day(
    NGO_TAO,
    "Cơm trắng 1 chén (100g)\nThịt gà luộc 1 phần (150g)\nKhoai tây hấp 200g\nMang từ tối hôm trước",
    `Cơm trắng 1 chén (100g)\nĐậu phụ sốt cà chua 2 miếng (200g)\nSalad dưa chuột + cà chua 200g\n${SUA_CHUA}`,
  ),
  0: day(
    KHOAI_CHUOI,
    "Cơm trắng 1 chén (100g)\nĐậu phụ sốt cà 2 miếng (200g)\nSalad 200g\nMang từ tối hôm trước",
    `Bún 1 chén (150g)\nHàu hấp 1 phần (200g)\nCà rốt + su hào luộc 200g\n${SUA_CHUA}`,
  ),
};

const week2: WeekMenu = {
  1: day(
    NGO_OI,
    "Cơm văn phòng 1 suất (40.000đ)",
    `Cơm trắng 1 chén (100g)\nThịt gà luộc bỏ da 1 phần (150g)\nBí đỏ hấp 1 miếng (200g)\nTrứng gà luộc 1 quả (50g)\n${SUA_CHUA}`,
  ),
  2: day(
    KHOAI_CAM,
    "Cơm trắng 1 chén (100g)\nThịt gà luộc 1 phần (150g)\nBí đỏ hấp 200g\nMang từ tối hôm trước",
    `Miến 1 chén (100g)\nThịt bò xào 1 phần (150g)\nSalad cà rốt + củ cải 200g\n${SUA_CHUA}`,
  ),
  3: day(
    NGO_OI,
    "Cơm văn phòng 1 suất (40.000đ)",
    `Cơm trắng 1 chén (100g)\nHàu hấp 1 phần (200g)\nCà rốt + su hào luộc 200g\n${SUA_CHUA}`,
  ),
  4: day(
    KHOAI_CAM,
    "Cơm trắng 1 chén (100g)\nHàu hấp 1 phần (150g)\nCủ luộc 200g\nMang từ tối hôm trước",
    `Bún 1 chén (150g)\nĐậu phụ sốt cà chua 2 miếng (200g)\nSalad dưa chuột + cà chua 200g\n${SUA_CHUA}`,
  ),
  5: day(
    NGO_OI,
    "Cơm văn phòng 1 suất (40.000đ)",
    `Cơm trắng 1 chén (100g)\nThịt lợn nạc luộc 1 phần (150g)\nKhoai tây hấp 1 củ (200g)\nTrứng gà luộc 1 quả (50g)\n${SUA_CHUA}`,
  ),
  6: day(
    KHOAI_CAM,
    "Cơm trắng 1 chén (100g)\nThịt lợn nạc luộc 1 phần (150g)\nKhoai tây hấp 200g\nMang từ tối hôm trước",
    `Phở 1 chén (150g)\nThịt bò xào 1 phần (150g)\nSalad cà rốt + củ cải 200g\n${SUA_CHUA}`,
  ),
  0: day(
    NGO_OI,
    "Cơm trắng 1 chén (100g)\nThịt bò xào 1 phần (150g)\nSalad 200g\nMang từ tối hôm trước",
    `Cơm trắng 1 chén (100g)\nHàu hấp 1 phần (200g)\nCà rốt + su hào luộc 200g\n${SUA_CHUA}`,
  ),
};

/** Week 0 is the week containing `today`, then the two weeks alternate. */
export const buildDefaultMenu = (today: string): MenuPlan => ({
  anchorMonday: startOfWeek(today),
  weeks: [week1, week2],
});

/** 0 = tuần 1, 1 = tuần 2 */
export const menuWeekIndex = (anchorMonday: string, iso: string): 0 | 1 => {
  const passed = Math.floor(diffDays(anchorMonday, startOfWeek(iso)) / 7);
  return (((passed % 2) + 2) % 2) as 0 | 1;
};

const item = (id: string, name: string, quantity: string): ShoppingItem => ({
  id,
  name,
  quantity,
  checked: false,
});

export const DEFAULT_SHOPPING: ShoppingItem[] = [
  item("rice", "Gạo trắng", "1,4 kg"),
  item("sweet-potato", "Khoai lang", "1 kg (~8 củ, 130g/củ)"),
  item("corn", "Ngô", "7 bắp (~1,4 kg, 200g/bắp)"),
  item("potato", "Khoai tây", "800g"),
  item("pumpkin", "Bí đỏ", "400g"),
  item("noodle", "Bún", "600g"),
  item("vermicelli", "Miến", "200g"),
  item("pho", "Phở", "300g"),
  item("egg", "Trứng gà", "28 quả (50g/quả)"),
  item("pork", "Thịt lợn nạc", "1,2 kg"),
  item("beef", "Thịt bò", "600g"),
  item("chicken", "Thịt gà", "600g"),
  item("fish", "Cá", "600g"),
  item("tofu", "Đậu phụ", "1,4 kg (~14 miếng, 100g/miếng)"),
  item("oyster", "Hàu", "800g"),
  item("milk", "Sữa tươi không đường", "3 lít (15 hộp × 200ml)"),
  item("yogurt", "Sữa chua không đường", "14 hộp (100g/hộp)"),
  item("carrot", "Cà rốt", "1,2 kg (~12 củ)"),
  item("kohlrabi", "Su hào", "800g (~4 củ)"),
  item("radish", "Củ cải trắng", "400g"),
  item("cucumber", "Dưa chuột", "800g"),
  item("tomato", "Cà chua", "1 kg"),
  item("banana", "Chuối", "800g (~8 quả, 100g/quả)"),
  item("apple", "Táo", "600g (~4 quả, 150g/quả)"),
  item("guava", "Ổi", "800g (~5 quả, 150g/quả)"),
  item("orange", "Cam", "600g (~4 quả, 150g/quả)"),
  item("salt", "Muối i-ốt", "1 gói"),
  item("aromatics", "Tỏi, gừng, chanh, tiêu", "dùng dần"),
];

export const FOOD_RULES = [
  "Không đường",
  "Không cồn",
  "Không ăn sau 22:30",
  "Không ngủ nướng cuối tuần",
  "Không điện thoại sau 22:45",
];

export const MEAL_SLOT_LABEL = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Phụ đêm",
} as const;

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  routine: "Sinh hoạt",
  meal: "Ăn uống",
  exercise: "Vận động",
  chore: "Việc nhà",
  medicine: "Thuốc",
  supplement: "Bổ sung",
  checkup: "Khám",
};
