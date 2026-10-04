# RHINOLOG - Sổ tay Lâm sàng & Nghiên cứu Mũi Xoang (Offline PWA)

Phần mềm chuyên biệt dành cho bác sĩ Tai Mũi Họng & phẫu thuật viên mũi xoang: hỗ trợ ghi nhận ca bệnh, phẫu thuật, đối soát dữ liệu nghiên cứu và phân tích đa biến số lâm sàng. Hoạt động ngoại tuyến 100% (Offline First) trên cả máy tính và điện thoại thông qua công nghệ Progressive Web App (PWA).

---

## 🌟 Tính Năng Nổi Bật

- **Ghi ca bệnh toàn diện (Comprehensive Case Wizard)**:
  - Thông tin hành chính, mã bệnh án bảo mật mã hoá.
  - Khám lâm sàng trước mổ: SNOT-22, Lund-Kennedy, phân độ Polyp mũi.
  - Phân tích CT Scan Mũi Xoang: Bảng tính điểm **Lund-Mackay Score** trực quan từng xoang (Hàm, Sàng trước/sau, Trán, Bướm, Phức hợp lỗ thông ngách).
  - Tường trình phẫu thuật (Intra-operative): Các bước phẫu thuật FESS, biến chứng, tai biến, phương pháp cầm máu.
  - Theo dõi sau mổ & Đánh giá kết quả (Post-operative).
  - Đính kèm và lưu trữ hình ảnh nội soi, lát cắt CT trực tiếp trong ca bệnh.

- **Đối soát Dữ liệu Nghiên cứu (Data Reconciliation & Audit)**:
  - Tự động phát hiện các điểm bất thường, mâu thuẫn số liệu (ví dụ: điểm Lund-Mackay không khớp với chẩn đoán, thiếu dữ liệu theo dõi sau mổ, v.v.).
  - Giúp số liệu đạt độ chuẩn xác cao nhất trước khi báo cáo khoa học hoặc viết luận văn.

- **Thống kê & Trực quan hoá (Analytics Dashboard)**:
  - Biểu đồ phân bố độ tuổi, giới tính, tỷ lệ mắc các thể viêm mũi xoang.
  - Thống kê tương quan điểm triệu chứng SNOT-22 trước và sau phẫu thuật.
  - Thống kê vị trí giải phẫu can thiệp và phân bố điểm CT.

- **Offline-First & Bảo mật Tuyệt đối**:
  - Lưu trữ cơ sở dữ liệu trên máy người dùng thông qua **IndexedDB (Dexie.js)**.
  - Không gửi dữ liệu bệnh nhân lên server trung gian trái phép.
  - Công cụ **Xuất / Nhập JSON & Excel** đầy đủ giúp dễ dàng sao lưu, di chuyển dữ liệu giữa các máy tính cá nhân.

---

## 🌐 Cách Xem & Chạy Trực Tiếp Trên GitHub (Không Cần Cài Đặt)

### Cách 1: Bật GitHub Pages (Chạy như một trang web công khai)
Dự án đã được cấu hình sẵn **GitHub Actions** tự động deploy:
1. Đẩy code lên GitHub.
2. Trên trang GitHub repo, vào **Settings** -> **Pages**.
3. Tại mục **Build and deployment** -> **Source**, chọn **GitHub Actions**.
4. GitHub sẽ tự động build và cung cấp cho bạn một link chạy trực tiếp dạng:  
   `https://<tên-user-github>.github.io/<tên-repo>/`

### Cách 2: Chạy trực tiếp qua GitHub Codespaces (Dành cho nhà phát triển)
1. Trong trang repo GitHub của bạn, bấm nút **Code** màu xanh -> chọn tab **Codespaces** -> bấm **"Create codespace on main"** (hoặc chỉ cần gõ phím `.` trên bàn phím).
2. GitHub sẽ mở một giao diện lập trình trực tiếp trên trình duyệt.
3. Chạy `npm run dev` trong terminal tích hợp, GitHub sẽ mở port xem thử ứng dụng ngay lập tức!

---

## 🚀 Cài Đặt & Chạy Trên Máy Cá Nhân

### Yêu cầu môi trường
- [Node.js](https://nodejs.org/) phiên bản 18.0 trở lên.
- Quản lý gói: `npm` hoặc `bun` / `yarn`.

### Các bước cài đặt

1. **Clone mã nguồn về máy:**
   ```bash
   git clone <URL_REPO_GITHUB_CUA_BAN>
   cd <thu-muc-du-an>
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Chạy ứng dụng ở môi trường phát triển (Development):**
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập: `http://localhost:3000`

4. **Đóng gói phiên bản Production:**
   ```bash
   npm run build
   ```

---

## 📱 Cài Đặt Dưới Dạng App (PWA) Trên Điện Thoại & Máy Tính

Ứng dụng hỗ trợ PWA đầy đủ:
- **Trên Google Chrome (Windows, macOS, Android):** Mở liên kết ứng dụng, bấm vào biểu tượng "Cài đặt ứng dụng" trên thanh địa chỉ trình duyệt.
- **Trên Safari (iOS / iPadOS):** Bấm nút **Chia sẻ** (Share) -> Chọn **"Thêm vào Màn hình chính"** (Add to Home Screen).

---

## 📂 Cấu Trúc Dự Án

```
├── public/                 # Icon, manifest PWA
├── src/
│   ├── components/         # Các khối giao diện chính
│   │   ├── CaseForm/       # Form nhập liệu từng bước & sơ đồ Lund-Mackay
│   │   ├── AnalyticsView/  # Biểu đồ thống kê nghiên cứu
│   │   ├── DataReconciliation/ # Hệ thống đối soát & kiểm tra logic dữ liệu
│   │   └── DataBackupModal/    # Sao lưu & phục hồi dữ liệu JSON/Excel
│   ├── db/                 # Cơ sở dữ liệu IndexedDB (Dexie)
│   ├── types/              # Định nghĩa cấu trúc dữ liệu y khoa TypeScript
│   ├── utils/              # Công cụ tính điểm, kiểm toán dữ liệu và xuất file
│   └── App.tsx             # Luồng điều hướng và giao diện chính
└── package.json
```

---

## 🔒 Bản Quyền & Trách Nhiệm Sử Dụng
Phần mềm phục vụ mục đích học tập, quản lý ca bệnh lâm sàng cá nhân và nghiên cứu khoa học Tai Mũi Họng. Người dùng chịu trách nhiệm tuân thủ các quy định về bảo mật thông tin cá nhân của người bệnh theo quy định y tế hiện hành.
