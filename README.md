# ez-i18n Web Component

Designed specifically for use with [htmx](https://htmx.org/) - Will work for static html. Framworks - no support guaranteed, you have your own stuff.

This is a basic yet "good enough for me" web component that allows for easily doing i18n on static websites.
Idea was born out of wondering how to do i18n on my supabase/htmx stack.

It sets the preferred-lang in localStorage, so that it is kept across page reloads.

Currently uses the `htmx:afterSettle` event to update the content for dynamic content support. Basic, but does the trick for now.

```js
// Handle HTMX content updates
document.body.addEventListener("htmx:afterSettle", () => {
  this.updateContent();
});
```

## Usage

#### Labels:

- `data-i18n` attribute - will replace the textContent of the element with the translation.
- `data-i18n-placeholder` - will replace the placeholder attribute of the element with the translation.
- `data-i18n-alt` - will replace the alt attribute of the element with the translation.
- `data-i18n-aria-label` - will replace the aria-label attribute of the element with the translation.

Usage with meta tags:

```html
<meta
  name="description"
  data-i18n="meta.description"
  content="Default description"
/>
```

#### Markup:

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
      const i18n = document.querySelector("ez-i18n");
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

This is slightly annoying, but it is still semantically correct markup and keeps the logic of the component very simple.
