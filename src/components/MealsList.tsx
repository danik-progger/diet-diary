import { useState } from "preact/hooks";
import { Apple, Beef, CakeSlice, Carrot, Drumstick, EggFried, Salad, X } from "lucide-preact";
import { formatAmount, getCalories, mealKinds, type Meal, type MealKind } from "../scripts/nutrition";

interface MealsListProps {
  openMealDialog: (meal?: Meal, kind?: MealKind) => void;
  meals: Meal[];
}

const kindIcons = { Breakfast: EggFried, Lunch: Beef, Dinner: Salad, Snack: Apple };
const labelFor = (kind: MealKind) => kind === "Snack" ? "Snacks" : kind;
export const MealsList = ({ openMealDialog, meals }: MealsListProps) => {
  const [selectedKind, setSelectedKind] = useState<MealKind | null>(null);
  const selectedMeals = selectedKind ? meals.filter((meal) => meal.type === selectedKind) : [];

  return <section class="meals-card meal-types" aria-labelledby="meals-title">
    <div class="meal-types__heading"><h2 id="meals-title">Meals</h2></div>
    <div class="meal-types__grid">
      {mealKinds.map((kind) => {
        const entries = meals.filter((meal) => meal.type === kind);
        const totals = entries.reduce((total, meal) => ({ calories: total.calories + getCalories(meal), protein: total.protein + meal.protein, fat: total.fat + meal.fat, carbs: total.carbs + meal.carbs }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
        const Icon = kindIcons[kind];
        const label = labelFor(kind);
        return <article class={`meal-type-card meal-type-card--${kind.toLowerCase()}`} key={kind}>
          <button class="meal-type-card__open" type="button" title={label} aria-label={`${label}, ${formatAmount(totals.calories)} calories, ${formatAmount(totals.protein)} protein, ${formatAmount(totals.fat)} fat, ${formatAmount(totals.carbs)} carbs. Add meal`} onClick={() => openMealDialog(undefined, kind)}>
              <span class="meal-type-card__calories"><strong>{formatAmount(totals.calories)}</strong></span>
              <span class="meal-type-card__macros" aria-hidden="true">
                <span class="meal-type-card__macro meal-type-card__macro--protein">{totals.protein > 0 ? formatAmount(totals.protein) : <Drumstick size={17} strokeWidth={2.6} />}</span>
                <span class="meal-type-card__macro meal-type-card__macro--fat">{totals.fat > 0 ? formatAmount(totals.fat) : <CakeSlice size={17} strokeWidth={2.6} />}</span>
                <span class="meal-type-card__macro meal-type-card__macro--carbs">{totals.carbs > 0 ? formatAmount(totals.carbs) : <Carrot size={17} strokeWidth={2.6} />}</span>
              </span>
          </button>
          {entries.length ? <button class="meal-type-card__icon" type="button" aria-label={`View ${label.toLowerCase()} entries`} onClick={() => setSelectedKind(selectedKind === kind ? null : kind)}><Icon aria-hidden="true" size={22} strokeWidth={2.8} /></button> : <span class="meal-type-card__icon" aria-hidden="true"><Icon size={22} strokeWidth={2.8} /></span>}
        </article>;
      })}
    </div>
    {selectedKind && selectedMeals.length > 0 && <section class="meal-type-details" aria-label={`${labelFor(selectedKind)} entries`}>
      <div class="meal-type-details__heading"><h3>{labelFor(selectedKind)}</h3><div class="meal-type-details__actions"><button type="button" onClick={() => openMealDialog(undefined, selectedKind)}>Add meal</button><button type="button" aria-label="Close entries" onClick={() => setSelectedKind(null)}><X aria-hidden="true" size={16} /></button></div></div>
      <ul>{selectedMeals.map((meal) => <li key={meal.id}><button class="meal-entry" type="button" onClick={() => openMealDialog(meal)} aria-label={`Edit ${selectedKind}${meal.description ? `, ${meal.description}` : ""}, ${formatAmount(getCalories(meal))} calories, protein ${formatAmount(meal.protein)}, fat ${formatAmount(meal.fat)}, carbs ${formatAmount(meal.carbs)}`}><strong>{formatAmount(getCalories(meal))}</strong>{meal.description && <span class="meal-entry__description">{meal.description}</span>}<span class="meal-entry__macros" aria-hidden="true"><span class="meal-entry__macro meal-entry__macro--protein">{formatAmount(meal.protein)}</span><span class="meal-entry__macro meal-entry__macro--fat">{formatAmount(meal.fat)}</span><span class="meal-entry__macro meal-entry__macro--carbs">{formatAmount(meal.carbs)}</span></span></button></li>)}</ul>
    </section>}
  </section>;
};
