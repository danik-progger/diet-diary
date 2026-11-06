import { CakeSlice, Carrot, Drumstick, ImagePlus, WandSparkles, X, Zap } from "lucide-preact";
import type { SubmitEventHandler } from "preact";
import { forwardRef } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";
import { formatAmount, getCalories, mealKinds, type MacroValues, type Meal, type MealKind } from "../scripts/nutrition";

interface AddMealModalProps {
  meal: Meal | null;
  defaultKind?: MealKind;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  onDelete: () => void;
  onClose: () => void;
}

async function prepareImage(file: File): Promise<string> {
  if (file.size > 20_000_000) throw new Error("Image is too large to attach.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not read the image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.68);
    if (image.length > 250_000) throw new Error("Image is too large to save.");
    return image;
  } finally {
    bitmap.close();
  }
}

export const AddMealModal = forwardRef<HTMLDialogElement, AddMealModalProps>(({ meal, defaultKind, onSubmit, onDelete, onClose }, ref) => {
  const kind = meal?.type ?? defaultKind;
  const [images, setImages] = useState<string[]>(meal?.images ?? []);
  const [imageError, setImageError] = useState("");
  const [macros, setMacros] = useState<MacroValues>({ protein: meal?.protein ?? 0, fat: meal?.fat ?? 0, carbs: meal?.carbs ?? 0 });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const calories = Object.values(macros).every((value) => Number.isFinite(value) && value >= 0) ? formatAmount(getCalories(macros)) : "—";

  useEffect(() => {
    setImages(meal?.images ?? []);
    setImageError("");
    setMacros({ protein: meal?.protein ?? 0, fat: meal?.fat ?? 0, carbs: meal?.carbs ?? 0 });
  }, [meal?.id, defaultKind]);

  async function addImages(files: File[]) {
    if (!files.length) return;
    if (images.length + files.length > 3) { setImageError("Up to three images per meal."); return; }
    try {
      const added = await Promise.all(files.map(prepareImage));
      setImages((current) => [...current, ...added].slice(0, 3));
      setImageError("");
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not attach the image.");
    }
  }

  return (<dialog
    ref={ref}
    class="meal-dialog meal-dialog--entry"
    aria-labelledby="meal-dialog-title"
    onClose={() => { setImages([]); setImageError(""); onClose(); }}
    onClick={(event) => {
      if (event.currentTarget === event.target) event.currentTarget.close();
    }}
  >
    <div class="dialog-heading">
      <h2 id="meal-dialog-title">{kind === "Snack" ? "Snacks" : kind ?? "Choose meal"}</h2>
      <button
        class="meal-dialog__close"
        type="button"
        aria-label="Close meal dialog"
        onClick={(event) => event.currentTarget.closest("dialog")?.close()}
      >
        <X aria-hidden="true" size={22} strokeWidth={2.6} />
      </button>
    </div>

    <form
      class="meal-form"
      key={meal?.id ?? defaultKind ?? "new"}
      onSubmit={onSubmit}
      onInput={(event) => {
        const input = event.target;
        if (input instanceof HTMLInputElement) {
          input.classList.toggle("meal-macro-input--zero", Number(input.value) === 0);
          if (input.name === "protein" || input.name === "fat" || input.name === "carbs") {
            setMacros((current) => ({ ...current, [input.name]: input.value === "" ? 0 : Number(input.value) }));
          }
        }
      }}
    >
      {kind ? <input type="hidden" name="type" value={kind} /> : <label class="meal-type-field" htmlFor="meal-type">
        <span class="sr-only">Meal type</span>
        <select id="meal-type" name="type" autoComplete="off" defaultValue="" required>
          <option value="" disabled>Meal type</option>
          {mealKinds.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>}

      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div class="meal-description-field">
        <label class="sr-only" htmlFor="meal-description">Description</label>
        <textarea
          id="meal-description"
          name="description"
          autoComplete="off"
          maxLength={500}
          placeholder="Describe your meal…"
          defaultValue={meal?.description ?? ""}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled
          hidden
          onChange={async (event) => {
            await addImages(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        <div class="meal-description-field__footer">
          <div class="meal-description-field__attachments">
            <button class="meal-description-field__add-image" type="button" aria-label="Add images, coming soon" title="Coming soon" disabled onClick={() => imageInputRef.current?.click()}><ImagePlus aria-hidden="true" size={18} strokeWidth={2.2} /></button>
            <div class="meal-description-field__images" aria-label="Attached images">
              {images.map((image, index) => <span class="meal-description-field__image" key={`${index}-${image.length}`}>
                <img src={image} alt={`Attached image ${index + 1}`} width="48" height="48" />
                <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}><X aria-hidden="true" size={12} /></button>
              </span>)}
            </div>
          </div>
          <button class="meal-description-field__wand" type="button" aria-label="Magic wand, coming soon" title="Coming soon" disabled><WandSparkles aria-hidden="true" size={18} strokeWidth={2.2} /></button>
        </div>
        {imageError && <p class="meal-description-field__error" role="alert">{imageError}</p>}
      </div>

      <label class="meal-macro-field meal-macro-field--protein" htmlFor="meal-protein">
        <span class="meal-macro-field__label"><Drumstick aria-hidden="true" size={22} strokeWidth={2.6} /><span class="sr-only">Protein</span></span>
        <input
          class={(meal?.protein ?? 0) === 0 ? "meal-macro-input--zero" : ""}
          id="meal-protein"
          name="protein"
          type="text"
          autoComplete="off"
          inputMode="decimal"
          placeholder="0"
          defaultValue={meal?.protein}
          onFocus={({ currentTarget }) => requestAnimationFrame(() => currentTarget.setSelectionRange(currentTarget.value.length, currentTarget.value.length))}
          required
        />
      </label>

      <label class="meal-macro-field meal-macro-field--fat" htmlFor="meal-fat">
        <span class="meal-macro-field__label"><CakeSlice aria-hidden="true" size={22} strokeWidth={2.6} /><span class="sr-only">Fat</span></span>
        <input
          class={(meal?.fat ?? 0) === 0 ? "meal-macro-input--zero" : ""}
          id="meal-fat"
          name="fat"
          type="text"
          autoComplete="off"
          inputMode="decimal"
          placeholder="0"
          defaultValue={meal?.fat}
          onFocus={({ currentTarget }) => requestAnimationFrame(() => currentTarget.setSelectionRange(currentTarget.value.length, currentTarget.value.length))}
          required
        />
      </label>

      <label class="meal-macro-field meal-macro-field--carbs" htmlFor="meal-carbs">
        <span class="meal-macro-field__label"><Carrot aria-hidden="true" size={22} strokeWidth={2.6} /><span class="sr-only">Carbs</span></span>
        <input
          class={(meal?.carbs ?? 0) === 0 ? "meal-macro-input--zero" : ""}
          id="meal-carbs"
          name="carbs"
          type="text"
          autoComplete="off"
          inputMode="decimal"
          placeholder="0"
          defaultValue={meal?.carbs}
          onFocus={({ currentTarget }) => requestAnimationFrame(() => currentTarget.setSelectionRange(currentTarget.value.length, currentTarget.value.length))}
          required
        />
      </label>

      <output class="meal-calories" aria-label="Calories calculated from macros" aria-live="polite" title="Calculated from macros">
        <Zap aria-hidden="true" size={22} strokeWidth={2.4} /><strong>{calories}</strong>
      </output>

      <div class="meal-form__actions">
        {meal && <button class="meal-form__delete" type="button" onClick={onDelete}>Delete</button>}
        <button class="meal-form__save" type="submit">Save</button>
      </div>
    </form>
  </dialog>);
});
