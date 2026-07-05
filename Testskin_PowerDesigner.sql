/* 
==============================================================
   Tệp SQL dùng để Reverse Engineer vào PowerDesigner
   Dự án: Testskin
   Hướng dẫn dùng cho PowerDesigner:
   1. Mở PowerDesigner.
   2. Chọn File -> Reverse Engineer -> Database...
   3. Chọn DBMS là MySQL hoặc SQL Server. Nhấn OK.
   4. Trong tab "Selection", nhấn biểu tượng Add Files và chọn tệp .sql này.
   5. Nhấn OK. PowerDesigner sẽ tự động vẽ ra PDM.
   6. Từ PDM, bạn có thể chọn Tools -> Generate Conceptual Data Model (CDM) để có sơ đồ CDM hoàn chỉnh.
==============================================================
*/

CREATE TABLE "NGUOIDUNG" (
    "id" VARCHAR(255) NOT NULL,
    "ho" VARCHAR(255),
    "ten" VARCHAR(255),
    "ten_dang_nhap" VARCHAR(255),
    "mat_khau" VARCHAR(255),
    "ngay_sinh" DATE,
    "gioi_tinh" BOOLEAN,
    "dia_chi" TEXT,
    "so_dien_thoai" VARCHAR(20),
    "trang_thai" VARCHAR(50),
    PRIMARY KEY ("id")
);

CREATE TABLE "DIACHI_NGUOIDUNG" (
    "id" VARCHAR(255) NOT NULL,
    "nguoidung_id" VARCHAR(255),
    "ten_nguoi_nhan" VARCHAR(255),
    "so_dien_thoai" VARCHAR(20),
    "dia_chi" TEXT,
    "la_mac_dinh" BOOLEAN,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id")
);

CREATE TABLE "CHUCVU" (
    "id" VARCHAR(255) NOT NULL,
    "ten" VARCHAR(255),
    "mo_ta" TEXT,
    "quyen_han" TEXT,
    "trang_thai" VARCHAR(50),
    PRIMARY KEY ("id")
);

CREATE TABLE "NHANVIEN" (
    "id" VARCHAR(255) NOT NULL,
    "chucvu_id" VARCHAR(255),
    "ho_ten" VARCHAR(255),
    "ten_dang_nhap" VARCHAR(255),
    "email" VARCHAR(255),
    "mat_khau" VARCHAR(255),
    "gioi_tinh" BOOLEAN,
    "ngay_sinh" DATE,
    "dia_chi" TEXT,
    "so_dien_thoai" VARCHAR(20),
    "ngay_vao_lam" DATE,
    "ngay_nghi_viec" DATE,
    "trang_thai" VARCHAR(50),
    "remember_token" VARCHAR(100),
    "ngay_tao" DATETIME,
    "ngay_cap_nhat" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("chucvu_id") REFERENCES "CHUCVU"("id")
);

CREATE TABLE "THUONGHIEU" (
    "id" VARCHAR(255) NOT NULL,
    "ten" VARCHAR(255),
    "dia_chi" TEXT,
    PRIMARY KEY ("id")
);

CREATE TABLE "DANHMUC" (
    "id" VARCHAR(255) NOT NULL,
    "ten" VARCHAR(255),
    "mo_ta" TEXT,
    "trang_thai" VARCHAR(50),
    PRIMARY KEY ("id")
);

CREATE TABLE "NHACUNGCAP" (
    "id" VARCHAR(255) NOT NULL,
    "ten" VARCHAR(255),
    "dia_chi" TEXT,
    "so_dien_thoai" VARCHAR(20),
    "email" VARCHAR(255),
    "trang_thai" VARCHAR(50),
    PRIMARY KEY ("id")
);

CREATE TABLE "KHUYENMAI" (
    "id" VARCHAR(255) NOT NULL,
    "ma_khuyen_mai" VARCHAR(50),
    "ten" VARCHAR(255),
    "loai_giam_gia" VARCHAR(50),
    "gia_tri_giam" DECIMAL(18,2),
    "ngay_bat_dau" DATETIME,
    "ngay_ket_thuc" DATETIME,
    "gia_tri_don_toi_thieu" DECIMAL(18,2),
    "so_tien_giam_toi_da" DECIMAL(18,2),
    "gioi_han_su_dung" INT,
    "so_lan_da_dung" INT,
    "trang_thai" VARCHAR(50),
    PRIMARY KEY ("id")
);

