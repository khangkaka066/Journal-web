import Link from "next/link";
import {
  BookOpen,
  Bot,
  Camera,
  CheckSquare,
  Cloud,
  Database,
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
      "Bạn có thể thêm hoặc xóa preset ngay trong form hoặc quản lý tập trung ở Settings.",
    ],
  },
  {
    id: "screenshots",
    title: "Screenshot chart",
    icon: <Camera className="size-4 text-primary" />,
    items: [
      "Trong New trade hoặc Edit trade, upload chart screenshot ở mục Screenshots.",
      "Ảnh được lưu trong private Supabase Storage bucket.",
      "Vào trang trade detail để xem gallery và mở ảnh lớn.",
      "Screenshot review của AI cần ảnh chart đã upload và model OpenRouter hỗ trợ vision.",
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard và Weekly Review",
    icon: <FileText className="size-4 text-primary" />,
    items: [
      "Dashboard hiển thị tổng PnL, winrate, profit factor, expectancy và equity curve.",
      "Dùng filters để xem theo instrument, session, setup, strategy, mistake hoặc rule break.",
      "What to stop doing chỉ ra hành vi đang gây thiệt hại lớn nhất.",
      "Weekly Review gom dữ liệu tuần hiện tại để chọn một focus cho tuần sau.",
    ],
  },
  {
    id: "ai",
    title: "AI Coach bằng OpenRouter",
    icon: <Bot className="size-4 text-primary" />,
    items: [
      "Vào Settings > AI settings để nhập OpenRouter API key và model.",
      "Key được lưu trong trình duyệt bằng localStorage, không lưu vào Supabase.",
      "Trong Weekly có AI Weekly Review, Mistake Patterns và Study Plan.",
      "Trong trade detail có AI Trade Debrief và Screenshot Review.",
      "AI chỉ dùng để học tập và review process, không phải tín hiệu giao dịch.",
    ],
  },
  {
    id: "supabase",
    title: "Supabase cần làm gì",
    icon: <Database className="size-4 text-primary" />,
    items: [
      "Chạy migration SQL theo thứ tự trong supabase/migrations.",
      "Đảm bảo Authentication redirect URL có /auth/callback cho local và Vercel.",
      "Bucket screenshots là private và chỉ user sở hữu ảnh mới đọc được.",
      "Nếu mới pull code, nhớ chạy migration 0004_review_presets.sql để Settings preset hoạt động.",
    ],
  },
  {
    id: "vercel",
    title: "Deploy Vercel",
    icon: <Cloud className="size-4 text-primary" />,
    items: [
      "Framework preset chọn Next.js.",
      "Build Command là next build, Install Command là npm install.",
      "Output Directory để trống, không nhập Next.js default.",
      "Thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong Environment Variables.",
      "OPENROUTER_API_KEY có thể để trống nếu user nhập key trong Settings.",
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
              Hướng dẫn sử dụng trading journal, từ ghi trade, review lỗi, cấu hình AI cho đến deploy.
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
          dán OpenRouter API key, chọn model rồi Save. Nếu bạn đã cấu hình `OPENROUTER_API_KEY`
          trên Vercel thì user không bắt buộc nhập key trong app.
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
