import { useEffect, useRef, useState } from "preact/hooks";
import { CakeSlice, Carrot, Drumstick, Zap } from "lucide-preact";
import { formatAmount, formatDayLabel, getDailySummary, loadMeals, shiftDayKey, type MacroValues } from "../scripts/nutrition";

interface StatsSectionProps {
  endDayKey: string;
  dailyGoal: MacroValues;
  onWeekChange?: (endDayKey: string) => void;
}

const metrics = [
  { key: "calories", label: "Calories", className: "calories", Icon: Zap },
  { key: "protein", label: "Protein", className: "protein", Icon: Drumstick },
  { key: "fat", label: "Fat", className: "fat", Icon: CakeSlice },
  { key: "carbs", label: "Carbs", className: "carbs", Icon: Carrot },
] as const;

interface StatsWeekProps extends StatsSectionProps {
  initialAnimation: boolean;
  incomingDayKey?: string;
}

const StatsWeek = ({ endDayKey, dailyGoal, initialAnimation, incomingDayKey }: StatsWeekProps) => {
  const days = Array.from({ length: 7 }, (_, index) => {
    const dayKey = shiftDayKey(endDayKey, index - 6);
    return { dayKey, summary: getDailySummary(loadMeals(dayKey), dailyGoal) };
  });

  return (
    <section class="stats-section" aria-label={`Nutrition statistics from ${formatDayLabel(days[0].dayKey)} to ${formatDayLabel(days[6].dayKey)}`}>
      {metrics.map(({ key, label, className, Icon }) => {
        const values = days.map(({ summary }) => summary.eaten[key]);
        const limit = days[0].summary.limit[key];
        const average = values.reduce((total, value) => total + value, 0) / values.length;
        const averageHeight = limit > 0 ? (average / limit) * 88 : 0;

        return (
          <article class={`stats-chart stats-chart--${className}`} aria-label={`${label}: weekly average ${formatAmount(average)}`}>
            <h3 class="sr-only">{label}</h3>
            <div class="stats-chart__guide-row" style={{ bottom: `${averageHeight}%` }} aria-hidden="true" />
            <ol class="stats-chart__bars" aria-label={`Daily ${label} values`}>
              {days.map(({ dayKey }, index) => {
                const barHeight = limit > 0 ? (values[index] / limit) * 88 : 0;
                const value = formatAmount(values[index]);
                const outsideValue = barHeight < 35;
                return <li key={dayKey} aria-label={`${formatDayLabel(dayKey)}: ${value}`}>
                  {values[index] > 0 && <span
                    class={`stats-chart__bar${initialAnimation ? " stats-chart__bar--initial" : ""}${incomingDayKey === dayKey ? " stats-chart__bar--incoming" : ""}`}
                    style={{ height: `${barHeight}%` }}
                  >
                    {!outsideValue && <strong aria-hidden="true">{value}</strong>}
                  </span>}
                  {outsideValue && values[index] > 0 && <strong class="stats-chart__outside-value" style={{ bottom: `calc(${barHeight}% + 5px)` }} aria-hidden="true">{value}</strong>}
                </li>;
              })}
            </ol>
            <div class="stats-chart__summary">
              <Icon aria-hidden="true" size={23} strokeWidth={2.5} />
              <p style={{ bottom: `${averageHeight}%` }}><span>avg</span><strong>{formatAmount(average)}</strong></p>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export const StatsSection = ({ endDayKey, dailyGoal, onWeekChange }: StatsSectionProps) => {
  const [displayEndDayKey, setDisplayEndDayKey] = useState(endDayKey);
  const [initialAnimation, setInitialAnimation] = useState(true);
  const [incomingDayKey, setIncomingDayKey] = useState<string>();
  const touchStartX = useRef<number | null>(null);
  const isTransitioning = useRef(false);

  useEffect(() => {
    setDisplayEndDayKey(endDayKey);
    setInitialAnimation(true);
  }, [endDayKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setInitialAnimation(false), 1_040);
    return () => window.clearTimeout(timeoutId);
  }, [displayEndDayKey]);

  function changeDay(amount: number) {
    if (isTransitioning.current) return;

    const nextEndDayKey = shiftDayKey(displayEndDayKey, amount);
    isTransitioning.current = true;
    setInitialAnimation(false);
    setDisplayEndDayKey(nextEndDayKey);
    setIncomingDayKey(amount < 0 ? shiftDayKey(nextEndDayKey, -6) : nextEndDayKey);
    onWeekChange?.(nextEndDayKey);

    window.setTimeout(() => {
      setIncomingDayKey(undefined);
      isTransitioning.current = false;
    }, 560);
  }

  return (
    <section
      class="stats-scroll"
      tabIndex={0}
      aria-label="Weekly nutrition statistics. Swipe right for the previous day and left for the next day."
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") changeDay(-1);
        if (event.key === "ArrowLeft") changeDay(1);
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (startX === null || endX === undefined || Math.abs(endX - startX) < 48) return;
        changeDay(endX < startX ? 1 : -1);
      }}
    >
      <StatsWeek
        key={displayEndDayKey}
        endDayKey={displayEndDayKey}
        dailyGoal={dailyGoal}
        initialAnimation={initialAnimation}
        incomingDayKey={incomingDayKey}
      />
    </section>
  );
};
