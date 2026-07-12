# Cẩm nang Option Flow — Knowledge Base cho AI (RAG)

> Phiên bản Markdown chuẩn hóa từ `option_flow_guide.pdf`, bổ sung các mảng còn thiếu.
> Mục đích: làm nguồn tri thức để AI đọc snapshot option chain mới (QQQ/SPY/cổ phiếu) và suy luận.
> Tài liệu giáo dục — không phải khuyến nghị đầu tư.
> Quy ước: mỗi mục H2 là một chunk độc lập, tự đứng được khi retrieve riêng lẻ.

## 1. Option flow là gì và giá trị thông tin

Option flow là dòng lệnh giao dịch quyền chọn: ai đang mua/bán call hay put nào, strike nào, kỳ hạn nào, khối lượng và giá trị bao nhiêu, khớp chủ động (đánh lên ask / đạp xuống bid) hay thụ động. Khác với nhìn giá cổ phiếu, flow cho thấy **positioning** — tiền đang đặt cược vào kịch bản nào.

Ba nguồn giá trị thông tin:
1. **Đòn bẩy thông tin**: tin/quan điểm mạnh thường thể hiện qua options trước khi thể hiện qua cổ phiếu.
2. **Dấu chân tổ chức**: lệnh block/sweep nhiều triệu USD premium hầu như không thể là retail.
3. **Hiệu ứng phản hồi cơ học (quan trọng nhất)**: dealer ôm vị thế quyền chọn buộc phải hedge bằng cổ phiếu/futures, tạo lực đẩy giá thật có thể dự đoán từ dữ liệu chain.

**Nguyên tắc vàng**: mỗi giao dịch có hai phía. Flow không cho biết thị trường nghĩ gì — nó cho biết (a) ai chủ động trả tiền để có vị thế, và (b) dealer bị đẩy vào vị thế ngược lại nào. Toàn bộ kỹ năng đọc flow xoay quanh hai câu hỏi đó.

## 2. Volume vs Open Interest vs Premium

| | Volume | Open Interest (OI) |
|---|---|---|
| Định nghĩa | Số hợp đồng giao dịch trong ngày | Số hợp đồng đang tồn tại (chưa đóng/chưa đáo hạn) |
| Cập nhật | Realtime trong phiên | Một lần sau mỗi đêm (OCC tính qua đêm) |
| Cho biết | Sự quan tâm hôm nay | Positioning tích lũy — "tiền đang đóng quân ở đâu" |
| Reset | Về 0 mỗi ngày | Không reset; giảm khi đóng vị thế hoặc đáo hạn |

Quy tắc suy luận kết hợp:
- Volume cao + OI hôm sau **tăng** → vị thế mới được mở (tiền mới vào cược).
- Volume cao + OI hôm sau **giảm/không đổi** → chủ yếu đóng vị thế cũ hoặc trade trong ngày.
- Volume > OI hiện tại ở một strike → chắc chắn có mở mới đáng kể hôm nay (dấu hiệu unusual activity kinh điển). Ngoại lệ: với 0DTE điều này là bình thường (mở-và-đóng trong ngày).

**Premium = giá quyền chọn × 100 × số hợp đồng.** Luôn xếp hạng flow theo dollar premium, không theo số hợp đồng (10.000 put giá $0.05 chỉ là $50.000 — xổ số; 500 hợp đồng giá $20 là $1.000.000 — tiền thật). Trong dữ liệu crawl: cột `dollar_volume` và `dollar_open_interest` là premium ước tính theo giá mid.

Greeks tối thiểu khi đọc flow:
- **Delta**: độ nhạy theo giá cơ sở ≈ xác suất ITM. Dealer dùng delta để tính lượng cổ phiếu cần hedge. Flow delta lớn = tác động hedge lớn.
- **Gamma**: tốc độ thay đổi delta, tập trung ATM + kỳ hạn ngắn. Là "chất nổ" khiến dealer phải hedge liên tục.
- **IV**: giá của sự bất định. IV bật tăng kèm flow mua ồ ạt tự nó là tín hiệu.
- **Theta**: suy hao thời gian. Mua option ngắn hạn chịu theta lớn → thể hiện kỳ vọng có chất xúc tác gần.

