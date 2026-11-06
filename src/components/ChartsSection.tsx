import { DailySummary } from "../scripts/nutrition";
import { ProgressChart } from "./ProgressChart";

interface ChartsSectionProps {
  summary: DailySummary;
}

export const ChartsSection = ({ summary }: ChartsSectionProps) => {
  const fontColor = "#fff";

  return (
    <section class="summary-card nutrition-charts" aria-labelledby="nutrition-charts-title">
      <h2 id="nutrition-charts-title" class="sr-only">Daily nutrition progress</h2>
      <ProgressChart
        variant="horizontal"
        title="Calories"
        value={summary.eaten.calories}
        max={summary.limit.calories}
        backgroundColor="var(--light-purple)"
        fontColor={fontColor}
        accentColor="var(--purple)"
        icon="zap"
      />
      <div class="nutrition-charts__macros">
        <ProgressChart
          variant="vertical"
          title="Protein"
          value={summary.eaten.protein}
          max={summary.limit.protein}
          backgroundColor="var(--light-red)"
          fontColor={fontColor}
          accentColor="var(--red)"
          icon="protein"
        />
        <ProgressChart
          variant="vertical"
          title="Fat"
          value={summary.eaten.fat}
          max={summary.limit.fat}
          backgroundColor="var(--light-yellow)"
          fontColor={fontColor}
          accentColor="var(--yellow)"
          icon="fat"
        />
        <ProgressChart
          variant="vertical"
          title="Carbs"
          value={summary.eaten.carbs}
          max={summary.limit.carbs}
          backgroundColor="var(--light-green)"
          fontColor={fontColor}
          accentColor="var(--green)"
          icon="carbs"
        />
      </div>
    </section>
  );
};
