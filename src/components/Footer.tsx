import { ChartSpline, Heart, MessageCircle, Utensils } from "lucide-preact";
import { Dispatch, StateUpdater } from "preact/hooks";

interface FooterProps {
  activeSection: "food" | "chat" | "health";
  setActiveSection: Dispatch<StateUpdater<"food" | "chat" | "health">>;
  isStatsView: boolean;
  onStatsClick: () => void;
};

export const Footer = ({ activeSection, setActiveSection, isStatsView, onStatsClick }: FooterProps) => {
  return (
    <footer class="app-footer">
      <nav aria-label="App sections">
        <button
          class={`app-footer__item${!isStatsView && activeSection === "food" ? " app-footer__item--active" : ""}`}
          type="button"
          aria-label="Food"
          title="Food"
          aria-current={!isStatsView && activeSection === "food" ? "page" : undefined}
          aria-controls="section-content"
          onClick={() => setActiveSection("food")}
        >
          <Utensils aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button
          class={`app-footer__item${isStatsView ? " app-footer__item--active" : ""}`}
          type="button"
          aria-label="Stats"
          title="Stats"
          aria-current={isStatsView ? "page" : undefined}
          aria-controls="section-content"
          onClick={onStatsClick}
        >
          <ChartSpline aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button
          class={`app-footer__item${!isStatsView && activeSection === "chat" ? " app-footer__item--active" : ""}`}
          type="button"
          aria-label="Chat"
          title="Chat"
          aria-current={!isStatsView && activeSection === "chat" ? "page" : undefined}
          aria-controls="section-content"
          onClick={() => setActiveSection("chat")}
        >
          <MessageCircle aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button
          class={`app-footer__item${!isStatsView && activeSection === "health" ? " app-footer__item--active" : ""}`}
          type="button"
          aria-label="Health"
          title="Health"
          aria-current={!isStatsView && activeSection === "health" ? "page" : undefined}
          aria-controls="section-content"
          onClick={() => setActiveSection("health")}
        >
          <Heart aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      </nav>
    </footer>
  );
}