## 3. Put/Call Ratio — cách đọc đúng

Hai phiên bản:
- **P/C theo volume**: tâm lý trong ngày, nhiễu, nhạy sự kiện.
- **P/C theo OI**: positioning tích lũy, chậm, phản ánh hedge dài hạn.

**Bẫy phổ biến nhất**: với chỉ số/ETF chỉ số (SPY, QQQ, SPX), P/C luôn nghiêng về put tự nhiên vì các quỹ mua put bảo hiểm danh mục — P/C OI 1.2–1.5 là bình thường, không bearish. Chỉ đáng chú ý khi lệch mạnh khỏi **vùng bình thường của chính nó** (so với trung bình/z-score 20 phiên), ví dụ vọt >2 hoặc tụt <0.8. Với cổ phiếu đơn lẻ chuẩn khác hẳn: P/C >1 ở một cổ phiếu tăng trưởng đã là bất thường.

Ví dụ kiểm chứng (QQQ 05/07/2026): P/C OI toàn chain = 1.39 (bình thường), near-term OI vọt 1.72 (hedge ngắn hạn dày), nhưng P/C volume 0DTE 0.93 → bias trung tính. Phiên kế tiếp QQQ gap lên +1.8% — P/C OI cao không đồng nghĩa giá giảm.

### Phân bố OI theo strike — bản đồ chiến trường
- **Put wall**: strike có put OI vượt trội dưới spot → vùng hỗ trợ (dealer mua lại cổ phiếu khi put mất giá trị).
- **Call wall**: strike có call OI vượt trội trên spot → vùng kháng cự (dealer bán hedge khi call tiến vào ITM).
- Strike tròn (700, 750…) luôn hút OI — hiệu ứng tâm lý, không cần lý do đặc biệt.
- **Khoảng trống OI** giữa hai wall: giá đi qua vùng này thường nhanh vì ít lực hãm từ hedging.

## 4. Đọc từng lệnh: sweep, block, split, aggressor side

**Aggressor side** — câu hỏi quan trọng nhất với mỗi giao dịch: khớp tại ask (mua chủ động) hay bid (bán chủ động)?

| Giao dịch | Khớp tại ask (mua chủ động) | Khớp tại bid (bán chủ động) |
|---|---|---|
| Call | Bullish (cược tăng/FOMO) | Trung tính–bearish nhẹ (chốt lời, covered call) |
| Put | Bearish hoặc hedge (phải phân biệt — mục 5) | Bullish nhẹ (bán bảo hiểm, cash-secured put) |

Các dạng lệnh:

| Dạng | Nhận diện | Diễn giải |
|---|---|---|
| **Sweep** | Lệnh lớn bị chẻ nhỏ, quét đồng thời nhiều sàn, khớp tại ask | Khẩn cấp — ưu tiên tốc độ hơn giá. Tín hiệu mạnh nhất, đặc biệt khi kỳ hạn ngắn + OTM + premium lớn |
| **Block** | Một khối rất lớn, khớp một lần, thường tại mid, một sàn/upstairs | Tổ chức đàm phán trước. Bình tĩnh, hay là hedge hoặc cấu trúc phức tạp. Ít "khẩn cấp" hơn sweep nhưng quy mô đáng tin hơn |
| **Split/Ladder** | Nhiều lệnh vừa, cùng hướng, rải strike/kỳ hạn, lặp lại trong nhiều phút–giờ | Tích lũy có kỷ luật, tránh gây chú ý |
| **Multi-leg** (spread, collar, risk reversal) | Các chân khớp cùng lúc, premium ròng nhỏ hơn nhiều tổng premium các chân | **Không được đọc từng chân riêng!** Một call bị bán trong collar không phải tín hiệu bearish. Phải nhận diện cấu trúc trước khi kết luận hướng |

Khung xác nhận: lệnh lớn hôm nay → chờ OI sáng hôm sau. OI tăng tương ứng = vị thế mở mới và còn được giữ; OI không tăng = đã đóng trong ngày hoặc là một chân của cấu trúc → tín hiệu yếu đi nhiều.

