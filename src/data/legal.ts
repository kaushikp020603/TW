import { SITE } from "@/config/site";

export const DOCS: Record<string, { title: string; body: string[] }> = {
  privacy: { title: "Privacy Policy", body: [
    "Spill the Cards collects only what you choose to send. Booking details (name, service, date, time, notes) are placed into a WhatsApp message that you send yourself; they are not stored on our servers.",
    "Your recent booking requests and any question you type into the reading tool are kept only in your own browser (local storage) and can be cleared by clearing your site data.",
    "If the optional AI Oracle is enabled, the messages you type there are sent to the AI provider to generate a reply. Don't share sensitive personal information in the chat.",
    `For questions or deletion requests, message us on WhatsApp at ${SITE.whatsappDisplay}.`] },
  terms: { title: "Terms & Conditions", body: [
    "Readings and bookings are arranged directly over WhatsApp. A slot is confirmed only after the reader replies to your request.",
    "Payment is arranged manually over WhatsApp. Prices shown on the site are subject to confirmation.",
    "Rescheduling or cancelling: please message on WhatsApp as early as possible.",
    "Tarot readings are for personal reflection and entertainment only."] },
  disclaimer: { title: "Tarot Disclaimer", body: [
    "Tarot readings, whether automated or personal, are for reflection and entertainment. They are not predictions or guarantees of any outcome.",
    "Nothing on this website is medical, legal, financial or psychological advice. Please consult a qualified professional for such matters.",
    "You remain responsible for your own decisions."] },
};
