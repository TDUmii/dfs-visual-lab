# DFS Lab

Website học DFS trên ma trận 2 chiều bằng tiếng Việt.

Website: https://dfs-visual-lab.vercel.app/

## Nội dung bài học

- **Lý thuyết:** DFS là gì, vì sao cần đánh dấu ô đã thăm, biểu diễn mê cung bằng ma trận, tọa độ 4 hướng, điều kiện dừng, đệ quy và quay lui. Ví dụ 5 × 7 minh họa ngõ cụt, quay lui và đường tới đích trên cùng một bản đồ.
- **Xem DFS:** mô phỏng từng bước, giải thích vì sao chọn một ô, đánh dấu hay quay lui.
- **Học viết code:** chế độ xây hàm DFS qua 6 phần, giải thích từng dòng, Python và C++. Chế độ code đang chạy tô dòng đang thực hiện; có chương trình đầy đủ để sao chép.
- **Ứng dụng:** mê cung, flood fill và đếm vùng liên thông.
- **Bài tập:** dự đoán bước, chặn đường, đếm vùng.

Giao diện thích ứng máy tính, điện thoại và sử dụng icon SVG, font hỗ trợ tiếng Việt.

## Chạy tại máy

Mở index.html hoặc chạy:

    python -m http.server 8080

## Kiểm thử

    node test.cjs
    node test-v5.cjs
    node qa-v6.cjs
    node qa-v7.cjs

qa-v6 và qa-v7 sử dụng Chrome headless trên máy Windows.

## Tham khảo

- VisuAlgo: https://visualgo.net/en/dfsbfs
- CMU Search in Graphs: https://www.cs.cmu.edu/~15122/handouts/lectures/24-dfs.pdf

Mô phỏng và mã nguồn được phát triển riêng cho DFS Lab.
