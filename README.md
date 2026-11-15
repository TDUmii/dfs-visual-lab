# DFS Lab

Website học DFS trên ma trận 2 chiều bằng tiếng Việt.

Website: https://dfs-visual-lab.vercel.app/

## Cách học

1. Bắt đầu: tự tìm lối ra mê cung, gặp ngõ cụt rồi quay lại.
2. Xem DFS: quan sát ô được chọn, ô đã thăm và lúc quay lui. Phần giải thích nói rõ nguyên nhân từng quyết định.
3. Học viết code: trong phần Xem DFS, mở tab Học viết code ở cột phải (máy tính) hoặc tab Code (điện thoại).
   - Xây từng phần: 6 phần từ tạo hàm, chặn tường, đánh dấu, kiểm tra đích, gọi đệ quy đến quay lui.
   - Code đang chạy: làm sáng dòng tương ứng với từng bước quan trọng của mô phỏng trên bản đồ.
   - Nhấn từng dòng để xem vì sao cần dòng đó.
   - Chuyển Python / C++, xem chương trình đầy đủ và sao chép mã chạy được.
4. Ứng dụng: mê cung, tô loang màu, đếm số đảo.
5. Bài tập: dự đoán bước, chặn đường và đếm vùng liên thông.

Các phần code đang xây là bản minh họa từng phần, chưa phải chương trình hoàn chỉnh. Nút Code đầy đủ hoặc Sao chép lấy chương trình có đủ phần khởi tạo và gọi hàm.

## Giao diện

- Font hệ thống hỗ trợ tiếng Việt và icon SVG.
- Desktop: bản đồ và phần giải thích/code nằm cạnh nhau.
- Điện thoại: chuyển nhanh giữa Bản đồ, Giải thích, Code.
- Code lớn và tự xuống dòng trên màn hình nhỏ.
- Điều khiển chạy từng bước, tua lại, thay đổi hướng và tốc độ.

## Chạy trên máy

Mở index.html trực tiếp hoặc chạy:

    python -m http.server 8080

Sau đó mở http://localhost:8080.

## Kiểm thử

    node test.cjs
    node test-v5.cjs
    node qa-v6.cjs

Bài kiểm tra mã thực thi cần Python và g++. QA trình duyệt dùng Chrome headless trên Windows, không chiếm chuột/bàn phím.

## Tài liệu tham khảo

- VisuAlgo: https://visualgo.net/en/dfsbfs
- CMU Search in Graphs: https://www.cs.cmu.edu/~15122/handouts/lectures/24-dfs.pdf

Mã và mô phỏng được phát triển riêng cho DFS Lab.
