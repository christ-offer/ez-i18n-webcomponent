# ez-i18n Web Component

This is a basic yet fairly powerful web component that allows for easily doing i18n on static websites.

## Usage

We set the element as hidden by default - so that it wont show up in the DOM if the user has disabled JS.
It will then fall back to the hardcoded HTML strings

```html
<html>
  <head>
    <script src="ez-i18n.js"></script>
  </head>
  <body>
    <ez-i18n hidden>
      <select>
        <option data-i18n="lang.english" value="en">English</option>
        <option data-i18n="lang.spanish" value="es">Spanish</option>
        <option data-i18n="lang.french" value="fr">French</option>
      </select>
    </ez-i18n>
    <h1 data-i18n="welcome">Welcome</h1>
    <p data-i18n="about">
      This is a relatievely simple i18n web-component - it works for me.
    </p>
  </body>
  <script>
    const translations = {
      en: {
        lang: {
          english: "English",
          spanish: "Spanish",
          french: "French",
        },
        welcome: "Welcome",
        about:
          "This is a relatively simple i18n web-component - it works for me.",
      },
      es: {
        lang: {
          english: "Inglés",
          spanish: "Español",
          french: "Francés",
        },
        welcome: "Bienvenido",
        about:
          "Este es un componente relativamente simple de i18n - funciona para mí.",
      },
      fr: {
        lang: {
          english: "Anglais",
          spanish: "Espagnol",
          french: "Français",
        },
        welcome: "Bienvenue",
        about:
          "C'est un composant relativement simple de i18n - ça marche pour moi.",
      },
    };
    document.addEventListener("DOMContentLoaded", () => {
      const i18n = document.querySelector("i18n-selector");
      i18n.addLanguages(translations);

      // Example of listening to language changes
      i18n.addEventListener("languageChanged", (e) => {
        console.log(`Language changed to: ${e.detail.language}`);
      });
    });
  </script>
</html>
```

# Limitations

- Does not supported nested elements in the markup

This example, will translate hello world - but will not translate whatever comes after the span:

```html
<p data-i18n="about">
  Hello <span data-i18n="name">World</span> - How are you?
</p>
```

Workaround for this - put each span of text, you guessed it, inside a span:

```html
<p data-i18n="about">
  <span data-i18n="hello">Hello</span>
  <span data-i18n="name">World - </span>
  <span data-i18n="how">How are you?</span>
</p>
```

This is a slight workaround, but it is still semantically correct markup and keeps the logic of the component very simple.
