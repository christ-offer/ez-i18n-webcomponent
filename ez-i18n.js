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

    // Handle HTMX content updates
    document.body.addEventListener('htmx:afterSettle', () => {
      this.updateContent();
    });

    // Initialize with browser language or stored preference
    const storedLang = localStorage.getItem("preferred-lang");
    if (storedLang && this.select.querySelector(`option[value="${storedLang}"]`)) {
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
        })
      );
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  updateContent() {
    // Handle text content (existing functionality)
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.getNestedTranslation(
        this.translations[this.currentLang],
        key
      );
      if (translation) {
        // Special case for meta tags
        if (element.tagName === 'META') {
          element.setAttribute('content', translation);
        } else {
          element.textContent = translation;
        }
      }
    });

    // Handle placeholders
    const placeholderElements = document.querySelectorAll("[data-i18n-placeholder]");
    placeholderElements.forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      const translation = this.getNestedTranslation(
        this.translations[this.currentLang],
        key
      );
      if (translation) {
        element.setAttribute("placeholder", translation);
      }
    });

    // Handle validation messages
    const formElements = document.querySelectorAll("[data-i18n-error]");
    formElements.forEach((element) => {
      const key = element.getAttribute("data-i18n-error");
      const translation = this.getNestedTranslation(
        this.translations[this.currentLang],
        key
      );
      if (translation) {
        element.setCustomValidity(translation);
      }
    });

    // Handle alt text
    const altElements = document.querySelectorAll("[data-i18n-alt]");
    altElements.forEach((element) => {
      const key = element.getAttribute("data-i18n-alt");
      const translation = this.getNestedTranslation(
        this.translations[this.currentLang],
        key
      );
      if (translation) {
        element.setAttribute("alt", translation);
      }
    });

    // Handle aria-label
    const ariaElements = document.querySelectorAll("[data-i18n-aria-label]");
    ariaElements.forEach((element) => {
      const key = element.getAttribute("data-i18n-aria-label");
      const translation = this.getNestedTranslation(
        this.translations[this.currentLang],
        key
      );
      if (translation) {
        element.setAttribute("aria-label", translation);
      }
    });

    // Handle basic numbers
    const numberElements = document.querySelectorAll("[data-i18n-number]");
    numberElements.forEach((element) => {
      if (!element.hasAttribute('data-original-number')) {
        element.setAttribute('data-original-number', element.textContent);
      }

      const originalNumber = element.getAttribute('data-original-number');
      if (originalNumber.length > 16) {
        console.warn(`Number ${originalNumber} is too large for precise handling - displaying original number`);
        element.textContent = originalNumber;
        return;
      }

      const number = parseFloat(originalNumber);
      if (!isNaN(number)) {
        element.textContent = new Intl.NumberFormat(this.currentLang).format(number);
      }
    });

    // Handle currency
    const currencyElements = document.querySelectorAll("[data-i18n-currency]");
    currencyElements.forEach((element) => {
      if (!element.hasAttribute('data-original-number')) {
        element.setAttribute('data-original-number', element.textContent);
      }

      const originalNumber = element.getAttribute('data-original-number');
      const number = parseFloat(originalNumber);
      if (!isNaN(number)) {
        const currency = element.getAttribute("data-i18n-currency").toUpperCase();
        element.textContent = new Intl.NumberFormat(this.currentLang, {
          style: 'currency',
          currency: currency
        }).format(number);
      }
    });
  }

  // Helper function to handle nested translation keys (e.g., "action.submit")
  getNestedTranslation(obj, path) {
    // Try to get the translation
    const translation = path.split(".").reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);

    // If we found a translation, use it
    if (translation) {
      return translation;
    }

    // If no translation found, return obvious error message
    return `Missing translation for "${path}"`;
  }
}

// Register the web component
customElements.define("ez-i18n", I18nSelector);
