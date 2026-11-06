import { Moon, Sun } from "lucide-preact";
import { StreakFlame } from "./StreakFlame";

interface HeaderProps {
  title: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const Header = ({ title, theme, onToggleTheme }: HeaderProps) => (
  <header class="app-header">
    <h1 class="brand" aria-live="polite">
      <span>{title}</span>
    </h1>
    <div class="app-header__actions">
      <button class="theme-toggle" type="button" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title={theme === "dark" ? "Light theme" : "Dark theme"} onClick={onToggleTheme}>
        {theme === "dark" ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
      </button>
      <div class="header-streak" aria-label="10 day streak"><span>10</span><StreakFlame /></div>
    </div>
  </header>
);