Giới hạn dữ liệu snapshot (Cboe delayed): không có time & sales từng lệnh kèm aggressor side → không phân biệt được sweep/block trực tiếp. Suy luận gần đúng: so `last` với `bid/ask` tại thời điểm snapshot; so volume hôm nay với thay đổi OI hôm sau.

## 5. Phân biệt đầu cơ vs phòng hộ (kỹ năng khó nhất)

Sai lầm lớn nhất của người mới: thấy put lớn là hô "smart money đánh xuống". Với chỉ số và cổ phiếu vốn hóa lớn, **phần lớn put flow là bảo hiểm danh mục** của người đang cầm rất nhiều cổ phiếu (trước và trong khi họ vẫn bullish).

| Đặc điểm | Thiên về HEDGE | Thiên về ĐẦU CƠ có hướng |
|---|---|---|
| Strike | OTM sâu (bảo hiểm thảm họa: P600/P500/P400 trên QQQ spot ~712) | ATM hoặc OTM gần, nơi delta/gamma có ý nghĩa |
| Kỳ hạn | Dài, rải đều theo quý, roll định kỳ | Ngắn, tập trung quanh một sự kiện (earnings, FOMC, CPI) |
| Nhịp điệu | Lặp lại đều đặn, không nhạy tin tức | Xuất hiện đột ngột, quy mô bất thường so với lịch sử của strike đó |
| Cấu trúc | Put spread, collar (mua put + bán call) để giảm chi phí | Mua trần một chân (outright), quét ask |
| Tương quan giá | Mua put khi giá đang tăng (khóa lãi) | Mua put khi có tin xấu manh nha |

Quy tắc lọc thực dụng: put OTM sâu hơn ~15% khỏi spot với kỳ hạn xa → gán nhãn tail hedge, loại khỏi phân tích ngắn hạn; chỉ tập trung OI trong ±3% quanh spot cho bias vài phiên tới.

## 6. Dealer positioning: delta hedging, gamma, walls, pinning

Cơ chế: dealer đứng bán/mua đối ứng với khách và không muốn rủi ro hướng → trung hòa bằng mua/bán cổ phiếu theo delta.
- Khách **mua call** ồ ạt → dealer short call, giá tăng khiến delta call tăng → dealer phải **mua thêm** → khuếch đại đà tăng ("gamma squeeze" khi flow call OTM ồ ạt).
- Khách **mua put** ồ ạt → giá giảm dealer phải **bán thêm** → khuếch đại đà giảm.
- Khách **bán option** cho dealer (covered call, put writing) → chiều ngược lại: dealer long gamma.

| | Dealer LONG gamma (khách bán option ròng) | Dealer SHORT gamma (khách mua option ròng) |
|---|---|---|
| Hành vi hedge | Giá tăng → dealer bán; giá giảm → dealer mua | Giá tăng → dealer mua đuổi; giá giảm → dealer bán tháo |
| Hệ quả lên giá | Giảm biến động, giá bị "ghim" (pin) quanh strike OI lớn, mean-reversion trong ngày | Khuếch đại biến động, trend trong ngày mạnh, dễ có cú sập/squeeze |
| Thường xảy ra | Thị trường yên ắng, gần expiry lớn (OPEX) | Sau cú sốc, khi ai cũng mua bảo hiểm/mua call chạy hàng |

Ba hiện tượng thực chiến:
1. **Pinning**: spot kẹt giữa cụm OI lớn → dealer hedge kéo giá về đó từ cả hai phía (case QQQ: spot 712.6 kẹt giữa cụm OI 710–715).
2. **Wall bị xuyên thủng → chạy nhanh**: vượt hẳn call wall (hoặc thủng put wall) là đi vào khoảng trống OI, ít lực hãm.
3. **Put decay tailwind**: giá tăng khiến khối put OI lớn mất delta → dealer (đang short cổ phiếu hedge các put đó) mua lại → lực đẩy bổ sung. Giải thích vì sao gap tăng thường giữ được.

**GEX (Gamma Exposure)**: GEX ≈ Σ(gamma × OI × 100 × spot² × 1%) theo từng contract, quy ước dấu thường dùng: call OI dương, put OI âm. GEX dương lớn → chế độ nén biến động; GEX âm → chế độ khuếch đại. **Gamma flip level** = mức giá mà GEX đổi dấu — dưới mức này thị trường trở nên dễ trượt mạnh. Dữ liệu crawl có đủ cột `gamma`, `open_interest`, `underlying_last` để tự tính GEX theo strike.

