import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import "./App.css";
import {
  createMeal,
  formatDayLabel,
  getDayKey,
  getDailySummary,
  getEarliestLoggedDayKey,
  loadDailyGoal,
  loadMeals,
  saveDailyGoal,
  saveMeals,
  seedCurrentWeekMeals,
  shiftDayKey,
  type Meal,
  type MealKind,
} from "./scripts/nutrition";
import { ChartsSection } from "./components/ChartsSection";
import { AddMealModal } from "./components/AddMealModal";
import { MealsList } from "./components/MealsList";
import { Header } from "./components/Header";
import { SettingsModal } from "./components/SettingsModal";
import { StatsSection } from "./components/StatsSection";
import { Footer } from "./components/Footer";
import { ChatSection } from "./components/ChatSection";
import { Settings } from "lucide-preact";

function formatStatsRange(endDayKey: string) {
  const format = (dayKey: string) => {
    const [, month, day] = dayKey.split("-");
    return `${day}.${month}`;
  };

  return `${format(shiftDayKey(endDayKey, -6))} – ${format(endDayKey)}`;
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try { return window.localStorage.getItem("nutriday-theme") === "light" ? "light" : "dark"; }
    catch { return "dark"; }
  });
  const [todayDayKey, setTodayDayKey] = useState(getDayKey);
  const [mealDayKey, setMealDayKey] = useState(todayDayKey);
  const [dayDirection, setDayDirection] = useState<"older" | "newer">("newer");
  const [hasChangedDay, setHasChangedDay] = useState(false);
  const [meals, setMeals] = useState<Meal[]>(() => {
    seedCurrentWeekMeals(mealDayKey);
    return loadMeals(mealDayKey);
  });
  const [dailyGoal, setDailyGoal] = useState(loadDailyGoal);
  const [activeSection, setActiveSection] = useState<"food" | "chat" | "health">("food");
  const [isStatsView, setIsStatsView] = useState(false);
  const [statsEndDayKey, setStatsEndDayKey] = useState(mealDayKey);
  const [editingMeal, setEditingMeal] = useState<Meal | null | undefined>();
  const [addingKind, setAddingKind] = useState<MealKind | undefined>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const wheelGesture = useRef({ deltaX: 0, lastAt: 0, handled: false });
  const summary = getDailySummary(meals, dailyGoal);
  const dayTitle = mealDayKey === todayDayKey ? "Today" : formatDayLabel(mealDayKey);
  const headerTitle = isStatsView ? formatStatsRange(statsEndDayKey) : activeSection === "chat" ? "Chat" : dayTitle;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("nutriday-theme", theme); }
    catch { /* Storage may be unavailable. */ }
  }, [theme]);

  useEffect(() => {
    saveMeals(meals, mealDayKey);
  }, [meals, mealDayKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextDayKey = getDayKey();
      if (nextDayKey === todayDayKey) return;
      setTodayDayKey(nextDayKey);
      if (mealDayKey === todayDayKey) selectDay(nextDayKey, "newer");
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, [mealDayKey, todayDayKey]);

  useEffect(() => {
    saveDailyGoal(dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    if (editingMeal !== undefined && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [editingMeal]);

  function openMealDialog(meal?: Meal, kind?: MealKind) {
    setAddingKind(kind);
    setEditingMeal(meal ?? null);
  }

  function selectDay(dayKey: string, direction: "older" | "newer") {
    setHasChangedDay(true);
    setDayDirection(direction);
    setMealDayKey(dayKey);
    setMeals(loadMeals(dayKey));
  }

  function changeDay(amount: number) {
    const nextDayKey = shiftDayKey(mealDayKey, amount);
    if (nextDayKey >= getEarliestLoggedDayKey(todayDayKey) && nextDayKey <= todayDayKey) {
      selectDay(nextDayKey, amount < 0 ? "older" : "newer");
    }
  }

  function saveMeal(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    let images: unknown;
    try {
      images = JSON.parse(String(formData.get("images") ?? "[]"));
    } catch {
      return;
    }
    const meal = createMeal({
      type: String(formData.get("type") ?? ""),
      description: String(formData.get("description") ?? ""),
      images: images as string[],
      protein: Number(formData.get("protein")),
      carbs: Number(formData.get("carbs")),
      fat: Number(formData.get("fat")),
    });

    if (!meal) {
      return;
    }

    setMeals((currentMeals) => editingMeal
      ? currentMeals.map((currentMeal) => currentMeal.id === editingMeal.id ? { ...meal, id: editingMeal.id } : currentMeal)
      : [...currentMeals, meal]);
    dialogRef.current?.close();
  }

  function deleteMeal() {
    if (!editingMeal) return;
    setMeals((currentMeals) => currentMeals.filter((meal) => meal.id !== editingMeal.id));
    dialogRef.current?.close();
  }

  return (
    <div class={`app-shell${isStatsView ? " app-shell--stats" : ""}`}>
      <Header
        title={headerTitle}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      />
      <main
        id="section-content"
        class={isStatsView ? "stats-view" : activeSection === "chat" ? "chat-view" : "day-view"}
        tabIndex={isStatsView ? -1 : 0}
        aria-label={isStatsView ? `Weekly statistics ending ${dayTitle}.` : activeSection === "chat" ? "Chat with your nutrition coach." : activeSection === "health" ? "Health section." : `Meals for ${dayTitle}. Swipe or use Left and Right Arrow keys to change the day.`}
        onKeyDown={(event) => {
          if (isStatsView || activeSection !== "food") return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            changeDay(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            changeDay(1);
          }
        }}
        onTouchStart={(event) => {
          if (isStatsView || activeSection !== "food") return;
          const touch = event.touches[0];
          swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchEnd={(event) => {
          if (isStatsView || activeSection !== "food") return;
          const start = swipeStart.current;
          const end = event.changedTouches[0];
          swipeStart.current = null;
          if (!start || !end) return;
          const deltaX = end.clientX - start.x;
          const deltaY = end.clientY - start.y;
          if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
          changeDay(deltaX < 0 ? -1 : 1);
        }}
        onWheel={(event) => {
          if (isStatsView || activeSection !== "food" || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
          event.preventDefault();
          const gesture = wheelGesture.current;
          const now = performance.now();
          if (now - gesture.lastAt > 180) {
            gesture.deltaX = 0;
            gesture.handled = false;
          }
          gesture.lastAt = now;
          if (gesture.handled) return;
          gesture.deltaX += event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerWidth : 1);
          if (Math.abs(gesture.deltaX) < 48) return;
          gesture.handled = true;
          changeDay(gesture.deltaX < 0 ? -1 : 1);
        }}
      >
        {isStatsView ? <StatsSection endDayKey={mealDayKey} dailyGoal={dailyGoal} onWeekChange={setStatsEndDayKey} /> : activeSection === "chat" ? <ChatSection onAddMeal={() => openMealDialog()} /> : activeSection === "health" ? <section class="section-placeholder"><h2>Health</h2><p>Health insights will live here.</p><button class="button health-settings-button" type="button" aria-haspopup="dialog" onClick={() => settingsDialogRef.current?.showModal()}><Settings aria-hidden="true" size={20} /> Settings</button></section> : <div key={mealDayKey} class={`day-view__content${hasChangedDay ? ` day-view__content--${dayDirection}` : ""}`}>
          {activeSection === "food" ? <>
          <ChartsSection summary={summary} />
          <MealsList openMealDialog={openMealDialog} meals={meals}/>
          </> : <section class="section-placeholder">
            <h2>{activeSection === "chat" ? "Chat" : "Health"}</h2>
            <p>This section is coming soon.</p>
          </section>}
        </div>}
      </main>
      <AddMealModal
        ref={dialogRef}
        meal={editingMeal ?? null}
        defaultKind={addingKind}
        onSubmit={saveMeal}
        onDelete={deleteMeal}
        onClose={() => setEditingMeal(undefined)}
      />
      <SettingsModal ref={settingsDialogRef} dailyGoal={dailyGoal} onSave={setDailyGoal} />
      <Footer
        activeSection={activeSection}
        isStatsView={isStatsView}
        onStatsClick={() => {
          if (!isStatsView) setStatsEndDayKey(mealDayKey);
          setIsStatsView(true);
        }}
        setActiveSection={(section) => { setActiveSection(section); setIsStatsView(false); }}
      />
    </div>
  );
}

export default App;
