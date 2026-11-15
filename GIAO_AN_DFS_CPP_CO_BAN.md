# LỜI GIẢNG DFS TRÊN MẢNG 2 CHIỀU - C++ CƠ BẢN

**Thời lượng gợi ý:** 80-90 phút  
**Học sinh cần biết:** biến, if/else, for, hàm, chỉ số mảng một chiều và hai chiều. Chưa cần học vector, pair, auto, con trỏ hoặc STL.  
**Đích buổi học:** giải thích được vì sao DFS ra đời, mô tả được quay lui, tự viết hàm kiểm tra có đường từ S đến E và giải thích từng dòng.

## 1. Bài toán thực tế - 10 phút

**Giáo viên nói:**

> Trên màn hình là bản đồ 5 hàng, 7 cột. Ô dấu chấm là đường có thể đi, dấu thăng là tường. Điểm bắt đầu S ở (0,0), đích E ở (4,6). Máy tính cần trả lời câu hỏi: từ S có đi tới E được không?
>
> Nếu mình cứ thử bừa một hướng, mình có thể gặp ngõ cụt. Nếu quay về mà không nhớ ô đã đi, mình có thể qua lại giữa hai ô vô hạn. Vậy phải có một cách khám phá đường đi có hệ thống.

Bản đồ để minh họa trên bảng (S và E chỉ là ký hiệu vị trí, trong mảng code hai ô này vẫn là dấu chấm):

```text
S...###
.#####.
...##..
##..#..
......E
```

**Hỏi:** Đứng ở (0,0), nếu ưu tiên bên phải thì tới đâu?  
**Đáp án mong đợi:** Đi (0,1), (0,2), (0,3) rồi ngõ cụt.

**Giáo viên chốt:** DFS là Depth-First Search, nghĩa là tìm kiếm theo chiều sâu. Nó thử đi sâu một nhánh; nếu không đi tiếp được, nó quay lại nơi còn hướng chưa thử. Để khỏi đi lặp vô hạn, mỗi ô cần một dấu đã thăm.

## 2. Đọc tọa độ hàng, cột - 10 phút

**Giáo viên nói:**

> Chúng ta làm việc với ma trận, nên mỗi ô có hai chỉ số: hàng và cột. Ở C++, chỉ số bắt đầu từ 0. Đổi hàng nghĩa là lên hoặc xuống; đổi cột nghĩa là sang trái hoặc phải.

Trên ma trận, từ (2,1):
- Phải: (2,2), thay đổi (0,+1).
- Xuống: (3,1), thay đổi (+1,0).
- Trái: (2,0), thay đổi (0,-1).
- Lên: (1,1), thay đổi (-1,0).

**Giáo viên viết:**

```cpp
int huongHang[4] = {0, 1, 0, -1};
int huongCot[4] = {1, 0, -1, 0};
```

**Giáo viên nói:**

> Hai mảng này phải đọc cùng một chỉ số i. Với i = 0, thay đổi hàng 0 và cột +1 tức đi phải. Với i = 1, thay đổi hàng +1 và cột 0 tức đi xuống. Chúng ta không cần vector, chỉ cần hai mảng một chiều đã học.

**Hỏi nhanh:** Từ (3,3) đi xuống là (4,3) hay (3,4)?  
**Đáp án:** (4,3).

## 3. Khai báo bản đồ và đã thăm - 10 phút

```cpp
const int soHang = 5;
const int soCot = 7;

char banDo[soHang][soCot + 1] = {
    "....###",
    ".#####.",
    "...##..",
    "##..#..",
    "......."
};

bool daTham[soHang][soCot] = {false};
int dichHang = 4;
int dichCot = 6;
```

**Giáo viên nói:**

> banDo có 5 hàng. Mỗi hàng chứa 7 ký tự thật của bản đồ. Mình khai báo số cột là soCot + 1 vì đang khởi tạo mỗi hàng bằng một chuỗi ký tự, cần thêm một ô kết thúc chuỗi. Còn mảng daTham có đúng 5 × 7 phần tử bool.
>
> Lúc đầu, chưa thăm ô nào nên toàn bộ daTham là false. Khi đã bước vào một ô hợp lệ, ta đổi ô tương ứng thành true.

**Lưu ý sư phạm:** Không cần giải thích sâu về chuỗi C hoặc ký tự kết thúc ngay buổi này. Chỉ cần nêu lý do +1. Nếu học sinh chưa học char, có thể đổi bài tập sang bản đồ số 0 (đường), 1 (tường) ở buổi ôn sau.

