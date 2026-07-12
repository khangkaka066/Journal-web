import Link from "next/link";
import {
  BookOpen,
  Bot,
  Camera,
  CheckSquare,
  DatabaseZap,
  FileText,
  KeyRound,
  ListChecks,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    id: "quick-start",
    title: "Bắt đầu nhanh",
    icon: <Sparkles className="size-4 text-primary" />,
    items: [
      "Đăng nhập vào app.",
      "Vào Settings để kiểm tra timezone, base currency, review presets và AI settings.",
      "Vào Trades > New trade để nhập trade đầu tiên.",
      "Sau khi có dữ liệu, xem Dashboard và Weekly để học từ thống kê.",
    ],
  },
  {
    id: "new-trade",
    title: "Ghi một trade",
    icon: <ListChecks className="size-4 text-primary" />,
    items: [
      "Điền instrument, direction, entry price, exit price, quantity và entry time.",
      "PnL và R-multiple sẽ tự tính nếu có risk.",
      "Mở More details để thêm setup, strategy, checklist, emotion, mistakes, lessons và notes.",
      "Nếu bạn chọn mistake hoặc rule từng gây lỗ trước đây, form sẽ hiện Process alerts để nhắc lại chi phí của lỗi đó.",
      "Dùng Save & add another nếu muốn nhập nhiều trade liên tục.",
    ],
  },
  {
    id: "checklist",
    title: "Checklist và tag",
    icon: <CheckSquare className="size-4 text-primary" />,
    items: [
      "Setup checklist giúp bạn đo trade có đủ điều kiện hay không.",
      "Mistake tags giúp gom lỗi như Chased entry, Moved stop, Late entry.",
      "Rule breaks dùng để đo rule nào làm bạn mất tiền nhiều nhất.",
      "Tag sẽ được chuẩn hóa tự động, ví dụ late entry, Late Entry và entered late được gom về một nhãn dễ thống kê hơn.",
      "Bạn có thể thêm hoặc xóa preset ngay trong form hoặc quản lý tập trung ở Settings.",
    ],
  },
  {
    id: "screenshots",
    title: "Screenshot chart",
    icon: <Camera className="size-4 text-primary" />,
    items: [
      "Trong New trade hoặc Edit trade, upload chart screenshot ở mục Screenshots.",
      "Ảnh giúp bạn xem lại đúng bối cảnh thị trường lúc vào lệnh.",
      "Vào trang trade detail để xem gallery và mở ảnh lớn.",
      "Screenshot review của AI cần ảnh chart đã upload và model OpenRouter hỗ trợ vision.",
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard, Weekly Review và Option Flow",
    icon: <FileText className="size-4 text-primary" />,
    items: [
      "Dashboard hiển thị tổng PnL, winrate, profit factor, expectancy và equity curve.",
      "Dùng filters để xem theo instrument, session, setup, strategy, mistake hoặc rule break.",
      "What to stop doing chỉ ra hành vi đang gây thiệt hại lớn nhất.",
      "Weekly Review gom dữ liệu tuần hiện tại để chọn một focus cho tuần sau.",
      "Option Flow hiển thị report 09:00 New York với put/call ratio, premium estimate, key strikes và top volume contracts.",
    ],
  },
  {
    id: "option-flow",
    title: "Đọc Option Flow Report",
    icon: <DatabaseZap className="size-4 text-primary" />,
    items: [
      "Vào Flow để xem report mới nhất sau 09:00 New York.",
      "Put/call volume ratio cao thường cho thấy put activity mạnh hơn call activity; thấp thì ngược lại.",
      "Premium estimate dùng mid price x volume x 100 để ước lượng dòng tiền tương đối.",
      "Key strikes giúp bạn biết vùng strike nào tập trung volume và open interest.",
      "Top volume contracts giúp tìm expiry/strike đang được giao dịch nhiều nhất.",
      "AI Trading Plan dùng knowledge base option flow, snapshot CBOE và các level QQQ để viết kịch bản if-then.",
      "Dùng report này để ghi bias và backtest với kết quả trong ngày, không dùng như tín hiệu vào lệnh một mình.",
    ],
  },
  {
    id: "ai",
    title: "AI Coach bằng OpenRouter",
    icon: <Bot className="size-4 text-primary" />,
    items: [
      "Vào Settings > AI settings để nhập OpenRouter API key và model.",
      "Sau khi lưu key, bạn có thể dùng các nút AI trong Weekly hoặc trade detail.",
      "Trong Weekly có AI Weekly Review, Mistake Patterns và Study Plan.",
      "Trong trade detail có AI Trade Debrief và Screenshot Review.",
      "Sau khi AI trả kết quả, bấm Save review để lưu lại và xem lại trong Saved AI reviews.",
      "AI chỉ dùng để học tập và review process, không phải tín hiệu giao dịch.",
    ],
  },
  {
    id: "settings",
    title: "Cài đặt cá nhân",
    icon: <Settings className="size-4 text-primary" />,
    items: [
      "Vào Settings để đổi timezone và base currency.",
      "Review presets dùng để chỉnh danh sách checklist, mistake tags và rule breaks theo phong cách trade của bạn.",
      "AI settings dùng để lưu OpenRouter key và model bạn muốn dùng.",
      "Sau khi chỉnh preset, form New trade sẽ dùng lại danh sách mới.",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/75 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4 text-primary" />
          Product guide
        </div>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Hướng dẫn sử dụng trading journal, từ ghi trade, review lỗi, xem thống kê cho đến dùng AI coach.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" render={<Link href="/trades/new" />}>
              <ListChecks className="size-4" />
              New trade
            </Button>
            <Button render={<Link href="/settings" />}>
              <Settings className="size-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-card/75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" />
            OpenRouter key
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Nếu muốn dùng AI, vào <span className="font-medium text-foreground">Settings &gt; AI settings</span>,
          dán OpenRouter API key, chọn model rồi Save. Sau đó quay lại Weekly hoặc trang chi tiết trade
          để bấm các nút AI coach.
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.id} id={section.id} className="bg-card/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {section.icon}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                {section.items.map((item, index) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-foreground">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
