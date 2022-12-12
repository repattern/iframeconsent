/*

This tool is used to dynamically load an iframe, after the user has given consent.
It can show a preview, provide a link to e.g. privacy policy, and a button to load the iframe.

This tool is provided as custom component which gets autoloaded

*/

(function () {
    let translations = {
        "load_now_button": {
            en: "Load this content",
            de: "Diesen Inhalt laden",
            fr: "Charger maintenant le contenu",
            it: "Caricare ora questo contenuto",
        },
        "privacy_policy": {
            en: "Privacy policy",
            de: "Datenschutzerklärung",
            fr: "Politique de confidentialité",
            it: "Politica sulla privacy",
        },
        "external_content": {
            en: "The website contains external content. By clicking on the button, you agree to the use of cookies and the transfer of data to the provider of the external content.",
            de: "Die Website enthält externe Inhalte. Durch das Klicken auf den Button wird der Verarbeitung von Cookies und der Übermittlung von Daten an den Anbieter des externen Inhalts zugestimmt.",
            fr: "Le site contient du contenu externe. En cliquant sur le bouton, l'utilisation de cookies et le transfert de données au fournisseur du contenu externe sont acceptés.",
            it: "Il sito contiene contenuti esterni. Facendo clic sul pulsante, si accetta l'utilizzo di cookie e il trasferimento di dati al fornitore del contenuto esterno.",
        },
        "load_all_label": {
            en: "Load all external content on this website",
            de: "Alle externen Inhalte auf dieser Seite laden",
            fr: "Charger tout le contenu externe sur ce site",
            it: "Caricare tutto il contenuto esterno su questo sito",
        },
        "save_choice_label": {
            en: "Don't ask me for {{cookie_expiration_days}} days (functional cookie)",
            de: "Für {{cookie_expiration_days}} Tage nicht mehr fragen (Funktionscookie)",
            fr: "Ne plus me demander pendant {{cookie_expiration_days}} jours (cookie fonctionnel)",
            it: "Non chiedermelo per {{cookie_expiration_days}} giorni (cookie funzionale)",
        },
        "load_all_button": {
            en: "Load all content",
            de: "Alle Inhalte laden",
            fr: "Charger tout le contenu",
            it: "Caricare tutti i contenuti",
        },
    };
    let getText = function (key, lang, replacements) {
        if (translations[key] && translations[key][lang]) {
            return translations[key][lang].replace(/{{([^}]*)}}/g, function (match, p1) {
                return replacements[p1];
            });
        }
        if (translations[key]) {
            return translations[key]["en"].replace(/{{([^}]*)}}/g, function (match, p1) {
                return replacements[p1];
            });
        }
        return "";
    };
    class IframeConsent extends HTMLElement {
        constructor() {
            super();
            window.iframeConsent = window.iframeConsent || {
                ver: "iframeconsent by RePattern",
                load: function (id, nocheck) {
                    try {
                        let iframecomponent = document.getElementById(id);
                        if (iframecomponent) {
                            // check if the checkbox is checked
                            let checkbox = iframecomponent.shadowRoot.querySelector("#iframe-consent__load_all_checkbox");
                            if (checkbox && checkbox.checked && !nocheck) {
                                // call loadAll
                                window.iframeConsent.loadAll();
                            } else {
                                // load the content of the component
                                iframecomponent.outerHTML = '<iframe ' + iframecomponent.getAttribute("data-iframe-attributes") + '></iframe>';
                            }
                            // check if the iframe-consent__save_choice_checkbox is checked
                            let savechoice = iframecomponent.shadowRoot.querySelector("#iframe-consent__save_choice_checkbox");
                            if (savechoice && savechoice.checked) {
                                // save the choice in a cookie
                                let date = new Date();
                                date.setTime(date.getTime() + (15 * 24 * 60 * 60 * 1000));
                                let expires = "expires=" + date.toUTCString();
                                // if nocheck, then set the id to "all"
                                if (nocheck) {
                                    id = "all";
                                }
                                // if a cookie with the same name already exists, add the id to the cookie
                                let cookie = document.cookie.match(/repattern_iframeconsent=([^;]*)/);
                                if (cookie) {
                                    id = cookie[1] + "," + id;
                                }
                                document.cookie = "repattern_iframeconsent=" + id + "; " + expires + "; path=/";
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                },
                iframeConsents: [],
                loadAll: function () {
                    for (let i = 0; i < this.iframeConsents.length; i++) {
                        this.load(this.iframeConsents[i], true);
                    }
                },
                flipButton: function (id) {
                    let iframecomponent = document.getElementById(id);
                    if (iframecomponent) {
                        let button = iframecomponent.shadowRoot.querySelector(".iframe-consent__load_button");
                        if (button) {
                            let checkbox = iframecomponent.shadowRoot.querySelector("#iframe-consent__load_all_checkbox");
                            if (checkbox && checkbox.checked) {
                                button.innerHTML = getText("load_all_button", iframecomponent.getAttribute("data-language"));
                            } else {
                                button.innerHTML = getText("load_now_button", iframecomponent.getAttribute("data-language"));
                            }
                        }
                    }
                }
            };
        }
        connectedCallback() {
            // load all attributes set on the component
            // the the browser preferred language
            this.attachShadow({ mode: 'open' });
            this.language = this.getAttribute('data-language') || navigator.language.substring(0, 2);
            this.custom_text = this.getAttribute('data-custom-text') || getText("external_content", this.language);
            this.additional_text = this.getAttribute('data-additional-text') || "";
            this.privacy_policy_src = this.getAttribute('data-privacy-policy-src') || "";
            this.preview_src = this.getAttribute('data-preview-src') || "";
            this.cookieExpirationDays = this.getAttribute('data-cookie-expiration-days') || 15;
            // get the src="" attribute of the iframe out of the attribute "data-iframe-attributes"
            this.iframe_src = this.getAttribute('data-iframe-attributes').match(/src="([^"]*)"/)[1] || "";
            if (this.iframe_src == "") {
                console.error("iframeconsent: no src attribute found in data-iframe-attributes");
                return;
            }
            // extract the domain from this.iframe_src
            this.iframe_domain = this.iframe_src.match(/:\/\/(.[^/]+)/)[1] || "";
            // the code to be loaded is included in the component's content
            this.privacy_policy_text = this.getAttribute('data-privacy-policy-text') || getText("privacy_policy", this.language);
            // generate unique id based on the this.iframe_src attribute
            // remove all slashes dots and colons
            var helper = this.iframe_src.replace(/[/.:]/g, "");
            // make it lowercase
            helper = helper.toLowerCase();
            var finalHelper = "iframeconsent-" + helper;

            // var helper = "iframeconsent-" + Math.random().toString(36).substring(2, 9);
            // check if this id already exists in the main dom
            let index = 1;
            while (document.getElementById(finalHelper) != null) {
                finalHelper = "iframeconsent-" + helper + index;
                index++;
            }
            this.id = finalHelper;
            // if this is not already in the list of iframeconsents, add it
            if (window.iframeConsent.iframeConsents.indexOf(this.id) == -1) {
                window.iframeConsent.iframeConsents.push(this.id);
            }

            // check if the browser has saved any cookies that start with repatter_iframeconsent
            let cookie = document.cookie.match(/repattern_iframeconsent=([^;]*)/);
            if (cookie) {
                // if the cookie is set to "all", then load all iframeconsents
                if (cookie[1] === "all") {
                    window.iframeConsent.loadAll();
                    return;
                } else {
                    // load the iframeconsent with the id that is saved in the cookie
                    // check if the cookie contains multiple ids
                    let ids = cookie[1].split(",");
                    for (let i = 0; i < ids.length; i++) {
                        window.iframeConsent.load(ids[i]);
                    }
                    return;
                }
            }

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
                                max-width: 90vw;
                                max-height: 90vh;
                            }
                            .iframe-consent__preview {
                                width: 100%;
                                height: 100%;
                                position: absolute;
                                top: 0;
                                left: 0;
                            }
                            .iframe-consent__preview img {
                                width: 100%;
                                height: 100%;
                                object-fit: contain;
                                opacity: 0.2;
                            }
                            .iframe-consent__message {
                                position: relative;
                                max-width: 90%;
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
            if (this.additional_text) {
                html += `<p>${this.additional_text}</p>`;
            }
            if (this.privacy_policy_src) {
                html += `<p><a class="iframe-consent__link" href="${this.privacy_policy_src}" target="_blank">${this.privacy_policy_text}</a></p>
                `;
            }
            html += `<p>
                        <label for="iframe-consent__load_all_checkbox"><i>${getText("load_all_label", this.language)}</i></label>
                        <input onchange="iframeConsent.flipButton('`+ this.id + `');" type="checkbox" id="iframe-consent__load_all_checkbox" />
                    <br>
                        <label for="iframe-consent__save_choice_checkbox"><i>${getText("save_choice_label", this.language, {'cookie_expiration_days':this.cookieExpirationDays})}</i></label>
                        <input type="checkbox" id="iframe-consent__save_choice_checkbox" />
                    </p>
                    <p>
                        <button title="`+ this.iframe_src + `" onclick="iframeConsent.load('` + this.id + `');" class="iframe-consent__load_button">${getText("load_now_button", this.language)}</button>
                    <br>
                        <small style="align:center"><i>`+ this.iframe_domain + `</i></small>
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