# DFS Lab

Trang học DFS trên ma trận 2 chiều bằng tiếng Việt.

Website: https://dfs-visual-lab.vercel.app/

## Nội dung

- Lý thuyết: bài toán tìm đường, quy tắc 4 hướng, mảng đã thăm, đệ quy, quay lui, độ phức tạp và ba trạng thái minh họa.
- Xem DFS: mô phỏng các lựa chọn, ô đã thăm, đường đang đi và nhánh quay lui.
- Học viết code: xây từng phần hoặc xem code chạy, tô dòng tương ứng, giải thích từng dòng, hỗ trợ Python và C++.
- Ứng dụng: tìm đường, loang màu và đếm vùng liên thông.
- Bài tập: dự đoán bước, chặn đường và đếm vùng.

## Không gian code

- Khi mở Học viết code, bản đồ thu về khoảng 39% chiều ngang và panel code mở rộng tới khoảng 61% trên desktop.
- Trong chế độ Code đang chạy, giải thích thu gọn thành một thanh trạng thái; phần code chiếm toàn bộ diện tích còn lại.
- Nút Mở rộng ẩn bản đồ và cho code toàn bộ chiều ngang; Thu gọn khôi phục ma trận.
- Bên trong code có thanh cuộn riêng, tự theo dòng được tô sáng; vùng điều khiển DFS không bị đẩy khỏi màn hình.
- Trên điện thoại, tab Code chiếm trọn vùng làm việc và hỗ trợ Python/C++.
- Nút Code đầy đủ hiển thị chương trình hoàn chỉnh; Sao chép xuất mã chạy được.

## Chạy

Mở index.html trong trình duyệt hoặc chạy:

    python -m http.server 8080

## Kiểm thử

    node test.cjs
    node test-v5.cjs
    node qa-v6.cjs
    node qa-v7.cjs
    node qa-v8.cjs

Kiểm thử giao diện sử dụng Chrome headless trên Windows, không chiếm chuột/bàn phím.

## Tham khảo

- VisuAlgo: https://visualgo.net/en/dfsbfs
- CMU Search in Graphs: https://www.cs.cmu.edu/~15122/handouts/lectures/24-dfs.pdf
