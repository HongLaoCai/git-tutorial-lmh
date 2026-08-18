# Sandbox thực hành Git

Các ví dụ bám đúng tình huống trong `docs.txt`. Sandbox nằm trong repo slide nên panel Changes của Cursor **không hiện** file bạn đang sửa.

## Cách thấy Changes + branch

1. Cursor: **File → Open Workspace from File…** → chọn `thuc-hanh.code-workspace`
2. Explorer bên trái có folder **02 Sandbox đang làm**
3. Source Control: bấm **tên repo** phía trên (thường đang là `git-tutorial-lmh`) → chọn repo sandbox (`2a`, `8`, …)
4. Chạy `yarn practice 2a` và mở file `THEO_DOI.md` — báo ĐÚNG / CHƯA XONG

```bash
yarn practice 2a          # theo dõi live
yarn check-example 2a     # kiểm tra 1 lần
```


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
