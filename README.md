# DFS Lab

Website học DFS trên ma trận 2 chiều, ưu tiên hình ảnh và thao tác trực tiếp.

Trang công khai: https://dfs-visual-lab.vercel.app/

## Có gì trên web

- Mô phỏng DFS trên lưới, có đường đang đi, ô đã thăm, ô quay lui.
- Từng bước, chạy và tạm dừng, tua lại, chỉnh tốc độ và thứ tự hướng.
- Tự xây bản đồ, đổi điểm S và E, thử mê cung hoặc bản đồ ngẫu nhiên.
- Ứng dụng trực quan: tìm lối ra, loang màu, đếm số đảo.
- 3 bài tập: đoán ô tiếp theo, chặn đường, đếm vùng.
- Mã giả và giải thích ngắn, đúng cơ chế đánh dấu và quay lui.
- Dùng được trên máy tính và điện thoại, không cần đăng nhập.

## Chạy trên máy

Mở index.html hoặc chạy:

    python -m http.server 8080

Sau đó truy cập http://localhost:8080.

Kiểm thử thuật toán:

    node test.cjs

## Tài liệu tham khảo

- VisuAlgo, Graph Traversal: https://visualgo.net/en/dfsbfs
- EntCS, Graph traversal visualiser: https://entcs.org/tools/graph-traversal-visualizer

Mọi hình minh họa và mã nguồn trang web được triển khai riêng cho DFS Lab.
## Giao diện vừa màn hình

- Chuyển giữa Mô phỏng, Ứng dụng, Bài tập và Giải thích bằng tab, không phải cuộn cả trang.
- Ma trận tự thu nhỏ theo kích thước và chiều cao màn hình.
- Trên điện thoại có nút Bản đồ / DFS giải thích; nút chạy luôn ở cuối khung.
- Các ứng dụng có nút chọn từng ví dụ, không cần vuốt tìm.
- Ở màn hình quá thấp, nội dung cuộn bên trong khu vực tương ứng để vẫn nhìn thấy thanh điều khiển.

## Mã DFS Python / C++

- Bấm Python hoặc C++ để đổi mã minh họa ngay trong mô phỏng.
- Dòng mã đang chạy sáng lên theo sự kiện thăm ô, gặp đích và quay lui.
- Nút Toàn bộ hiện chương trình chạy được với bản đồ, vị trí S/E và thứ tự 4 hướng đang chọn.
- Nút Sao chép lấy phiên bản đầy đủ để chạy trong Python hoặc trình biên dịch C++.
- Trên màn hình nhỏ, code tự xuống dòng và cuộn riêng trong panel.
