/*

This tool is used to dynamically load an iframe, after the user has given consent.
It can show a preview, provide a link to e.g. privacy policy, and a button to load the iframe.

This tool is provided as custom component which gets autoloaded

*/

(function () {
    let translations = {
        "load_now_button": {
            en: "Load now",
            de: "Jetzt laden",
            fr: "Charger maintenant",
            it: "Carica ora",
        },
        "privacy_policy": {
            en: "Privacy policy",
            de: "Datenschutzerklärung",
            fr: "Politique de confidentialité",
            it: "Politica sulla privacy",
        },
        "external_content": {
            en: "The website contains external content. By clicking on the button, you agree to the use of cookies and the transfer of data to the provider of the external content.",
            de: "Die Website enthält externe Inhalte. Durch Klicken auf den Button stimmen Sie der Verarbeitung von Cookies und der Übermittlung von Daten an den Anbieter des externen Inhalts zu.",
            fr: "Le site contient du contenu externe. En cliquant sur le bouton, vous acceptez l'utilisation de cookies et le transfert de données au fournisseur du contenu externe.",
            it: "Il sito contiene contenuti esterni. Facendo clic sul pulsante, accetti l'utilizzo di cookie e il trasferimento di dati al fornitore del contenuto esterno.",
        }
    };
    let getText = function (key, lang) {
        if (translations[key] && translations[key][lang]) {
            return translations[key][lang];
        }
        if (translations[key]) {
            return translations[key]["en"];
        }
        return "";
    };
    class IframeConsent extends HTMLElement {
        that = this
        constructor() {
            super();
            window.iframeConsent = {
                ver: "iframeconsent by RePattern",
                load: function (id) {
                    let iframecomponent = document.getElementById(id);
                    if (iframecomponent) {
                        // load the content of the component
                        iframecomponent.outerHTML = '<iframe ' + iframecomponent.getAttribute("data-iframe-attributes") + '></iframe>';
                    }
                }

            };
        }
        connectedCallback() {
            //this.textContent = 'Hello World!';
            // load all attributes set on the component
            // the the browser preferred language
            this.attachShadow({ mode: 'open' });
            this.language = this.getAttribute('data-language') || navigator.language.substring(0, 2);
            this.custom_text = this.getAttribute('data-custom-text') || getText("external_content", this.language);
            this.additional_text = this.getAttribute('data-additional-text') || "";
            this.privacy_policy_src = this.getAttribute('data-privacy-policy-src') || "";
            this.preview_src = this.getAttribute('data-preview-src') || "";
            // the code to be loaded is included in the component's content
            this.privacy_policy_text = this.getAttribute('data-privacy-policy-text') || getText("privacy_policy", this.language);
            // generate unique id
            var helper = "iframeconsent-" + Math.random().toString(36).substring(2, 9);
            // check if this id already exists in the main dom
            while (document.getElementById(helper) != null) {
                helper = "iframeconsent-" + Math.random().toString(36).substring(2, 9);
            }
            this.id = helper;

            // prepare the html for showing the consent message
            let html = `
                <html>
                    <head>
                        <style>
                            .iframe-consent {
                                position: relative;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                background-color: #fff;
                                color: #000;
                                padding: 1rem;
                            }
                            .iframe-consent__preview {
                                width: 100%;
                                height: 100%;
                                position: absolute;
                                top: 0;
                                left: 0;
                                z-index: 1;
                            }
                            .iframe-consent__preview img {
                                width: 100%;
                                height: 100%;
                                object-fit: contain;
                                opacity: 0.2;
                            }
                            .iframe-consent__message {
                                position: relative;
                                z-index: 2;
                                max-width: 600px;
                                text-align: center;
                            }
                            /* button */
                            .iframe-consent__button {
                                background-color: #000;
                                color: #fff;
                                border: none;
                                padding: 1rem 2rem;
                                margin: 1rem;
                                cursor: pointer;
                            }
                            .iframe-consent__button:hover {
                                background-color: #333;
                            }
                            /* link */
                            .iframe-consent__link {
                                color: #000;
                                text-decoration: underline;
                            }
                            .iframe-consent__link:hover {
                                color: #333;
                            }
                        </style>
                    </head>
                <body>
                    <div class="iframe-consent">
                        <div class="iframe-consent__preview">`;
            if (this.preview_src) {
                html += `<img src="${this.preview_src}" />`;
            }
            html += `</div>
                        <div class="iframe-consent__message">
                            <p>${this.custom_text}</p>
                            `;
            if (this.additional_text){
                html += `<p>${this.additional_text}</p>`;
            }
            if (this.privacy_policy_src) {
                html += `<p><a class="iframe-consent__link" href="${this.privacy_policy_src}" target="_blank">${this.privacy_policy_text}</a></p>
                `;
            }
            html += `<p>
                        <button onclick="iframeConsent.load('`+ this.id + `');" class="iframe-consent__load-button">${getText("load_now_button", this.language)}</button>
                    </p>
                </div>
                </div>
                </body>
                </html>
            `;
            this.shadowRoot.innerHTML = html;
        }
    }
    customElements.define('iframe-consent', IframeConsent);
})();