**Caveat quan trọng của GEX** (bổ sung): quy ước "call dương/put âm" là giả định dealer short call, long put — đúng đa số nhưng sai khi flow chủ đạo là bán option (vd. covered-call ETF bán call ồ ạt → dealer thực ra long call). GEX là ước lượng thô; tin cậy nhất khi kết hợp với việc kiểm chứng hành vi giá quanh các mức (wall có "hoạt động" như dự đoán không).

## 7. 0DTE và cấu trúc kỳ hạn của flow

Từ khi SPY/QQQ có đáo hạn mỗi ngày, 0DTE chiếm ~40–50% volume chỉ số. Đặc thù:
- Gamma cực cao, theta cực cao → flow 0DTE tác động trong ngày rất mạnh nhưng **không nói gì về xu hướng nhiều ngày**.
- OI của 0DTE buổi sáng thường nhỏ so với volume cả ngày (volume gấp ~7 lần OI trong dữ liệu QQQ) — đừng dùng OI 0DTE làm tín hiệu positioning.
- Cách dùng đúng: volume 0DTE theo strike trong phiên → tìm vùng pin và hướng flow chủ động của **hôm đó**; OI kỳ hạn 1–4 tuần → bias nhiều ngày; OI kỳ hạn quý/LEAPS → hedge cấu trúc (loại ra).

## 8. IV dynamics: rank, skew, term structure (bổ sung)

**IV Rank / IV Percentile**: IV hiện tại so với range 52 tuần của chính nó. IV 25% có thể là "đắt" với QQQ nhưng "rẻ" với một cổ phiếu biotech. Mọi nhận định đắt/rẻ của option phải qua IV rank, không qua con số IV tuyệt đối.

**Skew (độ lệch IV theo strike)**:
- Chỉ số luôn có put skew tự nhiên (put OTM đắt hơn call OTM cùng khoảng cách) do nhu cầu bảo hiểm.
- Thước đo chuẩn: **25-delta risk reversal** = IV(call 25Δ) − IV(put 25Δ), thường âm với chỉ số.
- Tín hiệu: skew **dốc thêm nhanh** (put đắt lên tương đối) = cầu bảo hiểm tăng đột biến → thận trọng. Skew **phẳng đi** khi giá giảm = ít ai mua thêm bảo hiểm → đáy ngắn hạn hay xuất hiện. Call skew dương ở cổ phiếu đơn lẻ = đám đông cược tăng (hay gặp trước squeeze hoặc trước đỉnh).

**Term structure (IV theo kỳ hạn)**:
- Bình thường: contango (IV kỳ hạn xa > gần).
- Backwardation (IV gần > xa) = thị trường đang định giá sự kiện/stress ngay trước mắt.
- **Bump quanh một expiry cụ thể** = thị trường định giá sự kiện đúng ngày đó (earnings, FOMC). Đo "expected move" của sự kiện: giá straddle ATM của expiry đó ÷ spot.

**IV crush**: sau sự kiện, IV kỳ hạn ngắn sụp ngay lập tức. Hệ quả cho đọc flow: người mua option trước sự kiện phải thắng cả hướng lẫn biên độ; flow mua option *sau* khi IV đã crush mang nhiều thông tin hướng hơn flow mua trước sự kiện (vốn có thể chỉ là cược volatility).

## 9. Vanna, Charm và chu kỳ OPEX (bổ sung)

Ngoài gamma, hai lực hedge cơ học quan trọng:
- **Vanna** (delta thay đổi theo IV): dealer short put nhiều → khi IV **giảm**, delta các put đó co lại → dealer mua lại cổ phiếu hedge → **IV giảm tự nó tạo lực mua**. Đây là "vanna rally" điển hình sau sự kiện rủi ro đi qua (FOMC kết thúc, VIX xì hơi → thị trường được mua lên một cách cơ học).
- **Charm** (delta suy hao theo thời gian): các put OTM hedge mất delta dần mỗi ngày khi gần đáo hạn → dealer mua lại đều đặn. Lực này mạnh nhất **tuần trước OPEX tháng** — giải thích thiên hướng trôi lên (drift-up) của tuần OPEX khi không có tin xấu.