**Hỏi:** Nếu đến ô (2,1) thì đánh dấu vị trí nào?  
**Đáp án:** daTham[2][1] = true.

## 4. Xây hàm DFS theo 6 phần - 25 phút

### Phần 1 - Một lời gọi hàm là một ô đang xét

```cpp
bool dfs(int hang, int cot) {
}
```

**Giáo viên nói:**

> dfs nhận tọa độ một ô. Giá trị trả về là bool: true nếu từ ô đó tìm được E, false nếu nhánh đang xét không tìm được E. Bây giờ mình chưa viết phần đi tiếp, vì trước hết phải ngăn lỗi.

### Phần 2 - Kiểm tra biên, tường và ô đã thăm

```cpp
if (hang < 0 || hang >= soHang || cot < 0 || cot >= soCot)
    return false;

if (banDo[hang][cot] == '#' || daTham[hang][cot])
    return false;
```

**Giáo viên nói:**

> Điều kiện đầu phải đặt trước, bởi nếu ô đã nằm ngoài bảng mà ta truy cập banDo[hang][cot] thì chương trình có thể đọc dữ liệu không hợp lệ.
>
> Điều kiện thứ hai chặn tường và chặn ô đã đi qua. return false ở đây chỉ có nghĩa là hướng này không đi tiếp được, KHÔNG có nghĩa cả mê cung chắc chắn không có đường.

**Hỏi:** Nếu dfs(-1,2) được gọi, hàm phải dừng ở đâu?  
**Đáp án:** Điều kiện kiểm tra biên đầu tiên.

### Phần 3 - Đánh dấu đã thăm

```cpp
daTham[hang][cot] = true;
```

**Giáo viên nói:**

> Chỉ cần đi vào ô hợp lệ một lần. Nếu không đánh dấu ngay, ô A gọi DFS sang B, B lại gọi về A rồi lại qua B. Như vậy máy sẽ lặp mãi.

### Phần 4 - Kiểm tra đích

```cpp
if (hang == dichHang && cot == dichCot)
    return true;
```

**Giáo viên nói:**

> Nếu đang đứng đúng tọa độ E, bài toán đã giải được. return true sẽ trả thông báo thành công cho lời gọi đang đợi trước đó.

### Phần 5 - Thử bốn hướng, gọi đệ quy

```cpp
for (int i = 0; i < 4; i++) {
    int hangMoi = hang + huongHang[i];
    int cotMoi = cot + huongCot[i];

    if (dfs(hangMoi, cotMoi)) {
        return true;
    }
}
```

**Giáo viên nói:**

> Tại một ô, for thử bốn hướng. Ví dụ đang ở (0,0), i=0 thì hàm gọi dfs(0,1). Nếu ô đó hợp lệ nhưng chưa đến E, hàm dfs(0,1) lại tự gọi tiếp một ô khác. Việc một hàm gọi lại chính nó gọi là đệ quy.
>
> Lưu ý: khi máy đang xử lý dfs(0,1), lời gọi dfs(0,0) chưa biến mất. Nó đang chờ kết quả để biết có nên thử hướng kế tiếp hay không.

### Phần 6 - Quay lui

```cpp
return false;
```

**Giáo viên nói:**

> return false cuối hàm chỉ được chạy nếu bốn hướng đều không đưa tới E. Lời gọi hiện tại kết thúc, máy quay về hàm đã gọi nó và thử hướng khác trong vòng for.
>
> Ta KHÔNG đặt daTham[hang][cot] trở lại false khi quay lui trong bài tìm đường này. Ô đã thăm rồi thì không cần khám phá lại, tránh lặp đường và chạy chậm.

**Câu kiểm tra then chốt:** return false trong dfs(0,3) có làm chương trình kết thúc toàn bộ không?  
**Đáp án:** Không. Nó quay lại dfs(0,2), rồi có thể quay tới các lời gọi trước nữa. Chỉ khi dfs(0,0) cũng đã thử hết mọi hướng mà không tìm được E thì cả bài mới kết luận thất bại.

## 5. Chạy tay trên bản đồ - 10 phút

Giả sử thứ tự 4 hướng là Phải, Xuống, Trái, Lên.

