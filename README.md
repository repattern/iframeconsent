# iframeconsent
Load iframes only when a user agrees

Attributes:
- data-iframe-attributes: just add the iframe attributes (without the iframe), this is mandatory
- data-language: use this if you want to force a language, otherwise the browser preferred language is used, optional
- data-preview-src: this is the preview image used on the background, optional
- data-privacy-policy-src: Add a link (opens in a new tab) to your privacy policy, optional
- data-privacy-policy-text: If you want to change the Link text to the privacy policy, optional
- data-additional-text: Used to add additional own text, e.g. explaining what you are embedding, optional
- data-custom-text: Replace the whole text displayed with your own, optional

## Usage example

```html
<head>
    <meta charset="utf-8">
    <title>Test iframeconsent</title>
    <script src="https://dev.repattern.de/iframeconsent/iframeconsent.js"></script>
</head>

<body>
    <div style="width:700px; height:auto">
        <iframe-consent data-language="de"
            data-iframe-attributes='src="https://www.youtube.com/embed/8Qn_spdM5Zg" width="560" height="315" frameborder="0" allowfullscreen'
            data-preview-src="https://i.ytimg.com/vi/8Qn_spdM5Zg/maxresdefault.jpg"
            data-privacy-policy-src="https://www.google.com/intl/de/policies/privacy/"
            data-additional-text="Wir laden hier das Terminbuchungstool von Microsoft" />
    </div>
</body>
