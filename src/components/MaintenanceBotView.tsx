import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Check, Copy, LogIn, MapPin, RotateCcw, Send, Undo2 } from 'lucide-react';
import {
  AP_MODELS,
  BOX_MODELS,
  CLS_OPTIONS,
  DEVICE_TOTAL_OPTIONS,
  FAULT_GROUPS,
  FLOOR_COUNTS,
  HOUSE_MODELS,
  MODEM_MODELS,
  ONT_EXTRA_ROUTERS,
  type FaultGroupName,
} from '../data/maintenanceScript';
import { getTodayIsoDate } from '../defaults';
import { createRecord } from '../services/firestoreService';
import type { Category } from '../types';

type BotStepId =
  | 's1_cls'
  | 's2a_phone'
  | 's2b_name'
  | 's3a_house'
  | 's3b_floors'
  | 's4a_modem'
  | 's4b_router'
  | 's4c_ap'
  | 's4d_box'
  | 's5_devices'
  | 's6a_fault_group'
  | 's6b_fault_detail'
  | 's7_resolution'
  | 's8a_tool_my_bao'
  | 's8b_has_ap'
  | 's8c_want_ap'
  | 's9_need_md_ap'
  | 's10_agree_buy'
  | 's11_ktv_install'
  | 's12_location'
  | 'done';

interface MaintenanceAnswers {
  so_cls?: string;
  sdt_kh?: string;
  ten_kh?: string;
  mo_hinh_nha?: string;
  so_tang?: string;
  modem?: string;
  router_tp_link?: string;
  ap?: string;
  box?: string;
  tong_thiet_bi?: string;
  nhom_loi?: FaultGroupName;
  nguyen_nhan_loi?: string;
  phuong_an_xu_ly?: string;
  tool_my_bao?: string;
  da_co_ap?: string;
  muon_lap_ap?: string;
  can_trang_bi_md_ap?: string;
  dong_y_mua_md_ap?: string;
  ktv_lap_ap_se?: string;
  toa_do?: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

interface HistorySnapshot {
  step: BotStepId;
  answers: MaintenanceAnswers;
  messages: ChatMessage[];
}

interface MaintenanceBotViewProps {
  user: User | null;
  category: Category;
  onRequireAuth: () => void;
  onSaved: () => void;
}

const STEP_NUMBER_MAP: Record<BotStepId, number> = {
  s1_cls: 1,
  s2a_phone: 2,
  s2b_name: 2,
  s3a_house: 3,
  s3b_floors: 3,
  s4a_modem: 4,
  s4b_router: 4,
  s4c_ap: 4,
  s4d_box: 4,
  s5_devices: 5,
  s6a_fault_group: 6,
  s6b_fault_detail: 6,
  s7_resolution: 7,
  s8a_tool_my_bao: 8,
  s8b_has_ap: 8,
  s8c_want_ap: 8,
  s9_need_md_ap: 9,
  s10_agree_buy: 10,
  s11_ktv_install: 11,
  s12_location: 12,
  done: 12,
};

function normalizeVnPhone(raw: string): string {
  const cleaned = raw.replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+840')) {
    return `0${cleaned.slice(4)}`;
  }
  if (cleaned.startsWith('+84')) {
    return `0${cleaned.slice(3)}`;
  }
  if (cleaned.startsWith('84') && cleaned.length >= 11) {
    return `0${cleaned.slice(2)}`;
  }
  return cleaned;
}