CREATE TABLE "SANPHAM" (
    "id" VARCHAR(255) NOT NULL,
    "thuonghieu_id" VARCHAR(255),
    "danhmuc_id" VARCHAR(255),
    "ten_san_pham" VARCHAR(255),
    "gia" DECIMAL(18,2),
    "so_luong" INT,
    "han_su_dung" VARCHAR(50),
    "huong_dan_su_dung" TEXT,
    "loai_da" TEXT,
    "benh_ly" TEXT,
    "hinh_anh" TEXT,
    "gia_flash_sale" DECIMAL(18,2),
    "thoi_gian_ket_thuc_flash_sale" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("thuonghieu_id") REFERENCES "THUONGHIEU"("id"),
    FOREIGN KEY ("danhmuc_id") REFERENCES "DANHMUC"("id")
);

CREATE TABLE "HINHANH_SANPHAM" (
    "id" VARCHAR(255) NOT NULL,
    "sanpham_id" VARCHAR(255),
    "duong_dan_anh" TEXT,
    "la_anh_chinh" BOOLEAN,
    "ngay_tao" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "DONHANG" (
    "id" VARCHAR(255) NOT NULL,
    "nguoidung_id" VARCHAR(255),
    "nguoi_xu_ly_id" VARCHAR(255),
    "nguoi_giao_hang_id" VARCHAR(255),
    "khuyenmai_id" VARCHAR(255),
    "ngay_dat_hang" DATETIME,
    "ngay_xu_ly" DATETIME,
    "ngay_giao_hang" DATETIME,
    "diachi_giaohang_id" VARCHAR(255),
    "dia_chi_giao_hang" TEXT,
    "so_dien_thoai" VARCHAR(20),
    "trang_thai" VARCHAR(50),
    "don_vi_van_chuyen" VARCHAR(100),
    "ma_van_don" VARCHAR(100),
    "tong_tien_hang" DECIMAL(18,2),
    "so_tien_giam" DECIMAL(18,2),
    "tong_thanh_toan" DECIMAL(18,2),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id"),
    FOREIGN KEY ("nguoi_xu_ly_id") REFERENCES "NHANVIEN"("id"),
    FOREIGN KEY ("nguoi_giao_hang_id") REFERENCES "NHANVIEN"("id"),
    FOREIGN KEY ("diachi_giaohang_id") REFERENCES "DIACHI_NGUOIDUNG"("id"),
    FOREIGN KEY ("khuyenmai_id") REFERENCES "KHUYENMAI"("id")
);

CREATE TABLE "CHITIET_DONHANG" (
    "id" VARCHAR(255) NOT NULL,
    "donhang_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "so_luong" INT,
    "gia_luc_mua" DECIMAL(18,2),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("donhang_id") REFERENCES "DONHANG"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "THANHTOAN" (
    "id" VARCHAR(255) NOT NULL,
    "donhang_id" VARCHAR(255),
    "nguoidung_id" VARCHAR(255),
    "phuong_thuc_thanh_toan" VARCHAR(50),
    "trang_thai_thanh_toan" VARCHAR(50),
    "so_tien" DECIMAL(18,2),
    "ma_giao_dich" VARCHAR(255),
    "ngay_tao" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("donhang_id") REFERENCES "DONHANG"("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id")
);

CREATE TABLE "THEODOI_GIAOHANG" (
    "id" VARCHAR(255) NOT NULL,
    "donhang_id" VARCHAR(255),
    "trang_thai" VARCHAR(50),
    "vi_tri" TEXT,
    "mo_ta" TEXT,
    "thoi_gian" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("donhang_id") REFERENCES "DONHANG"("id")
);

CREATE TABLE "PHIEUNHAP" (
    "id" VARCHAR(255) NOT NULL,
    "nguoi_lap_phieu_id" VARCHAR(255),
    "ke_toan_id" VARCHAR(255),
    "thu_kho_id" VARCHAR(255),
    "nhacungcap_id" VARCHAR(255),
    "ngay_nhap" DATETIME,
    "ngay_hach_toan" DATETIME,
    "ngay_nhap_kho" DATETIME,
    "tong_tien" DECIMAL(18,2),
    "ghi_chu" TEXT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoi_lap_phieu_id") REFERENCES "NHANVIEN"("id"),
    FOREIGN KEY ("ke_toan_id") REFERENCES "NHANVIEN"("id"),
    FOREIGN KEY ("thu_kho_id") REFERENCES "NHANVIEN"("id"),
    FOREIGN KEY ("nhacungcap_id") REFERENCES "NHACUNGCAP"("id")
);

CREATE TABLE "CHITIET_PHIEUNHAP" (
    "id" VARCHAR(255) NOT NULL,
    "phieunhap_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "so_luong" INT,
    "gia_nhap" DECIMAL(18,2),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("phieunhap_id") REFERENCES "PHIEUNHAP"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "CHANDOAN" (
    "id" VARCHAR(255) NOT NULL,
    "nguoidung_id" VARCHAR(255),
    "duong_dan_anh" TEXT,
    "ket_qua" TEXT,
    "do_tin_cay" DECIMAL(5,2),
    "ghi_chu" TEXT,
    "trang_thai" VARCHAR(50),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id")
);

CREATE TABLE "GIOHANG" (
    "id" VARCHAR(255) NOT NULL,
    "nguoidung_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "so_luong" INT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "BINHLUAN" (
    "id" VARCHAR(255) NOT NULL,
    "nguoidung_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "diem_danh_gia" INT,
    "noi_dung" TEXT,
    "trang_thai" VARCHAR(50),
    "ngay_tao" DATETIME,
    "ngay_cap_nhat" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "GOIY_AI" (
    "id" VARCHAR(255) NOT NULL,
    "chandoan_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "ly_do" TEXT,
    "diem_tin_cay" DECIMAL(5,2),
    "ngay_tao" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("chandoan_id") REFERENCES "CHANDOAN"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "YEUTHICH" (
    "id" VARCHAR(255) NOT NULL,
    "nguoidung_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "ngay_tao" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nguoidung_id") REFERENCES "NGUOIDUNG"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "CHUDE" (
    "id" VARCHAR(255) NOT NULL,
    "ten" VARCHAR(255),
    "trang_thai" VARCHAR(50),
    "ngay_tao" DATETIME,
    "ngay_cap_nhat" DATETIME,
    PRIMARY KEY ("id")
);

CREATE TABLE "CHITIET_CHUDE" (
    "id" VARCHAR(255) NOT NULL,
    "chude_id" VARCHAR(255),
    "sanpham_id" VARCHAR(255),
    "ngay_tao" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("chude_id") REFERENCES "CHUDE"("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id")
);

CREATE TABLE "THANHPHAN" (
    "id" VARCHAR(255) NOT NULL,
    "ten" VARCHAR(255),
    "mo_ta" TEXT,
    "cong_dung" TEXT,
    "muc_do_an_toan" VARCHAR(50),
    "duong_dan_anh" TEXT,
    "ngay_tao" DATETIME,
    "ngay_cap_nhat" DATETIME,
    PRIMARY KEY ("id")
);

CREATE TABLE "THANHPHAN_SANPHAM" (
    "id" VARCHAR(255) NOT NULL,
    "sanpham_id" VARCHAR(255),
    "thanhphan_id" VARCHAR(255),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("sanpham_id") REFERENCES "SANPHAM"("id"),
    FOREIGN KEY ("thanhphan_id") REFERENCES "THANHPHAN"("id")
);

CREATE TABLE "CAUHINH_HETHONG" (
    "id" VARCHAR(255) NOT NULL,
    "khoa_cau_hinh" VARCHAR(255),
    "gia_tri" TEXT,
    "mo_ta" TEXT,
    "ngay_cap_nhat" DATETIME,
    PRIMARY KEY ("id")
);

CREATE TABLE "QUANG_CAO" (
    "id" VARCHAR(255) NOT NULL,
    "tieu_de" VARCHAR(255),
    "duong_dan_anh" TEXT,
    "duong_dan_lien_ket" TEXT,
    "vi_tri" VARCHAR(50),
    "trang_thai" VARCHAR(50),
    "ngay_tao" DATETIME,
    PRIMARY KEY ("id")
);

CREATE TABLE "LIEN_HE" (
    "id" VARCHAR(255) NOT NULL,
    "ho_ten" VARCHAR(255),
    "email" VARCHAR(255),
    "so_dien_thoai" VARCHAR(20),
    "tieu_de" VARCHAR(255),
    "noi_dung" TEXT,
    "trang_thai" VARCHAR(50),
    "ngay_gui" DATETIME,
    PRIMARY KEY ("id")
);

CREATE TABLE "LICHSU_HOATDONG" (
    "id" VARCHAR(255) NOT NULL,
    "nhanvien_id" VARCHAR(255),
    "hanh_dong" VARCHAR(255),
    "mo_ta_chi_tiet" TEXT,
    "thoi_gian" DATETIME,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("nhanvien_id") REFERENCES "NHANVIEN"("id")
);
