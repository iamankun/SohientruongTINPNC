export const CLS_OPTIONS = ['0', '1', '2', '3', '4', '5'];

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
  'TP-Link Archer C2',
  'TP-Link Archer C5',
  'G-93RG1',
  'G-97D2',
  'G-97RG3',
  'G-97C1',
  'G-97RG6M',
  'AC1000F',
  'AC1000FV2',
  'AC1000C',
  'AC1000CV2',
  'AC1000Z',
  'AC1000HI',
  'AX1800C',
  'AX1800GZ',
  'AX3000GZ',
  'AX3000GZV2',
  'AX3000CV2',
  'AX3000HI',
  'AX3000HV2',
  'AX3000S',
  'BE6500C (Hub)',
  'BE12000Z',
  'DrayTek Vigor 2912',
  'DrayTek Vigor 2925',
  'DrayTek Vigor 2927',
  'DrayTek Vigor 300B',
  'MikroTik RB760iGS',
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
  'AC1200C',
  'AC1200H',
  'AC1200Z',
  'AC1750',
  'H196A',
  'H3601P',
  'EN020-F5',
  'EC120-F5',
  'AX1500C',
  'AX1800AZ',
  'AX3000C',
  'AX3000CV2',
  'AX3000AZ',
  'AX3000S',
  'AX8000C',
  'Aruba Instant On AP11',
  'Aruba Instant On AP22',
  'UniFi AC Lite',
  'UniFi AC Pro',
  'BE6500C (Mesh)',
  'BE15000Z',
];

export const LEGACY_SINGLE_BAND_MODEMS = new Set([
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
  'G-97C1',
]);

export const ONT_EXTRA_ROUTERS = Array.from(
  new Set([
    ...TPLINK_ROUTERS.filter((m) => m !== 'Không dùng Router rời'),
    ...AP_MODELS.filter((m) => m !== 'Không'),
    'Không dùng thêm',
  ])
);

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

export type FaultGroupName = 'Internet' | 'FPT Play' | 'FPT Camera Combo';

export interface FaultSection {
  title?: string;
  items: string[];
}

