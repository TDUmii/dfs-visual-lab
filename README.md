# DFS Lab

Website tiếng Việt học DFS trên ma trận 2 chiều, bắt đầu từ lý do cần thuật toán thay vì trình bày mã giả ngay.

Website: https://dfs-visual-lab.vercel.app/

## Cách học

1. Bắt đầu: tự đi trong mê cung nhỏ. Khi gặp ngõ cụt, quay lại và ghi nhớ ô đã thăm.
2. Xem DFS: máy thử từng hướng, giải thích vì sao chọn ô kế tiếp, đánh dấu và quay lui.
3. Ứng dụng: thoát mê cung, loang màu, đếm vùng liên thông.
4. Bài tập: dự đoán bước, chặn đường và đếm vùng.

## Tính năng

- Mê cung tương tác qua chạm ô, phím mũi tên và nút điều hướng.
- Mô phỏng các lựa chọn DFS (viền vàng), ô đã thăm và lần quay lui.
- Thay bản đồ, đặt điểm S/E, tua bước, dừng/chạy, điều chỉnh tốc độ và thứ tự hướng.
- Code Python / C++ nằm trong phần mở rộng, xem chương trình đầy đủ và sao chép.
- Desktop hiển thị bản đồ và lý do cạnh nhau; mobile có nút chuyển, bảng điều khiển cố định.
- Tối ưu font, kích thước chạm và tránh tràn ngang.

## Chạy

Mở index.html hoặc chạy `python -m http.server 8080`.

Kiểm tra thuật toán: `node test.cjs`.

Kiểm tra mã Python / C++ xuất ra (cần cài Python và g++): `node test-v5.cjs`.

## Tham khảo

- VisuAlgo: https://visualgo.net/en/dfsbfs
- CMU Search in Graphs: https://www.cs.cmu.edu/~15122/handouts/lectures/24-dfs.pdf

Mã và mô phỏng được tạo cho DFS Lab, không nhúng lại nội dung từ các trang tham khảo.