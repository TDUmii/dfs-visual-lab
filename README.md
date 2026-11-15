# DFS Visual Lab

Website tiếng Việt giúp học và luyện tập DFS (Depth-First Search) trên ma trận 2 chiều.

## Phiên bản V1

- Mô phỏng DFS từng bước, tự chạy / tạm dừng / tua lại và điều chỉnh tốc độ.
- Hiển thị thứ tự thăm ô, ô hiện tại, ngăn xếp đệ quy, quay lui và dòng mã giả.
- Sửa mê cung bằng cách đặt tường, xóa tường, di chuyển điểm S và E.
- Bản đồ cơ bản, mê cung ngoằn ngoèo, nhiều đảo, bản đồ trống và ngẫu nhiên.
- Thay đổi thứ tự duyệt 4 hướng; so sánh độ dài đường DFS với BFS ngắn nhất.
- 3 thử thách: tìm đường, chặn đường và đếm đảo (DFS flood fill).
- 3 câu hỏi trắc nghiệm có đáp án và giải thích.
- Responsive cho điện thoại, máy tính; không cần tài khoản hay backend.

## Chạy trên máy

Mở index.html trong trình duyệt hoặc chạy một web server tĩnh:

    python -m http.server 8080

Sau đó mở http://localhost:8080.

## Deploy

Dự án là website tĩnh (HTML/CSS/JavaScript), không cần build. Có thể deploy lên Vercel, Netlify hoặc GitHub Pages.

## Quy ước mô phỏng

- Toạ độ dùng chỉ số bắt đầu từ 0, định dạng (hàng, cột).
- Ô trống . được đi qua; ô tường # không được đi qua.
- DFS dùng đệ quy, đánh dấu ô ngay lần thăm đầu tiên.
- Mỗi sự kiện thăm / quay lui được lưu thành một frame để tua bước.
- DFS tìm một đường tới E chứ không đảm bảo đường ngắn nhất.
- Bài đếm đảo coi các ô trống nối theo bốn hướng là cùng một vùng liên thông.

## Cấu trúc

- index.html — giao diện học và phòng thí nghiệm.
- styles.css — phong cách, hoạt ảnh và responsive.
- app.js — DFS, BFS, thao tác bản đồ và bài luyện tập.
- favicon.svg — biểu tượng website.

## Giấy phép

MIT.