export const FAULT_SECTIONS: Record<FaultGroupName, FaultSection[]> = {
  Internet: [
    {
      title: 'Tín hiệu quang & Kết nối mạng',
      items: [
        'Không có tín hiệu quang (MKN)',
        'Có tín hiệu quang nhưng không ổn định / suy hao không đạt chuẩn',
        'Có tín hiệu quang nhưng không có IP WAN',
        'Có tín hiệu quang nhưng không IP WAN',
        'Lỗi hệ thống - Có tín hiệu quang nhưng không IP WAN',
        'Có tín hiệu quang nhưng IP WAN 169.254.x.x',
        'Lỗi nhận IP 169.254.x.x',
        'Có IP WAN, không truy cập được',
        'Không truy cập được một số dịch vụ hoặc website',
        'Thiếu IP so với gói số IP tối đa của gói',
        'Chưa nhận đủ IP theo gói Đa phiên',
        'Rớt phiên kết nối liên tục / rớt định kỳ',
        'Ngưng kết nối do thiên tai',
        'Chủ động CSKH ngưng kết nối',
      ],
    },
    {
      title: 'Hiệu năng & Chất lượng truy cập',
      items: [
        'Truy cập mạng chậm hoặc chập chờn',
        'Băng thông thấp, không đủ',
        'Game Lag',
        'Truy cập các dịch vụ quốc tế chập chờn (Facebook, YouTube, TikTok, ...)',
      ],
    },
    {
      title: 'Wifi & Thiết bị đầu cuối',
      items: [
        'Wifi không thấy sóng',
        'Wifi sóng yếu hoặc chập chờn',
        'Wifi sóng tốt nhưng không kết nối được Wifi',
        'Wifi sóng tốt - kết nối được nhưng không truy cập được Internet',
        'Wifi sóng tốt - kết nối được nhưng truy cập chậm hoặc chập chờn',
        'Wifi KH bị lỗi mất tên Wifi và mật khẩu',
        'KH báo mất Modem',
      ],
    },
    {
      title: 'Yêu cầu, Hỗ trợ & Dịch vụ khác',
      items: [
        'KH yêu cầu đổi tên sóng / mật khẩu Wifi',
        'Đổi mật khẩu Wifi',
        'KH yêu cầu bật thêm IPv6',
        'KH yêu cầu tắt / bật IPv6',
        'KH yêu cầu di chuyển Modem',
        'KH yêu cầu di chuyển AP',
        'KH yêu cầu di chuyển dây thuê bao (Lastmile)',
        'KH cần thay / lắp đặt / cài đặt thiết bị Modem, AP, Box, Camera',
        'Hướng dẫn KH cấu hình cài đặt: Modem, AP, ...',
        'Hướng dẫn sử dụng các tính năng',
        'Lỗi App',
        'Lỗi App - Chưa xác định',
        'Không liên kết được hợp đồng',
        'KH yêu cầu bảo trì khác',
        'KH không cung cấp rõ tình trạng lỗi hoặc KH có khiếu nại RM',
        'Chương trình KH thân thiết',
        'Chương trình sự kiện',
        'Dịch vụ của đối tác (Mua bán, bảo dưỡng, ...)',
      ],
    },
  ],
  'FPT Play': [
    {
      items: [
        'Mất kết nối Camera',
        'Tự động đăng xuất tài khoản',
        'Chặn quyền truy cập nội dung',
        'Hình ảnh giật lag, vỡ hạt',
        'Mất tiếng hoặc mất hình',
        'Remote không nhận giọng nói',
        'Treo logo khởi động',
      ],
    },
  ],
  'FPT Camera Combo': [
    {
      title: 'Trạng thái Camera, NVR & Kết nối mạng',
      items: [
        '[CMR] Không lên nguồn',
        '[CMR] Không kết nối được mạng LAN / Wifi',
        '[CMR] KH xem camera báo ngoại tuyến (CMR ngoại tuyến)',
        '[CMR] Kết nối được LAN (Wifi) nhưng không đẩy lên được Cloud',
        '[CMR] Cam không tồn tại trên hệ thống',
        '[CMR] Không thể thêm được Camera',
        '[CMR-VMS] NVR ngoại tuyến',
        '[CMR-VMS] NVR không có ổ cứng',
        '[CMR-VMS] Conflict IP',
        'Lỗi thiết bị FPT Camera',
      ],
    },
    {
      title: 'Hình ảnh, Xem lại, Cảnh báo & Đàm thoại',
      items: [
        '[CMR] Không xem được live',
        '[CMR] Không xem lại được FULL',
        '[CMR] Không load được video khoảnh khắc',
        '[CMR] Có hình ảnh / Thumbnail trên video - video không xem được',
        '[CMR] Hình ảnh bị giật, xé hình, nhòe màu, chất lượng hình ảnh kém',
        '[CMR] Camera bị ám tím',
        '[CMR] Không có cảnh báo & clip chuyển động',
        '[CMR] Có cảnh báo về máy nhưng không có clip chuyển động',
        '[CMR] Cảnh báo nhận diện người không chính xác',
        '[CMR] Có vấn đề về đàm thoại (rè, hú, có tiếng nước sôi, loa bé, mic bé, ...)',
      ],
    },
    {
      title: 'Tài khoản, OTP, App & Quyền / Gói dịch vụ',
      items: [
        '[CMR-VMS] Sai tài khoản / mật khẩu',
        '[CMR-VMS] Doanh nghiệp đã đạt giới hạn số lượng',
        '[CMR] Mở lại tài khoản bị khóa cho SĐT quản lý dịch vụ',
        '[CMR] Xóa chủ sở hữu',
        '[CMR] KH không nhận được OTP',
        '[CMR] Lỗi đăng nhập - Không nhận được OTP',
        'Lỗi App - Lỗi đăng nhập',
        'Lỗi App - Không nhận được mã OTP',
        'Lỗi App - Xem camera báo lỗi ngoại tuyến',
        'Android (Box OTT, SmartTV, Mobile) mã lỗi - 1000002',
        '[CMR] Lỗi hiển thị thời hạn bảo hành trên App',
        '[CMR] KH đã thanh toán, HĐ đã nhận code, nhưng KH chưa nhận được code',
        '[CMR] Chuyển code Cloud HD OTT',
        '[CMR] Hướng dẫn kích license',
        'Migrate C sang B > Migrate sang app VMS',
        'Vi phạm chính sách CMR Buffet',
      ],
    },
    {
      title: 'Yêu cầu lắp đặt, Chỉnh sửa & Hướng dẫn',
      items: [
        'KH mua hoặc đổi thiết bị',
        '[CMR] KH cần thay / cài đặt / kết nối Camera',
        '[CMR] Replace SN khi triển khai',
        'KH yêu cầu di chuyển vị trí FPT Camera',
        '[CMR] KH có nhu cầu chỉnh góc Camera',
        '[CMR] KH cần hướng dẫn sử dụng Camera, App',
        'Hướng dẫn xem lại',
        'Hướng dẫn tải video',
        'KH không cung cấp rõ tình trạng lỗi hoặc KH có khiếu nại RM',
      ],
    },
  ],
};

export const FAULT_GROUPS: Record<FaultGroupName, string[]> = {
  Internet: FAULT_SECTIONS.Internet.flatMap((section) => section.items),
  'FPT Play': FAULT_SECTIONS['FPT Play'].flatMap((section) => section.items),
  'FPT Camera Combo': FAULT_SECTIONS['FPT Camera Combo'].flatMap((section) => section.items),
};

export const MAINTENANCE_FIELD_LABELS: Record<string, string> = {
  so_cls: '1. Số CLs (6 tháng gần nhất)',
  sdt_kh: '2. SĐT liên hệ KH',
  ten_kh: '2. Tên khách hàng',
  mo_hinh_nha: '3. Mô hình nhà',
  so_tang: '3. Số tầng hiện có',
  modem: '4. Modem',
  router_tp_link: '4. Router TP-Link / AP (kèm ONT)',
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
  toa_do: 'Tọa độ GPS',
  vi_do: 'Vĩ độ (Latitude)',
  kinh_do: 'Kinh độ (Longitude)',
  sai_so_m: 'Sai số định vị (mét)',
};
