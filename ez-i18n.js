class I18nSelector extends HTMLElement {
  constructor() {
    super();
    this.translations = {};
    this.currentLang = "en";
  }

  connectedCallback() {
    this.removeAttribute("hidden");
    // Get the select element
    this.select = this.querySelector("select");
    if (!this.select) return;

    // Setup event listener
    this.select.addEventListener("change", (e) => {
      this.setLanguage(e.target.value);
    });

    // Initialize with browser language or stored preference
    const storedLang = localStorage.getItem("preferred-lang");
    if (
      storedLang &&
      this.select.querySelector(`option[value="${storedLang}"]`)
    ) {
      this.currentLang = storedLang;
      this.select.value = storedLang;
    }
  }

  addLanguages(translations) {
    this.translations = { ...this.translations, ...translations };
    this.updateContent();
  }

  addLanguage(lang, translations) {
    this.translations[lang] = translations;
    this.updateContent();
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem("preferred-lang", lang);
      this.updateContent();
      this.dispatchEvent(
        new CustomEvent("languageChanged", {
          detail: { language: lang },
          bubbles: true,
        }),
      );
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  updateContent() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.getNestedTranslation(
        this.translations[this.currentLang],
        key,
      );
      if (translation) {
        element.textContent = translation;
      }
    });
  }

  // Helper function to handle nested translation keys (e.g., "action.submit")
  getNestedTranslation(obj, path) {
    return path.split(".").reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  }
}

// Register the web component
customElements.define("i18n-selector", I18nSelector);
