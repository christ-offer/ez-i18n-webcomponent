class I18nSelector extends HTMLElement {
  static ATTRIBUTE_HANDLERS = [
    {
      selector: "[data-i18n]",
      getAttribute: (el) => el.getAttribute("data-i18n"),
      updateElement: (el, translation) => {
        if (el.tagName === "META") {
          el.setAttribute("content", translation);
        } else {
          el.textContent = translation;
        }
      },
    },
    {
      selector: "[data-i18n-placeholder]",
      getAttribute: (el) => el.getAttribute("data-i18n-placeholder"),
      updateElement: (el, translation) =>
        el.setAttribute("placeholder", translation),
    },
    {
      selector: "[data-i18n-error]",
      getAttribute: (el) => el.getAttribute("data-i18n-error"),
      updateElement: (el, translation) => el.setCustomValidity(translation),
    },
    {
      selector: "[data-i18n-alt]",
      getAttribute: (el) => el.getAttribute("data-i18n-alt"),
      updateElement: (el, translation) => el.setAttribute("alt", translation),
    },
    {
      selector: "[data-i18n-aria-label]",
      getAttribute: (el) => el.getAttribute("data-i18n-aria-label"),
      updateElement: (el, translation) =>
        el.setAttribute("aria-label", translation),
    },
  ];

  static MAX_SAFE_NUMBER_LENGTH = 15;

  constructor() {
    super();
    this.translations = {};
    this.currentLang = "en";
    this.cachedElements = null;
    this.isContentCached = false;
    this.translationCache = new Map();
    this.handleLanguageChange = null;
    this.handleHtmxUpdate = null;
  }

  connectedCallback() {
    this.removeAttribute("hidden");
    this.select = this.querySelector("select");
    if (!this.select) return;

    // Bind methods to maintain context
    this.handleLanguageChange = (e) => this.setLanguage(e.target.value);
    this.handleHtmxUpdate = () => {
      this.invalidateCache();
      this.updateContent();
    };

    this.select.addEventListener("change", this.handleLanguageChange);
    document.body.addEventListener("htmx:afterSettle", this.handleHtmxUpdate);

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

  disconnectedCallback() {
    if (this.select && this.handleLanguageChange) {
      this.select.removeEventListener("change", this.handleLanguageChange);
    }
    if (this.handleHtmxUpdate) {
      document.body.removeEventListener(
        "htmx:afterSettle",
        this.handleHtmxUpdate,
      );
    }
    this.invalidateCache();
  }

  cacheElements() {
    if (this.isContentCached) return;

    this.cachedElements = {
      numberElements: document.querySelectorAll("[data-i18n-number]"),
      currencyElements: document.querySelectorAll("[data-i18n-currency]"),
    };
    this.isContentCached = true;
  }

  invalidateCache() {
    this.isContentCached = false;
    this.cachedElements = null;
  }

  addLanguages(translations) {
    if (!translations || typeof translations !== "object") {
      console.warn("Invalid translations object provided");
      return;
    }

    Object.assign(this.translations, translations);
    this.invalidateCache();
    this.updateContent();
  }

  addLanguage(lang, translations) {
    if (!lang || typeof lang !== "string") {
      console.warn("Invalid language code provided:", lang);
      return;
    }

    if (!translations || typeof translations !== "object") {
      console.warn("Invalid translations object provided for language:", lang);
      return;
    }

    this.translations[lang] = translations;
    this.invalidateCache();
    this.updateContent();
  }

  setLanguage(lang) {
    if (!lang || typeof lang !== "string") {
      console.warn("Invalid language code provided:", lang);
      return false;
    }

    if (!this.translations[lang]) {
      console.warn(`Translation for language '${lang}' not found`);
      return false;
    }

    this.currentLang = lang;
    try {
      localStorage.setItem("preferred-lang", lang);
    } catch (e) {
      console.warn("Could not save language preference to localStorage:", e);
    }

    this.updateContent();
    this.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: { language: lang },
        bubbles: true,
      }),
    );
    return true;
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  updateContent() {
    this.updateTextContent();
    this.updateNumbers();
  }

  updateTextContent() {
    const currentTranslations = this.translations[this.currentLang];
    if (!currentTranslations) return;

    for (const handler of I18nSelector.ATTRIBUTE_HANDLERS) {
      const elements = document.querySelectorAll(handler.selector);
      for (const element of elements) {
        const key = handler.getAttribute(element);
        if (!key) continue;

        const translation = this.getNestedTranslation(currentTranslations, key);
        if (translation) {
          handler.updateElement(element, translation);
        }
      }
    }
  }

  updateNumbers() {
    this.updateNumberElements();
    this.updateCurrencyElements();
  }

  updateNumberElements() {
    const elements = document.querySelectorAll("[data-i18n-number]");
    for (const element of elements) {
      this.processNumberElement(element, (num) =>
        new Intl.NumberFormat(this.currentLang).format(num),
      );
    }
  }

  updateCurrencyElements() {
    const elements = document.querySelectorAll("[data-i18n-currency]");
    for (const element of elements) {
      const currency = element
        .getAttribute("data-i18n-currency")
        ?.toUpperCase();
      if (!currency) continue;

      this.processNumberElement(element, (num) =>
        new Intl.NumberFormat(this.currentLang, {
          style: "currency",
          currency: currency,
        }).format(num),
      );
    }
  }

  processNumberElement(element, formatter) {
    if (!element.hasAttribute("data-original-number")) {
      element.setAttribute("data-original-number", element.textContent.trim());
    }

    const originalNumber = element.getAttribute("data-original-number");

    if (originalNumber.length > I18nSelector.MAX_SAFE_NUMBER_LENGTH) {
      console.warn(
        `Number ${originalNumber} exceeds safe length - displaying original`,
      );
      element.textContent = originalNumber;
      return;
    }

    const number = Number.parseFloat(originalNumber);
    if (Number.isNaN(number)) {
      console.warn(`Invalid number format: ${originalNumber}`);
      return;
    }

    try {
      element.textContent = formatter(number);
    } catch (e) {
      console.warn(`Error formatting number ${originalNumber}:`, e);
      element.textContent = originalNumber;
    }
  }

  getNestedTranslation(obj, path) {
    if (!obj || !path) return null;

    // Use cached path if available
    let pathArray = this.translationCache.get(path);
    if (!pathArray) {
      pathArray = path.split(".");
      this.translationCache.set(path, pathArray);
    }

    let result = obj;
    for (const key of pathArray) {
      result = result?.[key];
      if (result === undefined) break;
    }

    // If we found a translation, use it
    if (result !== undefined && result !== null) {
      return result;
    }

    // If no translation found, return obvious error message
    return `Missing translation for "${path}"`;
  }
}

// Register the web component
customElements.define("ez-i18n", I18nSelector);
