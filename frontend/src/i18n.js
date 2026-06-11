import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const RTL_LANGS = ["ar"];

const resources = {
  en: { translation: {
    brand: "Modern Oriental Resin Art",
    sub: "Handmade creations that bring elegance and warmth to your space.",
    shop: "Shop Now", story: "Discover the Story",
    nav: { home: "Home", shop: "Shop", about: "About", contact: "Contact" },
    rights: "All rights reserved."
  }},
  fr: { translation: {
    brand: "Art en résine oriental moderne",
    sub: "Des créations artisanales qui apportent élégance et chaleur à votre intérieur.",
    shop: "Acheter maintenant", story: "Découvrir notre histoire",
    nav: { home: "Accueil", shop: "Boutique", about: "À propos", contact: "Contact" },
    rights: "Tous droits réservés."
  }},
  ar: { translation: {
    brand: "فنّ رَزّين شرقي بلمسة عصرية",
    sub: "قطع يدوية تضيف أناقة ودفئًا إلى مساحتك.",
    shop: "تسوّق الآن", story: "اكتشف الحكاية",
    nav: { home: "الرئيسية", shop: "المتجر", about: "من نحن", contact: "تواصل" },
    rights: "جميع الحقوق محفوظة."
  }},
};

i18n.use(initReactI18next).init({
  resources, lng: "en", fallbackLng: "en",
  interpolation: { escapeValue: false },
});
export default i18n;
