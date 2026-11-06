import { X } from "lucide-preact";
import { forwardRef } from "preact/compat";
import { createDailyGoal, type MacroValues } from "../scripts/nutrition";

interface SettingsModalProps {
  dailyGoal: MacroValues;
  onSave: (dailyGoal: MacroValues) => void;
}

export const SettingsModal = forwardRef<HTMLDialogElement, SettingsModalProps>(({ dailyGoal, onSave }, ref) => (
  <dialog
    ref={ref}
    class="meal-dialog settings-dialog"
    aria-labelledby="settings-dialog-title"
    onClick={(event) => {
      if (event.currentTarget === event.target) event.currentTarget.close();
    }}
  >
    <div class="dialog-heading">
      <h2 id="settings-dialog-title">Daily limits</h2>
      <button
        class="meal-dialog__close"
        type="button"
        aria-label="Close settings"
        onClick={(event) => event.currentTarget.closest("dialog")?.close()}
      >
        <X aria-hidden="true" size={28} strokeWidth={3.2} />
      </button>
    </div>


    <form
      class="meal-form"
      key={`${dailyGoal.protein}-${dailyGoal.carbs}-${dailyGoal.fat}`}
      onInput={(event) => {
        const input = event.target;
        if (input instanceof HTMLInputElement) {
          input.classList.toggle("meal-macro-input--zero", Number(input.value) === 0);
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const nextDailyGoal = createDailyGoal({
          protein: Number(formData.get("protein")),
          carbs: Number(formData.get("carbs")),
          fat: Number(formData.get("fat")),
        });

        if (!nextDailyGoal) return;
        onSave(nextDailyGoal);
        event.currentTarget.closest("dialog")?.close();
      }}
    >
      <label class="meal-macro-field meal-macro-field--protein" htmlFor="daily-protein">
        <span>Proteins</span>
        <input
          class={dailyGoal.protein === 0 ? "meal-macro-input--zero" : ""}
          id="daily-protein"
          name="protein"
          type="text"
          inputMode="decimal"
          defaultValue={dailyGoal.protein}
          onFocus={({ currentTarget }) => requestAnimationFrame(() => currentTarget.setSelectionRange(currentTarget.value.length, currentTarget.value.length))}
          required
        />
      </label>

      <label class="meal-macro-field meal-macro-field--fat" htmlFor="daily-fat">
        <span>Fats</span>
        <input
          class={dailyGoal.fat === 0 ? "meal-macro-input--zero" : ""}
          id="daily-fat"
          name="fat"
          type="text"
          inputMode="decimal"
          defaultValue={dailyGoal.fat}
          onFocus={({ currentTarget }) => requestAnimationFrame(() => currentTarget.setSelectionRange(currentTarget.value.length, currentTarget.value.length))}
          required
        />
      </label>

      <label class="meal-macro-field meal-macro-field--carbs" htmlFor="daily-carbs">
        <span>Carbs</span>
        <input
          class={dailyGoal.carbs === 0 ? "meal-macro-input--zero" : ""}
          id="daily-carbs"
          name="carbs"
          type="text"
          inputMode="decimal"
          defaultValue={dailyGoal.carbs}
          onFocus={({ currentTarget }) => requestAnimationFrame(() => currentTarget.setSelectionRange(currentTarget.value.length, currentTarget.value.length))}
          required
        />
      </label>

      <div class="meal-form__actions">
        <button class="meal-form__save" type="submit">Save</button>
      </div>
    </form>
  </dialog>
));
