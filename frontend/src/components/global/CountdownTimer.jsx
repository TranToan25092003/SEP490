import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const getTimeParts = (ms) => {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
};

/**
 * Countdown hiển thị thời gian còn lại tới một mốc thời gian kết thúc
 * @param {Object} props
 * @param {string|number|Date} props.targetTime - thời điểm kết thúc (ISO, timestamp hoặc Date)
 * @param {function} [props.onExpire] - callback khi hết giờ
 * @param {string} [props.label] - nhãn mô tả (vd: "Thời gian còn lại")
 * @param {string} [props.className] - thêm class Tailwind
 * @param {boolean} [props.compact] - nếu true thì hiển thị ngắn gọn (mm:ss hoặc hh:mm:ss)
 */
const CountdownTimer = ({
  targetTime,
  onExpire,
  label = "Thời gian còn lại",
  className = "",
  compact = false,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!targetTime) return null;

  const target =
    targetTime instanceof Date ? targetTime.getTime() : new Date(targetTime).getTime();

  if (Number.isNaN(target)) return null;

  const diff = target - now;
  const isExpired = diff <= 0;
  const { hours, minutes, seconds } = getTimeParts(diff);

  useEffect(() => {
    if (isExpired && typeof onExpire === "function") {
      onExpire();
    }
    // chỉ trigger khi vừa hết giờ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  const formatPadded = (value) => String(value).padStart(2, "0");

  const displayText = compact
    ? hours > 0
      ? `${formatPadded(hours)}:${formatPadded(minutes)}:${formatPadded(seconds)}`
      : `${formatPadded(minutes)}:${formatPadded(seconds)}`
    : `${hours} giờ ${minutes} phút ${seconds} giây`;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
        isExpired
          ? "bg-red-100 text-red-700 border border-red-300"
          : "bg-rose-100 text-rose-700 border border-rose-300"
      } ${className}`}
    >
      <Clock className="w-3.5 h-3.5" />
      {label && (
        <span className="uppercase tracking-wide">
          {label}:
        </span>
      )}
      <span>{isExpired ? "Đã hết thời gian" : displayText}</span>
    </div>
  );
};

export default CountdownTimer;


