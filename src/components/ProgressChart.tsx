import { formatAmount } from "../scripts/nutrition";
import { CakeSlice, Carrot, Drumstick, Zap } from "lucide-preact";

interface ProgressChartProps {
  variant: "horizontal" | "vertical";
  title: string;
  value: number;
  max: number;
  backgroundColor: string;
  fontColor: string;
  accentColor: string;
  icon: "zap" | "protein" | "fat" | "carbs";
}

export const ProgressChart = ({
  variant,
  title,
  value,
  max,
  backgroundColor,
  fontColor,
  accentColor,
  icon,
}: ProgressChartProps) => {
  const progress = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
  const Icon = { zap: Zap, protein: Drumstick, fat: CakeSlice, carbs: Carrot }[icon];

  return (
    <article
      class={`progress-chart progress-chart--${variant}`}
      role="progressbar"
      aria-label={title}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-valuetext={`${formatAmount(value)} of ${formatAmount(max)}`}
      style={{ backgroundColor, color: fontColor }}
    >
      <span class="progress-chart__clip" aria-hidden="true"><span
        class="progress-chart__fill"
        style={variant === "horizontal"
          ? { backgroundColor: accentColor, width: `${progress}%` }
          : { backgroundColor: accentColor, height: `${progress}%` }}
      /></span>
      <h3 class="progress-chart__title">{title}</h3>
      <span class="progress-chart__limit">{formatAmount(max)}</span>
      <span class="progress-chart__icon" aria-hidden="true" style={{ color: accentColor }}><Icon size={22} strokeWidth={2.8} /></span>
      <p class="progress-chart__value">
        <strong>{formatAmount(value)}</strong>
      </p>
    </article>
  );
};
