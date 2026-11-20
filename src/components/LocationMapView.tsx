import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  Compass,
  Copy,
  ExternalLink,
  LocateFixed,
  LogIn,
  MapPin,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getTodayIsoDate } from '../defaults';
import { createRecord } from '../services/firestoreService';
import type { Category } from '../types';

interface LocationMapViewProps {
  user: User | null;
  category: Category;
  onRequireAuth: () => void;
  onSaved: () => void;
}

interface CoordinatesState {
  lat: number;
  lng: number;
  accuracy: number | null;
  updatedAtLabel: string;
}

const DEFAULT_DELTA = 0.004;
const MIN_DELTA = 0.001;
const MAX_DELTA = 0.04;

export function LocationMapView({
  user,
  category,
  onRequireAuth,
  onSaved,
}: LocationMapViewProps) {
  const [coords, setCoords] = useState<CoordinatesState | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [zoomDelta, setZoomDelta] = useState(DEFAULT_DELTA);

  const [manualCoordInput, setManualCoordInput] = useState('');
  const [pointTitle, setPointTitle] = useState('');
  const [pointNotes, setPointNotes] = useState('');

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(
        'Trình duyệt hoặc thiết bị không hỗ trợ định vị GPS. Bạn có thể nhập tọa độ thủ công bên dưới.'
      );
      return;
    }

    setLocating(true);
    setGeoError('');
    setSaveSuccess('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Number.isFinite(position.coords.accuracy)
          ? Math.round(position.coords.accuracy)
          : null;
        const timeStr = new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setCoords({
          lat,
          lng,
          accuracy,
          updatedAtLabel: timeStr,
        });
        setManualCoordInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Bạn chưa cấp quyền truy cập vị trí. Vui lòng bật quyền Vị trí (GPS) trên trình duyệt và bấm thử lại.'
          );
        } else if (err.code === err.TIMEOUT) {
          setGeoError(
            'Hết thời gian chờ tín hiệu GPS. Vui lòng di chuyển ra nơi thoáng hơn hoặc bấm lấy lại tọa độ.'
          );
        } else {
          setGeoError('Không thể xác định tọa độ hiện tại. Vui lòng thử lại.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  const formattedCoords = coords
    ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
    : '';

  const embedUrl = useMemo(() => {
    if (!coords) return '';
    const minLng = (coords.lng - zoomDelta).toFixed(6);
    const minLat = (coords.lat - zoomDelta).toFixed(6);
    const maxLng = (coords.lng + zoomDelta).toFixed(6);
    const maxLat = (coords.lat + zoomDelta).toFixed(6);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${coords.lat.toFixed(6)}%2C${coords.lng.toFixed(6)}`;
  }, [coords, zoomDelta]);

  const externalMapUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat.toFixed(6)}&mlon=${coords.lng.toFixed(6)}#map=17/${coords.lat.toFixed(6)}/${coords.lng.toFixed(6)}`
    : '';

  const handleApplyManualCoords = (e: FormEvent) => {
    e.preventDefault();
    setGeoError('');
    const parts = manualCoordInput
      .trim()
      .split(/[,;\s]+/)
      .filter(Boolean);
    if (parts.length < 2) {
      setGeoError('Vui lòng nhập đúng định dạng "Vĩ độ, Kinh độ" (ví dụ: 10.776889, 106.700806).');
      return;
    }
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setGeoError('Giá trị vĩ độ (-90..90) hoặc kinh độ (-180..180) không hợp lệ.');
      return;
    }
    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setCoords({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      accuracy: null,
      updatedAtLabel: timeStr,
    });
    setManualCoordInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  const handleCopyCoords = async () => {
    if (!formattedCoords) return;
    try {
      await navigator.clipboard.writeText(formattedCoords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setGeoError('Không thể sao chép tọa độ vào khay nhớ tạm.');
    }
  };

  const handleSavePoint = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!coords) {
      setSaveError('Vui lòng lấy tọa độ vị trí hiện tại trước khi lưu.');
      return;
    }

    if (!user) {
      onRequireAuth();
      return;
    }

    const cleanTitle = pointTitle.trim() || `Vị trí hiện trường (${formattedCoords})`;
    setSaving(true);
    try {
      await createRecord(user.uid, {
        categoryId: category.id,
        categoryName: category.name,
        title: cleanTitle.slice(0, 160),
        location: formattedCoords,
        contactName: user.displayName || user.email || '',
        status: 'hoan_thanh',
        priority: 'trung_binh',
        notes: pointNotes.trim().slice(0, 2000),
        customData: {
          toa_do: formattedCoords,
          vi_do: coords.lat.toFixed(6),
          kinh_do: coords.lng.toFixed(6),
          ...(coords.accuracy !== null ? { sai_so_m: coords.accuracy } : {}),
        },
        collectedDate: getTodayIsoDate(),
      });
      setPointTitle('');
      setPointNotes('');
      setSaveSuccess('Đã lưu tọa độ vị trí vào danh sách.');
      onSaved();
    } catch {
      setSaveError('Không thể lưu vị trí lên Firestore. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!user && (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 rounded-2xl px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3">
          <span>Bạn vẫn có thể xem bản đồ và lấy tọa độ hiện tại, nhưng cần đăng nhập Google để lưu.</span>
          <button
            type="button"
            onClick={onRequireAuth}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            Đăng nhập
          </button>
        </div>
      )}

      {geoError && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl px-4 py-3 text-xs sm:text-sm"
        >
          {geoError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
                Bản đồ vị trí đang đứng
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                {coords
                  ? `Cập nhật lúc ${coords.updatedAtLabel}${coords.accuracy !== null ? ` · Sai số ±${coords.accuracy}m` : ''}`
                  : locating
                    ? 'Đang xác định tín hiệu GPS...'
                    : 'Chưa có tọa độ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={!coords || zoomDelta <= MIN_DELTA}
              onClick={() => setZoomDelta((d) => Math.max(MIN_DELTA, Number((d / 1.8).toFixed(5))))}
              aria-label="Phóng to bản đồ"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!coords || zoomDelta >= MAX_DELTA}
              onClick={() => setZoomDelta((d) => Math.min(MAX_DELTA, Number((d * 1.8).toFixed(5))))}
              aria-label="Thu nhỏ bản đồ"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative w-full h-[300px] sm:h-[380px] bg-slate-100 dark:bg-slate-950">
          {coords ? (
            <iframe
              key={embedUrl}
              title="Bản đồ vị trí đang đứng"
              src={embedUrl}
              loading="lazy"
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <MapPin className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {locating ? 'Đang lấy tọa độ GPS hiện tại...' : 'Chưa hiển thị được bản đồ'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bấm nút bên dưới để lấy tọa độ đang đứng hoặc nhập tọa độ thủ công.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={locating}
              onClick={fetchCurrentLocation}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <LocateFixed className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{locating ? 'Đang lấy tọa độ...' : 'Lấy tọa độ vị trí hiện tại'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!coords}
                onClick={handleCopyCoords}
                className="flex-1 min-h-[48px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Sao chép tọa độ</span>
                  </>
                )}
              </button>

              {coords && (
                <a
                  href={externalMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mở bản đồ đầy đủ trong tab mới"
                  className="min-h-[48px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Mở rộng</span>
                </a>
              )}
            </div>
          </div>

          {coords && (
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vĩ độ (Lat)</p>
                <p className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {coords.lat.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kinh độ (Lng)</p>
                <p className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {coords.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleApplyManualCoords} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={manualCoordInput}
              onChange={(e) => setManualCoordInput(e.target.value)}
              placeholder="Hoặc nhập tọa độ: 10.776889, 106.700806"
              aria-label="Tọa độ thủ công"
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={!manualCoordInput.trim()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              Xem vị trí
            </button>
          </form>
        </div>
      </div>

      {saveSuccess && (
        <div
          role="status"
          className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl px-4 py-3 text-sm font-medium"
        >
          {saveError}
        </div>
      )}

      <form
        onSubmit={handleSavePoint}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
          Lưu mốc tọa độ vào danh sách
        </h3>

        <div>
          <label
            htmlFor="map-point-title"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
          >
            Tên điểm / Vị trí hiện trường
          </label>
          <input
            id="map-point-title"
            type="text"
            maxLength={160}
            value={pointTitle}
            onChange={(e) => setPointTitle(e.target.value)}
            placeholder="Ví dụ: Tủ tập điểm POP, Nhà khách hàng..."
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="map-point-notes"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
          >
            Ghi chú bổ sung
          </label>
          <textarea
            id="map-point-notes"
            rows={2}
            maxLength={2000}
            value={pointNotes}
            onChange={(e) => setPointNotes(e.target.value)}
            placeholder="Mô tả tuyến cáp, cột, hẻm hoặc mốc nhận diện..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !coords}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {!user && <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>
            {!user
              ? 'Đăng nhập để lưu tọa độ vị trí'
              : saving
                ? 'Đang lưu...'
                : 'Lưu tọa độ vị trí'}
          </span>
        </button>
      </form>
    </div>
  );
}
