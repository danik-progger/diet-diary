import { ArrowUp, Plus } from "lucide-preact";
import { useState } from "preact/hooks";

export const ChatSection = ({ onAddMeal }: { onAddMeal: () => void }) => {
  const [message, setMessage] = useState("");

  return (
    <section class="chat-screen" aria-label="Nutrition coach chat">
      <div class="chat-screen__messages" aria-live="polite">
        <article class="chat-message chat-message--coach">
          <p>Hey! You’re off to a great start today. Want help planning what to eat next?</p>
        </article>
        <article class="chat-message chat-message--you">
          <p>What’s a good high-protein lunch?</p>
        </article>
        <article class="chat-message chat-message--coach">
          <p>A chicken and quinoa bowl would fit nicely. Add greens, roasted veggies, and a spoon of yogurt sauce for a balanced meal.</p>
          <div class="chat-message__suggestion"><span>PROTEIN</span><strong>32 g</strong><span>ABOUT 420 KCAL</span></div>
        </article>
      </div>
      <form class="chat-composer" onSubmit={(event) => { event.preventDefault(); setMessage(""); }}>
        <button class="chat-composer__add" type="button" aria-label="Add meal" title="Add meal" aria-haspopup="dialog" onClick={onAddMeal}><Plus aria-hidden="true" size={23} strokeWidth={3} /></button>
        <label class="sr-only" for="chat-message">Message your nutrition coach</label>
        <input id="chat-message" value={message} onInput={(event) => setMessage(event.currentTarget.value)} placeholder="Ask anything about nutrition…" />
        <button class="chat-composer__send" type="submit" aria-label="Send message" disabled={!message.trim()}><ArrowUp aria-hidden="true" size={22} strokeWidth={3} /></button>
      </form>
    </section>
  );
};
