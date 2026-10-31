# Time Pressure — Android App

Phiên bản Android độc lập cho game **Time Pressure**, được đóng gói tối ưu với Jetpack Compose & WebView tăng tốc phần cứng, cùng hệ thống **Tự động cập nhật (In-App Auto Update)** tương tự như ứng dụng `con-say`.

## 🚀 Tính năng nổi bật

1. **Giao diện & Gameplay nguyên bản:**
   - Đồng bộ 100% logic, âm thanh Web Audio, 60 câu hỏi, animation lắp ráp và theme Cyber Noir từ bản web.
   - Chế độ toàn màn hình **Immersive Mode** loại bỏ hoàn toàn thanh trạng thái/điều hướng của hệ điều hành, cho trải nghiệm như game native.
   - Không giật lag, phản hồi cảm ứng tức thì.

2. **Cơ chế tự động cập nhật (Giống app `con-say`):**
   - Sử dụng [`AppUpdater.kt`](file:///c:/Users/HP/Desktop/press/android/app/src/main/java/com/timepressure/game/core/AppUpdater.kt) để tự động gọi GitHub Releases API (`https://api.github.com/repos/{repo}/releases/latest`).
   - Khi có bản APK mới hơn phiên bản hiện tại, app sẽ tự hiển thị một banner thông báo với ghi chú phát hành.
   - Người dùng bấm **"Cập nhật ngay"**, app sẽ dùng `DownloadManager` tải file APK về và tự động mở trình cài đặt Android (`FileProvider`).

3. **CI/CD Tự động hóa qua GitHub Actions:**
   - File cấu hình [`build-apk.yml`](file:///c:/Users/HP/Desktop/press/.github/workflows/build-apk.yml) tự động build APK và tạo GitHub Release mỗi khi bạn push code lên nhánh `main`.
   - Sử dụng keystore cố định [`debug.keystore`](file:///c:/Users/HP/Desktop/press/android/keystore/debug.keystore) để các bản cập nhật có cùng chữ ký số, cho phép cài đè trực tiếp mà không cần gỡ bản cũ.

---

## 🛠️ Cấu hình GitHub Repository

Mặc định repo đang trỏ tới:
```kotlin
// Trong AppUpdater.kt
var githubRepo: String = "Nagaruu/timepressure"
```
Khi bạn tạo repository trên GitHub (ví dụ: `https://github.com/Nagaruu/timepressure`), hệ thống GitHub Actions sẽ tự động biên dịch file `app-debug.apk` và gắn vào Release để ứng dụng tự tải về.

Ngoài banner tự động khi có bản mới, trang chủ còn có nút **Cập nhật phần mềm** ở góc phải trên để kiểm tra thủ công. Nếu đang dùng bản mới nhất, app sẽ thông báo; nếu có bản mới, banner tải và cài đặt sẽ hiện ra.

