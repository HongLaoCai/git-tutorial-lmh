# Sandbox thực hành Git

Các ví dụ bám đúng tình huống trong `docs.txt`. Mỗi lần chạy sẽ **tạo lại** thư mục sạch trong `examples/playground/` (không đụng slide / repo tut).

```bash
yarn make-example list          # danh sách
yarn make-example 8             # 1 tình huống
yarn make-example 2             # cả 2a, 2b, 2c
yarn make-example all           # tất cả
```

Rồi:

```bash
cd examples/playground/8
# đọc PRACTICE.md, làm theo lệnh trong tut
```

| id | Tình huống |
|---|---|
| `2a` `2b` `2c` | Quên tạo branch |
| `3a` `3b` | Pull không được vì local |
| `4a` `4b` | Bỏ / lấy lại file |
| `5a` `5b` | Commit thiếu file |
| `6a` `6b` | Commit nhầm `.env` |
| `7` | Quay lại commit cũ |
| `8` | MR conflict |
| `9` | Cherry-pick từ `dev` |
| `10` | Sửa commit message |
| `12` | Đổi tên branch |
| `13` | Xóa branch |
| `conflict` | Merge conflict (ours/theirs) |
| `cherry-pick` | Cherry-pick 1 commit |
