"use client";
import { create } from "zustand";

export type Lang = "en" | "hi" | "kn";

const dicts: Record<Lang, Record<string, string>> = {
  en: {
    "nav.overview": "Overview",
    "nav.analytics": "Fraud Analytics",
    "nav.transactions": "Transactions",
    "nav.alerts": "Alerts",
    "nav.cases": "Cases",
    "nav.models": "Model Performance",
    "nav.explain": "Explain AI",
    "nav.data": "Data Explorer",
    "nav.reports": "Reports",
    "nav.registry": "Model Registry",
    "nav.audit": "Audit Log",
    "nav.settings": "Settings",
    "nav.help": "Help",
    "common.search": "Search",
    "common.signout": "Sign out",
    "common.loading": "Loading…",
    "common.empty": "No data available",
    "common.error": "Something went wrong",
    "overview.title": "Risk Overview",
    "overview.subtitle": "Monitor transaction activity, fraud signals and investigation workload.",
    "model.disclaimer":
      "Model predictions are review signals — not confirmed fraud.",
  },
  hi: {
    "nav.overview": "अवलोकन",
    "nav.analytics": "धोखाधड़ी विश्लेषिकी",
    "nav.transactions": "लेन-देन",
    "nav.alerts": "अलर्ट",
    "nav.cases": "मामले",
    "nav.models": "मॉडल प्रदर्शन",
    "nav.explain": "मॉडल व्याख्या",
    "nav.data": "डेटा अन्वेषक",
    "nav.reports": "रिपोर्ट",
    "nav.registry": "मॉडल रजिस्ट्री",
    "nav.audit": "ऑडिट लॉग",
    "nav.settings": "सेटिंग्स",
    "nav.help": "सहायता",
    "common.search": "खोजें",
    "common.signout": "साइन आउट",
    "common.loading": "लोड हो रहा है…",
    "common.empty": "कोई डेटा उपलब्ध नहीं",
    "common.error": "कुछ गलत हो गया",
    "overview.title": "जोखिम अवलोकन",
    "overview.subtitle": "लेन-देन गतिविधि, धोखाधड़ी संकेत और जाँच कार्यभार की निगरानी करें।",
    "model.disclaimer":
      "मॉडल भविष्यवाणियाँ समीक्षा संकेत हैं — पुष्ट धोखाधड़ी नहीं।",
  },
  kn: {
    "nav.overview": "ಅವಲೋಕನ",
    "nav.analytics": "ವಂಚನೆ ವಿಶ್ಲೇಷಣೆ",
    "nav.transactions": "ವಹಿವಾಟುಗಳು",
    "nav.alerts": "ಎಚ್ಚರಿಕೆಗಳು",
    "nav.cases": "ಪ್ರಕರಣಗಳು",
    "nav.models": "ಮಾದರಿ ಕಾರ್ಯಕ್ಷಮತೆ",
    "nav.explain": "ಮಾದರಿ ವಿವರಣೆ",
    "nav.data": "ಡೇಟಾ ಎಕ್ಸ್‌ಪ್ಲೋರರ್",
    "nav.reports": "ವರದಿಗಳು",
    "nav.registry": "ಮಾದರಿ ನೋಂದಣಿ",
    "nav.audit": "ಆಡಿಟ್ ಲಾಗ್",
    "nav.settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "nav.help": "ಸಹಾಯ",
    "common.search": "ಹುಡುಕಿ",
    "common.signout": "ಸೈನ್ ಔಟ್",
    "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    "common.empty": "ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
    "common.error": "ಏನೋ ತಪ್ಪಾಗಿದೆ",
    "overview.title": "ಅಪಾಯ ಅವಲೋಕನ",
    "overview.subtitle": "ವಹಿವಾಟು ಚಟುವಟಿಕೆ, ವಂಚನೆ ಸಿಗ್ನಲ್‌ಗಳು ಮತ್ತು ತನಿಖಾ ಹೊರೆಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
    "model.disclaimer":
      "ಮಾದರಿ ಮುನ್ಸೂಚನೆಗಳು ಪರಿಶೀಲನಾ ಸಂಕೇತಗಳು — ದೃಢಪಡಿಸಿದ ವಂಚನೆ ಅಲ್ಲ.",
  },
};

type I18nState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

export const useI18n = create<I18nState>((set, get) => ({
  lang: "en",
  setLang: (l) => {
    if (typeof window !== "undefined") localStorage.setItem("fraudiq_lang", l);
    set({ lang: l });
  },
  t: (key) => {
    const l = get().lang;
    return dicts[l]?.[key] ?? dicts.en[key] ?? key;
  },
}));

export function bootstrapI18n() {
  if (typeof window === "undefined") return;
  const stored = (localStorage.getItem("fraudiq_lang") as Lang) || "en";
  useI18n.getState().setLang(stored);
}