- Bắt đầu dfs(0,0), đánh dấu (0,0).
- Đi phải: dfs(0,1), dfs(0,2), dfs(0,3).
- Tại (0,3): phải là tường, xuống là tường, trái đã thăm, lên ra ngoài bảng. Hàm trả false.
- Lần lượt quay lui từ (0,3) về (0,2), (0,1), rồi (0,0). Các ô cũ vẫn có daTham = true.
- Tại (0,0), thử hướng xuống: (1,0), (2,0), (2,1), (2,2), (3,2), (3,3), (4,3), (4,4), (4,5), (4,6).
- Đến E: trả true. Kết quả true truyền ngược cho toàn bộ các lời gọi đang đợi.

**Giáo viên hỏi:** DFS có bảo đảm đường ngắn nhất không?  
**Đáp án:** Không. DFS phù hợp tìm đường tồn tại/khám phá vùng. Nếu cần đường ít bước nhất trên lưới không trọng số, thường dùng BFS.

## 6. Code C++ hoàn chỉnh - 10 phút

```cpp
#include <iostream>
using namespace std;

const int soHang = 5;
const int soCot = 7;

char banDo[soHang][soCot + 1] = {
    "....###",
    ".#####.",
    "...##..",
    "##..#..",
    "......."
};

bool daTham[soHang][soCot] = {false};

int huongHang[4] = {0, 1, 0, -1};
int huongCot[4] = {1, 0, -1, 0};

int dichHang = 4;
int dichCot = 6;

bool dfs(int hang, int cot) {
    if (hang < 0 || hang >= soHang || cot < 0 || cot >= soCot)
        return false;

    if (banDo[hang][cot] == '#' || daTham[hang][cot])
        return false;

    daTham[hang][cot] = true;

    if (hang == dichHang && cot == dichCot)
        return true;

    for (int i = 0; i < 4; i++) {
        int hangMoi = hang + huongHang[i];
        int cotMoi = cot + huongCot[i];

        if (dfs(hangMoi, cotMoi)) {
            return true;
        }
    }

    return false;
}

int main() {
    if (dfs(0, 0)) {
        cout << "Tim thay duong di" << endl;
    } else {
        cout << "Khong co duong di" << endl;
    }

    return 0;
}
```

**Chốt kỹ thuật:** Chương trình trên chỉ in ra có/không có đường, không in danh sách tọa độ đường đi. Website còn trực quan hóa đường đi vì phần mô phỏng lưu ngăn xếp các ô. Đó là tính năng bổ sung, không phải điều kiện bắt buộc của bài cơ bản.

## 7. Luyện tập và đánh giá cuối buổi - 10 phút

**Bài 1 (dễ):** Đổi thứ tự sang Xuống, Phải, Trái, Lên bằng hai mảng hướng. Theo dõi số ô được thăm và so sánh đường DFS.  
**Gợi ý:** `huongHang = {1,0,0,-1}` và `huongCot = {0,1,-1,0}`.

**Bài 2 (dễ):** Chặn ô (1,0) thành tường. Chương trình còn đến E được không?  
**Đáp án:** Không. Nhánh đi phải ở hàng 0 là ngõ cụt, nhánh đi xuống tại S đã bị chặn.

**Bài 3 (trung bình):** Thêm biến `int demO = 0;` ở ngoài hàm và tăng `demO++` ngay sau khi đánh dấu ô. In số ô đã thăm sau khi gọi dfs. Hỏi vì sao không tăng biến ở đầu hàm?  
**Đáp án:** Đầu hàm có thể nhận tường, ô ngoài biên hoặc ô đã thăm; như vậy sẽ đếm sai.

**Bài 4 (củng cố):** Học sinh giải thích tác dụng của 4 câu lệnh: `return false` lúc vượt biên, `daTham[hang][cot] = true`, `dfs(hangMoi,cotMoi)`, `return false` cuối hàm. Mục tiêu là phân biệt thất bại của một nhánh với thất bại của toàn bộ bài toán.

**Tiêu chí hoàn thành:** Học sinh viết lại được hàm dfs, giải thích đúng thứ tự kiểm tra biên -> tường/đã thăm -> đánh dấu -> đích -> thử hướng -> quay lui, và tự thực hiện được bài 2.

## Điều giáo viên nên tránh

Không bắt học sinh ghi nhớ code nguyên khối ngay. Mỗi lần chỉ thêm một điều kiện hoặc một lời gọi mới; sau đó chạy mô phỏng để nhìn thấy tác dụng. Không giới thiệu vector, stack STL hoặc các cách cài đặt tối ưu khác trong cùng buổi; hiểu đệ quy và đánh dấu đã thăm đã là mục tiêu đủ lớn.