**Chu kỳ OPEX** (đáo hạn tháng — thứ Sáu tuần thứ 3; đáo hạn quý lớn hơn nhiều):
1. Trước OPEX: OI tích lũy lớn → gamma/charm/vanna kìm giá, pinning mạnh.
2. Ngay sau OPEX: khối OI đáo hạn biến mất → thị trường "mở khóa gamma", tuần sau OPEX thường biến động hơn hẳn và dễ đổi hướng.
3. Suy luận thực dụng: một breakout ngay sau OPEX đáng tin hơn breakout trước OPEX (vốn hay bị hedge kéo về).

## 10. Fake flow — các nguồn nhiễu phải lọc (bổ sung)

| Loại nhiễu | Nhận diện | Vì sao không phải tín hiệu |
|---|---|---|
| **Deep ITM print khổng lồ** | Call/put delta ~1.0, premium rất lớn, khớp tại mid | Thường là chuyển vị thế thay cổ phiếu (stock replacement, dividend arbitrage, exercise game) — không phải cược hướng mới |
| **Box spread** | 4 chân cùng expiry tạo payoff cố định | Là nghiệp vụ vay/cho vay lãi suất, premium cực lớn nhưng zero thông tin hướng |
| **Roll vị thế** | Cùng lúc: đóng strike/expiry cũ (volume lớn + OI giảm hôm sau) + mở strike/expiry mới | Không phải tiền mới — chỉ là duy trì vị thế cũ. Nhận diện bằng cặp volume lớn xuất hiện đồng thời ở 2 dòng |
| **Dividend play** | Volume call ITM khổng lồ 1–2 ngày trước ex-dividend | Trò chơi exercise chuyên nghiệp, biến mất sau ex-date |
| **Kết hợp với cổ phiếu (buy-write, delta-neutral)** | Option print kèm cross cổ phiếu cùng lúc | Vị thế tổng đã trung hòa hướng; đọc riêng chân option sẽ sai |

Quy tắc: trước khi gán ý nghĩa cho một print lớn, loại trừ theo thứ tự: multi-leg? → roll? → deep ITM/box/dividend? → còn lại mới xét là cược hướng hoặc hedge.

## 11. Playbook theo sự kiện (bổ sung)

**FOMC / CPI**:
- Trước sự kiện: IV kỳ hạn ngắn bump, flow chủ yếu là mua bảo hiểm hai chiều — **đừng đọc hướng từ flow trước sự kiện**.
- Sau sự kiện: IV crush → vanna tailwind (mục 9). Flow xuất hiện **sau** khi kết quả đã ra, quét ask, kỳ hạn ngắn → tín hiệu hướng đáng tin hơn nhiều.
- 0DTE ngày FOMC cực lớn; wall có thể dịch trong phiên — snapshot buổi sáng mất giá trị nhanh.

**Earnings (cổ phiếu đơn lẻ)**:
- Expected move = straddle ATM expiry gần nhất ÷ spot.
- Flow đáng chú ý nhất: mua option **kỳ hạn xa hơn** kỳ earnings (không bị IV crush ăn hết) hoặc flow xuất hiện sau kết quả.
- Sau earnings: OI cũ đáo hạn dần, bản đồ wall vẽ lại từ đầu.

**VIX complex**: VIX spike + put flow chỉ số ồ ạt cùng lúc = hedge hoảng loạn, thường gần đáy hơn đỉnh (tín hiệu ngược). VIX thấp + call flow chỉ số đều đặn = trend đang khỏe.

## 12. Ngưỡng định lượng tham khảo (bổ sung — hiệu chỉnh theo tài sản)

Các ngưỡng dưới đây là điểm khởi đầu cho QQQ/SPY và large-cap; luôn ưu tiên so sánh với lịch sử của chính tài sản (z-score/percentile 20 phiên) hơn là ngưỡng tuyệt đối.