function getPromptForStep(step: BotStepId, answers: MaintenanceAnswers): string {
  switch (step) {
    case 's1_cls':
      return '1. Số CLs trong 6 tháng gần nhất của khách hàng là bao nhiêu?';
    case 's2a_phone':
      return '2. Nhập số điện thoại liên hệ của khách hàng (nếu nhập +84... sẽ tự chuyển về 0...):';
    case 's2b_name':
      return '2. Tên khách hàng là gì?';
    case 's3a_house':
      return '3. Chọn mô hình nhà của khách hàng:';
    case 's3b_floors':
      return '3. Số tầng hiện có là bao nhiêu?';
    case 's4a_modem':
      return '4. Chọn mô hình thiết bị Modem đang sử dụng:';
    case 's4b_router':
      return '4. Vì Modem là ONT, vui lòng chọn thêm Router TP-Link hoặc AP đi kèm:';
    case 's4c_ap':
      return '4. Chọn thiết bị AP (Access Point) tại nhà khách hàng:';
    case 's4d_box':
      return '4. Chọn thiết bị Box (Truyền hình) tại nhà khách hàng:';
    case 's5_devices':
      return '5. Tổng số thiết bị đang sử dụng là bao nhiêu?';
    case 's6a_fault_group':
      return '6. Nguyên nhân lỗi thuộc nhóm nào?';
    case 's6b_fault_detail':
      return `6. Chọn chi tiết nguyên nhân lỗi (${answers.nhom_loi || 'Internet'}):`;
    case 's7_resolution':
      return '7. Phương án xử lý là gì? (Nhập nội dung bên dưới)';
    case 's8a_tool_my_bao':
      return '8. TOOL Mỹ bảo?';
    case 's8b_has_ap':
      return '8. Khách hàng đã có AP chưa?';
    case 's8c_want_ap':
      return answers.da_co_ap === 'Có'
        ? '8. Khách hàng có muốn lắp thêm AP không?'
        : '8. Khách hàng có muốn lắp AP không?';
    case 's9_need_md_ap':
      return '9. KH có cần trang bị MD/AP không?';
    case 's10_agree_buy':
      return '10. KH có đồng ý mua thêm MD/AP không?';
    case 's11_ktv_install':
      return '11. KTV chủ động lắp AP SE cho KH?';
    case 's12_location':
      return '12. Vị trí tọa độ: Bấm lấy tọa độ tại vị trí bạn đang đứng.';
    case 'done':
      return 'Đã hoàn tất 12 bước thu thập thông tin Bảo Trì. Kiểm tra tóm tắt bên dưới và lưu phiếu.';
  }
}

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'init-1',
      sender: 'bot',
      text: getPromptForStep('s1_cls', {}),
    },
  ];
}

