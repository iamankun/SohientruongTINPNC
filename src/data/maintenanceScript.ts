export const CLS_OPTIONS = ['1', '2', '3', '4', '5'];

export const HOUSE_MODELS = [
  'Nhà cấp 1',
  'Nhà cấp 2',
  'Nhà cấp 3',
  'Nhà cấp 4',
  'CTY',
  'Xưởng',
];

export const FLOOR_COUNTS = ['1', '2', '3', '4', '5', '<6'];

export const MODEM_MODELS = [
  'ONT',
  'TP-Link TD-8817',
  'TP-Link TD-8840T',
  'Zyxel P-660H',
  'Comtrend CT-5361T',
  'TP-Link TL-WR740N',
  'TP-Link TL-WR841N',
  'EP9108W-4FE',
  'G-93RG1',
  'G-97D2',
  'G-97RG3',
  'G-97C1',
  'G-97RG6M',
  'TP-Link Archer C2',
  'TP-Link Archer C5',
  'AC1000F',
  'AC1000F V2',
  'AC1000C',
  'AC1000C V2',
  'AC1000Z',
  'AC1750',
  'AC1200Z',
  'AX1800GZ',
  'AX1800AZ',
  'AX3000GZ',
  'AX3000GZV2',
  'AX3000CV2',
  'AX3000HV2',
  'AX3000S',
  'AX1500C',
  'AX3000C',
  'BE6500C',
  'BE12000Z',
  'BE15000Z',
];

export const TPLINK_ROUTERS = [
  'TP-Link TD-8817',
  'TP-Link TD-8840T',
  'TP-Link TL-WR740N',
  'TP-Link TL-WR841N',
  'TP-Link Archer C2',
  'TP-Link Archer C5',
  'Không dùng Router rời',
];

export const AP_MODELS = [
  'Không',
  'TP-Link TL-WR740N',
  'TP-Link TL-WR841N',
  'TP-Link Archer C2',
  'TP-Link Archer C5',
  'AC1200H',
  'AC1200Z',
  'H196A',
  'AC1750',
  'AX1500C',
  'AX1800AZ',
  'AX3000C',
  'AX3000CV2',
  'AX3000AZ',
  'AX3000S',
  'H3601P',
  'AX8000C',
  'Aruba Instant On AP11',
  'Aruba Instant On AP22',
  'BE6500C',
  'BE15000Z',
];

export const BOX_MODELS = [
  'Không',
  'FPT Play HD',
  'FPT TV 4K',
  'FPT TV 4K FX6',
  'FPT Play Box S335',
  'FPT Play Box+ S400',
  'FPT Play Box+ S550',
  'FPT Play Box+ T550',
  'FPT Play Box S',
  'FPT Play Box T650',
  'FPT Play Box S650',
];

export const DEVICE_TOTAL_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '<11',
];

export type FaultGroupName = 'Internet' | 'FPT Play' | 'FPT Life';

export const FAULT_GROUPS: Record<FaultGroupName, string[]> = {
  Internet: [
    'Mất tín hiệu quang (mkn)',
    'Có sóng nhưng không có mạng',
    'Mạng chậm, ping cao',
    'Không kết nối được Wi-Fi',
    'Rớt mạng AP',
    'Modem mất nguồn',
    'Có tín hiệu quang nhưng không có IP',
  ],
  'FPT Play': [
    'Mất kết nối Camera',
    'Tự động đăng xuất tài khoản',
    'Chặn quyền truy cập nội dung',
    'Hình ảnh giật lag, vỡ hạt',
    'Mất tiếng hoặc mất hình',
    'Remote không nhận giọng nói',
    'Treo logo khởi động',
  ],
  'FPT Life': [
    'Camera báo ngoại tuyến',
    'Không quét được mã QR',
    'Lỗi xem lại lịch sử Cloud',
    'Báo động chuyển động giả',
    'Ban đêm mờ, lóa hồng ngoại',
    'Đàm thoại 2 chiều vọng tiếng',
  ],
};

export const MAINTENANCE_FIELD_LABELS: Record<string, string> = {
  so_cls: '1. Số CLs (6 tháng gần nhất)',
  sdt_kh: '2. SĐT liên hệ KH',
  ten_kh: '2. Tên khách hàng',
  mo_hinh_nha: '3. Mô hình nhà',
  so_tang: '3. Số tầng hiện có',
  modem: '4. Modem',
  router_tp_link: '4. Router TP-Link (kèm ONT)',
  ap: '4. Thiết bị AP',
  box: '4. Thiết bị Box',
  tong_thiet_bi: '5. Tổng thiết bị SD',
  nhom_loi: '6. Nhóm dịch vụ lỗi',
  nguyen_nhan_loi: '6. Nguyên nhân lỗi',
  phuong_an_xu_ly: '7. Phương án xử lý',
  tool_my_bao: '8. TOOL Mỹ bảo',
  da_co_ap: '8. KH đã có AP chưa',
  muon_lap_ap: '8. KH muốn lắp / lắp thêm AP',
  can_trang_bi_md_ap: '9. KH cần trang bị MD/AP',
  dong_y_mua_md_ap: '10. KH đồng ý mua thêm MD/AP',
  ktv_lap_ap_se: '11. KTV chủ động lắp AP SE',
};