| Đại lượng | Ngưỡng chú ý | Ngưỡng mạnh |
|---|---|---|
| Premium một lệnh/cụm lệnh (large-cap) | ≥ $250k | ≥ $1M (0DTE/ngắn hạn), ≥ $5M (kỳ hạn xa) |
| Volume/OI tại strike (kỳ hạn ≥1 tuần) | ≥ 2× | ≥ 5× kèm OI xác nhận hôm sau |
| P/C ratio (so với chính nó) | z-score ≥ ±1.5 | z-score ≥ ±2.5 |
| IV bật trong phiên kèm flow mua | +10% tương đối (vd 25%→27.5%) | +20% tương đối |
| Khoảng cách strike để coi là tail hedge (chỉ số) | > 10–15% OTM kỳ hạn > 2 tháng | > 20% OTM |
| Vùng OI liên quan cho bias vài phiên | ±3% quanh spot | — |
| Tỷ trọng 0DTE trong volume chỉ số | ~40–50% là bình thường | — |

## 13. Quy trình đọc flow hằng ngày (checklist chuẩn)

1. **Tối hôm trước / sáng sớm** — chạy snapshot chain (script `daily_qqq_snapshot.py`, 20:00):
   - P/C OI & volume: toàn chain và near-term riêng — so với trung bình 20 phiên của chính nó.
   - Vẽ OI theo strike ±5% quanh spot → xác định put wall, call wall, khoảng trống OI.
   - Ghi 3 mức: hỗ trợ chính, kháng cự chính, "điểm gãy" (mức mà nếu thủng thì cấu trúc đổi).
2. **So sánh với snapshot hôm trước** — OI tăng/giảm ở đâu? Wall dịch chuyển lên hay xuống? Volume hôm qua có được OI xác nhận không (mở mới vs đóng cũ)?
3. **Trong phiên** — theo dõi strike nào hút volume, last khớp gần ask/bid, IV có bị đẩy không, volume 0DTE dồn về strike nào.
4. **Viết dự báo dạng if-then** — ví dụ: "giữ trên 715 thì pin 715–720; thủng 710 thì trượt nhanh về 700; vượt 720 mở đường 730" — kèm lý do cơ học (gamma/wall), không kèm cảm tính.
5. **Hôm sau chấm điểm** — mệnh đề nào đúng/sai, vì cơ chế hay vì tin tức ngoài mô hình? Ghi vào nhật ký. Sau 30–50 phiên sẽ biết tín hiệu nào có edge thật với chính thị trường mình theo dõi.

## 14. Case study kiểm chứng: QQQ 02–06/07/2026

Dữ liệu 02/07, spot 712.6:

| Bước | Quan sát | Suy luận |
|---|---|---|
| 1. Đo nền tâm lý | P/C OI toàn chain 1.39; P/C volume 1.10 | Bình thường với QQQ → không có tín hiệu sợ hãi bất thường |
| 2. Lọc kỳ hạn gần | P/C OI near-term 1.72; P/C volume 0DTE 0.93 | Hedge treo dày nhưng tiền mới trong ngày nghiêng call nhẹ → trung tính |
| 3. Loại hedge cấu trúc | P400–P600 OI hàng chục nghìn–>100k, kỳ hạn xa, cách spot 16–44% | Tail hedge kinh điển — loại khỏi phân tích ngắn hạn |
| 4. Vẽ bản đồ walls | Hỗ trợ 710→700 (wall to nhất); kháng cự 715→720→730/740 | Kịch bản pin 710–715; thủng 710 trượt nhanh về 700; vượt 720 thoáng lên 730 |
| 5. Dự báo | Trung tính, dao động 705–720, gamma dày quanh 710–715 | |
| 6. Kiểm chứng | Phiên kế tiếp QQQ mở gap 725.55 (+1.8%) | Range bị phá bởi catalyst qua đêm. Nhưng các mức vẫn đúng vai trò: 715–720 sau khi bị xuyên trở thành hỗ trợ; put decay tailwind giải thích vì sao gap giữ được; kháng cự kế tiếp đúng bản đồ C730/C740 |