export function MaintenanceBotView({
  user,
  category,
  onRequireAuth,
  onSaved,
}: MaintenanceBotViewProps) {
  const [step, setStep] = useState<BotStepId>('s1_cls');
  const [answers, setAnswers] = useState<MaintenanceAnswers>({});
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  const [textInput, setTextInput] = useState('');
  const [optionSearch, setOptionSearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  useEffect(() => {
    setOptionSearch('');
    setTextInput('');
    setErrorMsg('');
    setLocating(false);
  }, [step]);

  const activeChoices = useMemo(() => {
    let list: string[] = [];
    switch (step) {
      case 's1_cls':
        list = CLS_OPTIONS;
        break;
      case 's3a_house':
        list = HOUSE_MODELS;
        break;
      case 's3b_floors':
        list = FLOOR_COUNTS;
        break;
      case 's4a_modem':
        list = MODEM_MODELS;
        break;
      case 's4b_router':
        list = ONT_EXTRA_ROUTERS;
        break;
      case 's4c_ap':
        list = AP_MODELS;
        break;
      case 's4d_box':
        list = BOX_MODELS;
        break;
      case 's5_devices':
        list = DEVICE_TOTAL_OPTIONS;
        break;
      case 's6a_fault_group':
        list = Object.keys(FAULT_GROUPS);
        break;
      case 's6b_fault_detail':
        list = FAULT_GROUPS[answers.nhom_loi || 'Internet'] || [];
        break;
      case 's8a_tool_my_bao':
      case 's8b_has_ap':
      case 's8c_want_ap':
      case 's9_need_md_ap':
      case 's10_agree_buy':
      case 's11_ktv_install':
        list = ['Có', 'Không'];
        break;
      default:
        list = [];
    }
    const q = optionSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => item.toLowerCase().includes(q));
  }, [step, answers.nhom_loi, optionSearch]);

  const needsSearchBar =
    step === 's4a_modem' ||
    step === 's4b_router' ||
    step === 's4c_ap' ||
    step === 's4d_box' ||
    step === 's6b_fault_detail';

  const needsTextInput =
    step === 's1_cls' ||
    step === 's2a_phone' ||
    step === 's2b_name' ||
    step === 's7_resolution' ||
    step === 's12_location';

  const advance = (answerText: string) => {
    let finalAnswer = answerText.trim();
    if (!finalAnswer) return;

    if (step === 's2a_phone') {
      finalAnswer = normalizeVnPhone(finalAnswer);
      if (!/^0\d{9,10}$/.test(finalAnswer)) {
        setErrorMsg(
          'Số điện thoại không hợp lệ. Vui lòng nhập 10–11 số (vd: 0354717557 hoặc +84354717557).'
        );
        return;
      }
    }

    setErrorMsg('');
    setHistory((prev) => [...prev, { step, answers: { ...answers }, messages: [...messages] }]);

    const nextAnswers: MaintenanceAnswers = { ...answers };
    let nextStep: BotStepId = 'done';
    let extraBotNote: string | null = null;

    switch (step) {
      case 's1_cls':
        nextAnswers.so_cls = finalAnswer;
        nextStep = 's2a_phone';
        break;
      case 's2a_phone':
        nextAnswers.sdt_kh = finalAnswer;
        nextStep = 's2b_name';
        break;
      case 's2b_name':
        nextAnswers.ten_kh = finalAnswer;
        nextStep = 's3a_house';
        break;
      case 's3a_house':
        nextAnswers.mo_hinh_nha = finalAnswer;
        nextStep = 's3b_floors';
        break;
      case 's3b_floors':
        nextAnswers.so_tang = finalAnswer;
        nextStep = 's4a_modem';
        break;
      case 's4a_modem':
        nextAnswers.modem = finalAnswer;
        if (finalAnswer === 'ONT') {
          nextStep = 's4b_router';
        } else {
          delete nextAnswers.router_tp_link;
          nextStep = 's4c_ap';
        }
        break;
      case 's4b_router':
        nextAnswers.router_tp_link = finalAnswer;
        nextStep = 's4c_ap';
        break;
      case 's4c_ap':
        nextAnswers.ap = finalAnswer;
        nextStep = 's4d_box';
        break;
      case 's4d_box':
        nextAnswers.box = finalAnswer;
        nextStep = 's5_devices';
        break;
      case 's5_devices':
        nextAnswers.tong_thiet_bi = finalAnswer;
        nextStep = 's6a_fault_group';
        break;
      case 's6a_fault_group':
        nextAnswers.nhom_loi = finalAnswer as FaultGroupName;
        nextStep = 's6b_fault_detail';
        break;
      case 's6b_fault_detail':
        nextAnswers.nguyen_nhan_loi = finalAnswer;
        nextStep = 's7_resolution';
        break;
      case 's7_resolution':
        nextAnswers.phuong_an_xu_ly = finalAnswer;
        nextStep = 's8a_tool_my_bao';
        break;
      case 's8a_tool_my_bao':
        nextAnswers.tool_my_bao = finalAnswer;
        nextStep = 's8b_has_ap';
        break;
      case 's8b_has_ap':
        nextAnswers.da_co_ap = finalAnswer;
        nextStep = 's8c_want_ap';
        break;
      case 's8c_want_ap':
        nextAnswers.muon_lap_ap = finalAnswer;
        if (finalAnswer === 'Không') {
          nextAnswers.can_trang_bi_md_ap = 'Không';
          nextAnswers.dong_y_mua_md_ap = 'Không';
          nextAnswers.ktv_lap_ap_se = 'Không';
          extraBotNote =
            'Đã tự động chọn "Không" cho các bước 9, 10, 11.';
          nextStep = 's12_location';
        } else {
          nextStep = 's9_need_md_ap';
        }
        break;
      case 's9_need_md_ap':
        nextAnswers.can_trang_bi_md_ap = finalAnswer;
        nextStep = 's10_agree_buy';
        break;
      case 's10_agree_buy':
        nextAnswers.dong_y_mua_md_ap = finalAnswer;
        nextStep = 's11_ktv_install';
        break;
      case 's11_ktv_install':
        nextAnswers.ktv_lap_ap_se = finalAnswer;
        nextStep = 's12_location';
        break;
      case 's12_location':
        nextAnswers.toa_do = finalAnswer;
        nextStep = 'done';
        break;
      case 'done':
        return;
    }

    const appended: ChatMessage[] = [
      { id: `u-${Date.now()}`, sender: 'user', text: finalAnswer },
    ];
    if (extraBotNote) {
      appended.push({
        id: `b-note-${Date.now() + 1}`,
        sender: 'bot',
        text: extraBotNote,
      });
    }
    appended.push({
      id: `b-${Date.now() + 2}`,
      sender: 'bot',
      text: getPromptForStep(nextStep, nextAnswers),
    });

    setAnswers(nextAnswers);
    setMessages((prev) => [...prev, ...appended]);
    setStep(nextStep);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Thiết bị hoặc trình duyệt không hỗ trợ định vị GPS. Vui lòng nhập tọa độ bên dưới.');
      return;
    }
    setLocating(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        advance(`${lat}, ${lng}`);
      },
      (geoErr) => {
        setLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setErrorMsg('Bạn đã từ chối quyền vị trí. Hãy cấp quyền GPS hoặc nhập tọa độ thủ công.');
        } else {
          setErrorMsg('Không thể lấy tọa độ GPS lúc này. Hãy thử lại hoặc nhập thủ công.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    advance(textInput);
  };

  const handleUndo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setStep(last.step);
    setAnswers(last.answers);
    setMessages(last.messages);
    setHistory((prev) => prev.slice(0, -1));
    setSavedSuccess(false);
    setErrorMsg('');
  };

  const handleReset = () => {
    setStep('s1_cls');
    setAnswers({});
    setMessages(createInitialMessages());
    setHistory([]);
    setSavedSuccess(false);
    setCopied(false);
    setErrorMsg('');
  };

  const buildReportText = () => {
    const lines = [
      `PHIẾU BẢO TRÌ (${getTodayIsoDate()})`,
      `1. Số CLs (6 tháng): ${answers.so_cls || ''}`,
      `2. KH: ${answers.ten_kh || ''} - SĐT: ${answers.sdt_kh || ''}`,
      `3. Mô hình nhà: ${answers.mo_hinh_nha || ''} - Số tầng: ${answers.so_tang || ''}`,
      `4. Thiết bị: Modem ${answers.modem || ''}${answers.router_tp_link ? ` (Router: ${answers.router_tp_link})` : ''} | AP: ${answers.ap || ''} | Box: ${answers.box || ''}`,
      `5. Tổng thiết bị SD: ${answers.tong_thiet_bi || ''}`,
      `6. Nguyên nhân lỗi (${answers.nhom_loi || ''}): ${answers.nguyen_nhan_loi || ''}`,
      `7. Phương án xử lý: ${answers.phuong_an_xu_ly || ''}`,
      `8. TOOL Mỹ bảo: ${answers.tool_my_bao || ''} | Đã có AP: ${answers.da_co_ap || ''} | Muốn lắp AP: ${answers.muon_lap_ap || ''}`,
      `9. Cần trang bị MD/AP: ${answers.can_trang_bi_md_ap || ''}`,
      `10. Đồng ý mua thêm MD/AP: ${answers.dong_y_mua_md_ap || ''}`,
      `11. KTV chủ động lắp AP SE: ${answers.ktv_lap_ap_se || ''}`,
      `12. Vị trí tọa độ: ${answers.toa_do || ''}`,
    ];
    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('Không thể sao chép vào khay nhớ tạm.');
    }
  };

  const handleSaveRecord = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const customData: Record<string, string | number> = {
        so_cls: answers.so_cls || '',
        sdt_kh: answers.sdt_kh || '',
        ten_kh: answers.ten_kh || '',
        mo_hinh_nha: answers.mo_hinh_nha || '',
        so_tang: answers.so_tang || '',
        modem: answers.modem || '',
        ...(answers.router_tp_link ? { router_tp_link: answers.router_tp_link } : {}),
        ap: answers.ap || '',
        box: answers.box || '',
        tong_thiet_bi: answers.tong_thiet_bi || '',
        nhom_loi: answers.nhom_loi || '',
        nguyen_nhan_loi: answers.nguyen_nhan_loi || '',
        phuong_an_xu_ly: (answers.phuong_an_xu_ly || '').slice(0, 500),
        tool_my_bao: answers.tool_my_bao || '',
        da_co_ap: answers.da_co_ap || '',
        muon_lap_ap: answers.muon_lap_ap || '',
        can_trang_bi_md_ap: answers.can_trang_bi_md_ap || 'Không',
        dong_y_mua_md_ap: answers.dong_y_mua_md_ap || 'Không',
        ktv_lap_ap_se: answers.ktv_lap_ap_se || 'Không',
        toa_do: answers.toa_do || '',
      };

      const title = `${answers.ten_kh || 'Khách hàng'} — ${answers.nguyen_nhan_loi || 'Bảo Trì'}`.slice(
        0,
        160
      );
      const location = `${answers.mo_hinh_nha || ''} · ${answers.so_tang || ''} tầng · ${answers.sdt_kh || ''}`
        .replace(/^ · | · $/g, '')
        .slice(0, 160);

      await createRecord(user.uid, {
        categoryId: category.id,
        categoryName: category.name,
        title,
        location,
        contactName: `${answers.ten_kh || ''} (${answers.sdt_kh || ''})`.slice(0, 100),
        status: 'hoan_thanh',
        priority: Number(answers.so_cls) >= 3 ? 'cao' : 'trung_binh',
        notes: (answers.phuong_an_xu_ly || '').slice(0, 2000),
        customData,
        collectedDate: getTodayIsoDate(),
      });

      setSavedSuccess(true);
      onSaved();
    } catch {
      setErrorMsg('Không thể lưu phiếu Bảo Trì lên Firestore. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const currentStepNum = STEP_NUMBER_MAP[step];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[540px] max-h-[75vh] sm:max-h-[680px]">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="min-w-0">
          <p className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
            Trợ lý Bảo Trì
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Bước {currentStepNum}/12
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={history.length === 0 || saving}
            onClick={handleUndo}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quay lại</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleReset}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Làm lại</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {step === 'done' && (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 text-xs sm:text-sm">
            <p className="font-display font-semibold text-slate-900 dark:text-slate-100">
              Tóm tắt 12 bước Bảo Trì
            </p>
            <div className="space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>1. Số CLs (6 tháng): <strong>{answers.so_cls}</strong></p>
              <p>2. Khách hàng: <strong>{answers.ten_kh}</strong> · SĐT: <strong>{answers.sdt_kh}</strong></p>
              <p>3. Mô hình: <strong>{answers.mo_hinh_nha}</strong> · Tầng: <strong>{answers.so_tang}</strong></p>
              <p>
                4. Thiết bị: Modem <strong>{answers.modem}</strong>
                {answers.router_tp_link ? ` (Kèm: ${answers.router_tp_link})` : ''} · AP{' '}
                <strong>{answers.ap}</strong> · Box <strong>{answers.box}</strong>
              </p>
              <p>5. Tổng thiết bị SD: <strong>{answers.tong_thiet_bi}</strong></p>
              <p>6. Lỗi ({answers.nhom_loi}): <strong>{answers.nguyen_nhan_loi}</strong></p>
              <p>7. Phương án xử lý: <strong>{answers.phuong_an_xu_ly}</strong></p>
              <p>
                8. TOOL Mỹ bảo: <strong>{answers.tool_my_bao}</strong> · Đã có AP:{' '}
                <strong>{answers.da_co_ap}</strong> · Muốn lắp AP: <strong>{answers.muon_lap_ap}</strong>
              </p>
              <p>9. Cần trang bị MD/AP: <strong>{answers.can_trang_bi_md_ap}</strong></p>
              <p>10. Đồng ý mua thêm MD/AP: <strong>{answers.dong_y_mua_md_ap}</strong></p>
              <p>11. KTV lắp AP SE: <strong>{answers.ktv_lap_ap_se}</strong></p>
              <p className="font-mono text-xs">
                12. Vị trí tọa độ: <strong>{answers.toa_do}</strong>
              </p>
            </div>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mx-4 mb-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl px-3.5 py-2 text-xs font-medium"
        >
          {errorMsg}
        </div>
      )}

      {savedSuccess && (
        <div
          role="status"
          className="mx-4 mb-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl px-3.5 py-2 text-xs font-medium flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Đã lưu phiếu Bảo Trì thành công vào danh sách!</span>
        </div>
      )}

      <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 space-y-2.5">
        {step === 'done' ? (
          <div className="space-y-2">
            {!user ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400 px-1">
                  Bạn chưa đăng nhập nên chưa thể lưu phiếu lên hệ thống. Dữ liệu vẫn được giữ nguyên nếu bạn đăng nhập ngay bây giờ.
                </p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Đăng nhập để lưu phiếu Bảo Trì</span>
                </button>
              </>
            ) : !savedSuccess ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveRecord}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {saving ? 'Đang lưu phiếu...' : 'Lưu phiếu Bảo Trì'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-sm font-semibold"
              >
                Thu thập phiếu Bảo Trì mới
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyReport}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Đã sao chép tin nhắn báo cáo</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>Sao chép tin nhắn báo cáo</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {needsSearchBar && (
              <input
                type="search"
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                placeholder="Tìm nhanh mã thiết bị hoặc lỗi..."
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            )}

            {step === 's12_location' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={locating}
                  onClick={handleGetCurrentLocation}
                  className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{locating ? 'Đang lấy tọa độ GPS...' : 'Lấy tọa độ đang đứng'}</span>
                </button>
                <button
                  type="button"
                  disabled={locating}
                  onClick={() => advance('Không lấy được tọa độ')}
                  className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  Bỏ qua
                </button>
              </div>
            )}

            {activeChoices.length > 0 && (
              <div
                className={`grid gap-2 ${
                  step === 's1_cls'
                    ? 'grid-cols-6'
                    : step === 's3b_floors' || step === 's5_devices'
                      ? 'grid-cols-3 sm:grid-cols-6'
                      : activeChoices.length === 2
                        ? 'grid-cols-2'
                        : activeChoices.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-2 sm:grid-cols-3 max-h-44 overflow-y-auto pr-0.5'
                }`}
              >
                {activeChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => advance(choice)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 active:scale-[0.98] transition-all text-center break-words"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {needsTextInput && (
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                <input
                  type={
                    step === 's2a_phone'
                      ? 'tel'
                      : step === 's1_cls'
                        ? 'number'
                        : 'text'
                  }
                  value={textInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (step === 's2a_phone') {
                      const compact = val.replace(/[\s.\-()]/g, '');
                      if (/^\+?84\d{9,10}$/.test(compact)) {
                        setTextInput(normalizeVnPhone(compact));
                        return;
                      }
                    }
                    setTextInput(val);
                  }}
                  placeholder={
                    step === 's1_cls'
                      ? 'Hoặc nhập số khác (vd: 6, 7)...'
                      : step === 's2a_phone'
                        ? 'Nhập SĐT (vd: 0354717557 hoặc +84354717557)...'
                        : step === 's2b_name'
                          ? 'Nhập tên khách hàng...'
                          : step === 's12_location'
                            ? 'Hoặc nhập tọa độ thủ công (vd: 10.776889, 106.700806)...'
                            : 'Nhập phương án xử lý đã thực hiện...'
                  }
                  className="flex-1 min-h-[48px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  aria-label="Gửi trả lời"
                  className="min-w-[52px] min-h-[48px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