**Điểm mấu chốt**: dự báo dựa trên flow không đúng/sai kiểu đoán giá đóng cửa. Nó đúng khi các mức phản ứng hoạt động như mô tả (wall cản/đỡ, khoảng trống OI cho giá chạy nhanh, pin quanh gamma lớn) và khi khung if-then bao được diễn biến thực. Flow là bản đồ phản ứng, không phải quả cầu tiên tri.

## 15. Bẫy phổ biến và giới hạn phương pháp

| Bẫy | Vì sao sai | Cách phòng |
|---|---|---|
| "Put lớn = đánh xuống" | Đa số put chỉ số là bảo hiểm của người đang long | Xét strike/kỳ hạn/nhịp điệu (mục 5); loại tail hedge |
| Đọc một chân của multi-leg | Call bị bán có thể là nửa của collar bullish | Kiểm tra lệnh khớp cùng thời điểm, premium ròng |
| Đếm hợp đồng thay vì premium | 10.000 lô $0.05 nhỏ hơn 500 lô $20 | Luôn quy ra dollar premium |
| Coi volume 0DTE là positioning | 0DTE mở-đóng trong ngày, OI không giữ qua đêm | Volume cho intraday, OI (≥1 tuần) cho swing |
| Không chờ OI xác nhận | Lệnh lớn hôm nay có thể là đóng vị thế cũ | Chờ OI cập nhật sáng hôm sau: tăng = mở mới |
| So P/C với chuẩn tuyệt đối | Mỗi tài sản có mức bình thường riêng | So với lịch sử chính nó (z-score/percentile) |
| Tin flow dự đoán được tin tức | Gap 725.55 trong case study không hề có trong OI | Flow = bản đồ phản ứng; luôn quản trị rủi ro kịch bản ngược |
| Bỏ qua khả năng smart money cũng sai | Tổ chức hedge, tái cơ cấu, sai thường xuyên | Flow là một input xác suất, kết hợp price action + bối cảnh vĩ mô |
| Coi mọi print khổng lồ là tín hiệu | Box spread, deep ITM, dividend play, roll là nhiễu | Lọc theo mục 10 trước khi diễn giải |

## 16. Bộ luật suy luận if-then cho AI (machine-readable)

Khi đọc một snapshot chain mới, áp dụng tuần tự:

```
R1  IF volume(strike) > 2×OI(strike) AND expiry ≥ 1 tuần
    THEN đánh dấu "unusual", chờ OI hôm sau xác nhận (tăng ≈ volume → mở mới).

R2  IF put OTM > 15% khỏi spot AND expiry > 2 tháng AND OI lớn
    THEN gán nhãn TAIL_HEDGE, loại khỏi bias ngắn hạn.

R3  IF P/C_OI z-score(20 phiên) trong [-1.5, +1.5]
    THEN positioning bình thường, không suy luận hướng từ P/C.

R4  IF spot nằm giữa hai cụm OI lớn cách nhau < 1.5%
    THEN kịch bản chính = PIN giữa hai mức đó (khi dealer long gamma).

R5  IF giá vượt hẳn call wall (hoặc thủng put wall) và phía sau là khoảng trống OI
    THEN kỳ vọng di chuyển nhanh đến cụm OI kế tiếp.

R6  IF GEX ước tính < 0 (dưới gamma flip)
    THEN chế độ khuếch đại: trend/biến động mạnh, mean-reversion kém tin cậy.

R7  IF flow mua call ask-side + IV tăng ≥10% tương đối + expiry ≤ 2 tuần + premium ≥ $1M
    THEN tín hiệu cược tăng có xúc tác; kiểm chứng OI hôm sau (R1).

R8  IF print premium khổng lồ NHƯNG delta ≈ 1 HOẶC 4 chân cùng expiry HOẶC ngay trước ex-dividend
    THEN gán nhãn NOISE (stock-replacement/box/dividend), bỏ qua.

R9  IF volume lớn đồng thời ở (strike cũ, expiry gần) và (strike mới, expiry xa) cùng loại quyền
    THEN nhiều khả năng ROLL — không phải tiền mới.

R10 IF sự kiện vĩ mô (FOMC/CPI) chưa diễn ra
    THEN không đọc hướng từ flow trước sự kiện; ưu tiên flow sau khi IV crush.

R11 IF tuần trước OPEX tháng/quý AND không có tin xấu
    THEN thiên hướng drift-up/pin do charm+vanna; breakout sau OPEX đáng tin hơn trước OPEX.

R12 IF 0DTE: chỉ dùng volume theo strike cho intraday pin/hướng trong ngày;
    KHÔNG dùng OI 0DTE làm positioning.

R13 Mọi dự báo phải ở dạng if-then theo mức giá (wall, gap, flip) kèm cơ chế
    (gamma/vanna/charm/OI), và được chấm điểm ở phiên kế tiếp.
```

## 17. Schema dữ liệu crawl (mapping cho AI đọc file)

Dữ liệu nguồn: Cboe delayed quotes (trễ 15 phút), snapshot 20:00 giờ VN, lưu tại `data/options/<YYYY-MM-DD>/`.

| Cột | Ý nghĩa | Lưu ý khi suy luận |
|---|---|---|
| `bid`, `ask`, `last` | Giá quyền chọn | `last` gần ask → nghiêng mua chủ động (gần đúng) |
| `volume` | Hợp đồng khớp trong ngày | Realtime-ish; reset mỗi ngày |
| `open_interest` | OI | Là OI của phiên **trước** (OCC cập nhật qua đêm) — snapshot tối chụp OI cũ + volume phiên hiện tại |
| `delta`, `gamma`, `theta`, `vega` | Greeks | Dùng `gamma × OI` để tính GEX theo strike |
| `iv` | Implied volatility | So tương đối trong ngày và với lịch sử |
| `dollar_volume`, `dollar_open_interest` | Premium ước tính theo mid | Dùng để xếp hạng flow |
| `underlying_last` | Giá spot | Mốc tính moneyness/khoảng cách wall |
| `expiration`, `strike`, `option_type` | Định danh contract | |

Giới hạn đã biết: (1) không có time & sales từng lệnh kèm aggressor → không phân biệt sweep/block trực tiếp; (2) OI trễ một phiên; (3) GEX phải tự tính. Nâng cấp gợi ý: lưu chuỗi snapshot và tính delta-OI ngày-qua-ngày theo strike (phát hiện mở mới/roll); khi nghiêm túc hơn, thuê feed flow realtime có điều kiện khớp lệnh (CBOE LiveVol, Unusual Whales, FlowAlgo, OPRA).

## 18. Từ điển thuật ngữ (glossary)

| Thuật ngữ | Nghĩa |
|---|---|
| Aggressor side | Phía chủ động của giao dịch (khớp ask = mua chủ động, bid = bán chủ động) |
| ATM / ITM / OTM | At/In/Out of the money — strike bằng/có lợi/bất lợi so với spot |
| Call wall / Put wall | Strike có OI call/put vượt trội — vùng kháng cự/hỗ trợ cơ học |
| Charm | Tốc độ suy hao delta theo thời gian |
| Collar | Mua put + bán call để bảo hiểm vị thế cổ phiếu với chi phí thấp |
| Expected move | Biên độ thị trường định giá cho một sự kiện ≈ straddle ATM ÷ spot |
| Gamma flip | Mức giá mà GEX đổi dấu từ dương sang âm |
| GEX | Gamma exposure ước tính của dealer, quyết định chế độ nén/khuếch đại biến động |
| IV crush | IV sụp ngay sau sự kiện |
| IV rank/percentile | IV hiện tại so với range lịch sử của chính tài sản |
| OPEX | Ngày đáo hạn option tháng (thứ Sáu tuần 3) / quý |
| Pinning | Giá bị ghim quanh strike OI lớn do hedge của dealer |
| Risk reversal (25Δ RR) | IV call 25-delta trừ IV put 25-delta — thước đo skew |
| Roll | Đóng vị thế cũ mở vị thế mới xa hơn (strike/kỳ hạn) |
| Sweep / Block | Lệnh quét nhiều sàn khẩn cấp / khối lớn đàm phán trước |
| Tail hedge | Bảo hiểm thảm họa bằng put OTM rất sâu, kỳ hạn dài |
| Vanna | Độ nhạy delta theo IV — nguồn lực mua cơ học khi IV giảm |
| 0DTE | Option đáo hạn trong ngày |
