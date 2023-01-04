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
            en: "External content: By clicking on the button, you agree to the use of cookies and the transfer of data to the provider of the external content.",
            de: "Externe Inhalte: Durch das Klicken auf den Button wird der Verarbeitung von Cookies und der Übermittlung von Daten an den Anbieter des externen Inhalts zugestimmt.",
            fr: "Contenu externe: En cliquant sur le bouton, l'utilisation de cookies et le transfert de données au fournisseur du contenu externe sont acceptés.",
            it: "Contenuti esterni: Facendo clic sul pulsante, si accetta l'utilizzo di cookie e il trasferimento di dati al fornitore del contenuto esterno.",
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
                ver: "iFrame Consent by RePattern",
                cookieConsents: false,
                resizeDiv:function(id, preview_src) {
                    // calculate the height for the div, if the image is cut off
                    // get the real image size
                    let img = new Image();
                    img.onload = function() {
                        // get height of the div .iframe-consent
                        let width = img.width;
                        let height = img.height;    
                        let iframecomponent = document.getElementById(id);
                        let iframeConsentEl = iframecomponent.shadowRoot.querySelector(".iframe-consent");
                        let iframeConsentHeight = iframeConsentEl.offsetHeight;
                        let iframeConsentWidth = iframeConsentEl.offsetWidth;
                        let ratio = width / iframeConsentWidth;
                        if (iframeConsentHeight<height/ratio){
                            iframeConsentEl.style.height = (height/ratio) + "px";
                        }
                    };
                    img.src = preview_src;
                },
                load: function (id, nocheck) {
                    try {
                        let iframecomponent = document.getElementById(id);
                        if (iframecomponent) {
                            // check if the checkbox is checked
                            let checkbox = iframecomponent.shadowRoot.querySelector("#iframe-consent__load_all_checkbox");
                            if (checkbox && checkbox.checked && !nocheck) {
                                // call loadAll
                                window.iframeConsent.loadAll();
                                return;
                            } else {
                                // load the content of the component
                                iframecomponent.outerHTML = '<iframe ' + iframecomponent.getAttribute("data-iframe-attributes") + '></iframe>';
                            }
                            // check if the iframe-consent__save_choice_checkbox is checked
                            let savechoice = iframecomponent.shadowRoot.querySelector("#iframe-consent__save_choice_checkbox");
                            if (savechoice && savechoice.checked) {
                                // save the choice in a cookie
                                let date = new Date();
                                date.setTime(date.getTime() + (this.cookieExpirationDays * 24 * 60 * 60 * 1000));
                                let expires = "expires=" + date.toUTCString();
                                // if nocheck, then set the id to "all"
                                // if a cookie with the same name already exists, add the id to the cookie
                                let cookie = document.cookie.match(/repattern_iframeconsent=([^;]*)/);
                                if (cookie) {
                                    id = cookie[1] + "," + id;
                                }
                                if (nocheck) {
                                    id = "all";
                                }
                                window.iframeConsent.cookieConsents = id;
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
            this.cookieExpirationDays = parseInt(this.getAttribute('data-cookie-expiration-days')) || 15;

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
                    window.iframeConsent.cookieConsents = "all";
                    window.iframeConsent.loadAll();
                    window.dispatchEvent(new CustomEvent('iframeConsentLoaded', { bubbles: true, composed: true }));
                    return;
                } else {
                    // load the iframeconsent with the id that is saved in the cookie
                    // check if the cookie contains multiple ids
                    let ids = cookie[1].split(",");
                    window.iframeConsent.cookieConsents = ids;
                    for (let i = 0; i < ids.length; i++) {
                        window.iframeConsent.load(ids[i]);
                    }
                    window.dispatchEvent(new CustomEvent('iframeConsentLoaded', { bubbles: true, composed: true }));
                    // if this.id is contained in ids, then return, because we don't need to show the consent message
                    if (ids.indexOf(this.id) != -1) {
                        return;
                    }
                }
            }

            // prepare the html for showing the consent message
            let html = `
                <html>
                    <head>
                        <style>
                        `;
            if (this.preview_src) {
                // bind resizeDiv to the current id and preview_src, create a function
                let resizeDivCall = new Function("window.iframeConsent.resizeDiv('" + this.id + "', '" + this.preview_src + "')");
                window.addEventListener("resize", resizeDivCall);
                window.addEventListener("load", resizeDivCall);
                
                let backgroundSize = "cover" || this.getAttribute('data-background-size');
                html += `.iframe-consent__image { 
                background-image: url('${this.preview_src}');
                background-size: ${backgroundSize};
                position: absolute;
                background-repeat: no-repeat;
                background-position: center;
                top: 0px;
                right: 0px;
                bottom: 0px;
                left: 0px;
                opacity: 0.15;}`;
            }
            html += 
                            `
                            .iframe-consent {
                                position: relative;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                padding: 3px;
                            }
                            .iframe-consent__message {
                                position: relative;
                                max-width: 99%;
                                text-align: center;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                line-height: 1em;
                                font-size: clamp(16pt, 1.5vw, 2rem);
                            }
                            /* button */
                            .iframe-consent__load_button {
                                border: 1px solid black;
                                padding: 1rem 2rem;
                                margin: 2px;
                                cursor: pointer;
                            }
                            .iframe-consent__load_button:hover {
                                filter: brightness(70%);
                            }
                            /* link */
                            .iframe-consent__link {
                                text-decoration: underline;
                            }
                            .iframe-consent__link:hover {
                                filter: brightness(70%);
                            }
                            label{
                                cursor: pointer;
                            }
                            /* add a very small logo on the bottom right corner */
                            .iframe-consent__logo {
                                position: absolute;
                                bottom: 0;
                                right: 0;
                                width: 2rem;
                                height: 2rem;
                            }
                        </style>
                    </head>
                <body>
                    <div class="iframe-consent">`;
            if (this.preview_src) {
                html += `<div class="iframe-consent__image"></div>`;
            }
            html += `<div class="iframe-consent__message">
                            ${this.custom_text}<br>
                            `;
            if (this.additional_text) {
                html += `${this.additional_text}<br>`;
            }
            if (this.privacy_policy_src) {
                html += `<a class="iframe-consent__link" href="${this.privacy_policy_src}" target="_blank">${this.privacy_policy_text}</a>
                `;
            }
            html += `
                        <label for="iframe-consent__load_all_checkbox"><i>${getText("load_all_label", this.language)}</i></label>
                        <input onchange="iframeConsent.flipButton('`+ this.id + `');" type="checkbox" id="iframe-consent__load_all_checkbox" />
                    <br>`;
            if (this.cookieExpirationDays > 0) {
                html += `
                        <label for="iframe-consent__save_choice_checkbox"><i>${getText("save_choice_label", this.language, { 'cookie_expiration_days': this.cookieExpirationDays })}</i></label>
                        <input type="checkbox" id="iframe-consent__save_choice_checkbox" />
                        `;
            }
            html += `
                    <br>
                        <button title="`+ this.iframe_src + `" onclick="iframeConsent.load('` + this.id + `');" class="iframe-consent__load_button">${getText("load_now_button", this.language)}</button>
                    <br>
                        <small style="align:center"><i>`+ this.iframe_domain + `</i></small>
                    
                    `;
                    // if the domain we are on is not repattern.de then show the repattern logo
                    if (window.location.hostname.indexOf("repattern.de") == -1) {
                        html+=`<a href="https://repattern.de" title="iFrame Consent powered by RePattern" class="iframe-consent__logo" target="_blank"><img class="iframe-consent__logo" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6b3NiPSJodHRwOi8vd3d3Lm9wZW5zd2F0Y2hib29rLm9yZy91cmkvMjAwOS9vc2IiCiAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyIKICAgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImZhdmljb24uc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjAgKDQwMzVhNGZiNDksIDIwMjAtMDUtMDEpIgogICBpZD0ic3ZnMTE5OSIKICAgdmVyc2lvbj0iMS4xIgogICB2aWV3Qm94PSIwIDAgMTQ5LjY3MDk2IDE0OS42NzA5NiIKICAgaGVpZ2h0PSIxNDkuNjcwOTZtbSIKICAgd2lkdGg9IjE0OS42NzA5Nm1tIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzMTE5MyI+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMC4wMDEwMjExNywwLDAsNi45OTUzNDUyZS00LC02Ni42MjEzNCwtMTMyLjY1NzAzKSIKICAgICAgIG9zYjpwYWludD0ic29saWQiCiAgICAgICBpZD0iUG9zaXRpb25pbmciPgogICAgICA8c3RvcAogICAgICAgICBpZD0ic3RvcDEwMDgiCiAgICAgICAgIG9mZnNldD0iMCIKICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzE2YTA4NTtzdG9wLW9wYWNpdHk6MTsiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKC0zMDUuNDY3NTksLTQzNC4zNzUzKSIKICAgICAgIG9zYjpwYWludD0ic29saWQiCiAgICAgICBpZD0iQWNjZWxlcmF0b3IiPgogICAgICA8c3RvcAogICAgICAgICBpZD0ic3RvcDEwMTQiCiAgICAgICAgIG9mZnNldD0iMCIKICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6IzJjM2U1MDtzdG9wLW9wYWNpdHk6MTsiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iNTciCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjExOTgiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxMjc0IgogICAgIGZpdC1tYXJnaW4tYm90dG9tPSIwIgogICAgIGZpdC1tYXJnaW4tcmlnaHQ9IjAiCiAgICAgZml0LW1hcmdpbi1sZWZ0PSIwIgogICAgIGZpdC1tYXJnaW4tdG9wPSIwIgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtdW5pdHM9Im1tIgogICAgIGlua3NjYXBlOmN5PSIzNzAuMTczMSIKICAgICBpbmtzY2FwZTpjeD0iMTg3LjQzODI0IgogICAgIGlua3NjYXBlOnpvb209IjAuOTg5OTQ5NDkiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgaWQ9ImJhc2UiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhMTE5NiI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGUgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOTMuMzYzOTI4LDYyLjc0MDI0NCkiCiAgICAgaWQ9ImxheWVyMSIKICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIj4KICAgIDxnCiAgICAgICBpbmtzY2FwZTpleHBvcnQteWRwaT0iNDMuNDQ0NjM3IgogICAgICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjQzLjQ0NDYzNyIKICAgICAgIGlkPSJnODUwIj4KICAgICAgPHJlY3QKICAgICAgICAgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIgogICAgICAgICB5PSItMTEwLjM4MjM0IgogICAgICAgICB4PSI3NC41NzA4NjIiCiAgICAgICAgIGhlaWdodD0iNTIuOTE2NjY4IgogICAgICAgICB3aWR0aD0iNTIuOTE2NjY4IgogICAgICAgICBpZD0icmVjdDgzMy02LTgtOC02IgogICAgICAgICBzdHlsZT0iZmlsbDojMmMzZTUwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjI3NDMyO3N0cm9rZS1taXRlcmxpbWl0OjEwO3N0b3AtY29sb3I6IzAwMDAwMCIgLz4KICAgICAgPHJlY3QKICAgICAgICAgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIgogICAgICAgICBzdHlsZT0iZmlsbDojZDM1NDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjI3NDMyO3N0cm9rZS1taXRlcmxpbWl0OjEwO3N0b3AtY29sb3I6IzAwMDAwMCIKICAgICAgICAgaWQ9InJlY3Q4MzMtNi05LTktNi04IgogICAgICAgICB3aWR0aD0iNTIuOTE2NjY4IgogICAgICAgICBoZWlnaHQ9IjUyLjkxNjY2OCIKICAgICAgICAgeD0iNzQuNTcwODYyIgogICAgICAgICB5PSItMTYzLjI5ODk3IiAvPgogICAgICA8cmVjdAogICAgICAgICB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjUG9zaXRpb25pbmcpO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjI3NDMyMztzdHJva2UtbWl0ZXJsaW1pdDoxMDtzdG9wLWNvbG9yOiMwMDAwMDAiCiAgICAgICAgIGlkPSJyZWN0ODMzLTctNi0zIgogICAgICAgICB3aWR0aD0iNTIuOTE2NjY4IgogICAgICAgICBoZWlnaHQ9IjUyLjkxNjY2OCIKICAgICAgICAgeD0iMTI3LjQ4NzYiCiAgICAgICAgIHk9Ii0xNjMuMjk4OTciIC8+CiAgICAgIDxyZWN0CiAgICAgICAgIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIKICAgICAgICAgc3R5bGU9ImZpbGw6I2FkYjliOTtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4yNzQzMjtzdHJva2UtbWl0ZXJsaW1pdDoxMDtzdG9wLWNvbG9yOiMwMDAwMDAiCiAgICAgICAgIGlkPSJyZWN0ODMzLTYtOC04LTYtMSIKICAgICAgICAgd2lkdGg9IjUyLjkxNjY2OCIKICAgICAgICAgaGVpZ2h0PSI1Mi45MTY2NjgiCiAgICAgICAgIHg9IjEyNy40ODc2IgogICAgICAgICB5PSItMTEwLjM4MjM0IiAvPgogICAgICA8cmVjdAogICAgICAgICBzdHlsZT0iZmlsbDojMmMzZTUwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjE0ODkxNztzdHJva2UtbWl0ZXJsaW1pdDoxMDtzdG9wLWNvbG9yOiMwMDAwMDAiCiAgICAgICAgIGlkPSJyZWN0ODMzLTYtOC04LTYtMCIKICAgICAgICAgd2lkdGg9IjI4LjcyNjE5NiIKICAgICAgICAgaGVpZ2h0PSIyOC43MjYxOTYiCiAgICAgICAgIHg9Ii0xMzkuMTA4NTQiCiAgICAgICAgIHk9Ii0xMjcuNDg3NiIKICAgICAgICAgdHJhbnNmb3JtPSJyb3RhdGUoMTM1KSIgLz4KICAgICAgPHJlY3QKICAgICAgICAgeT0iLTE1Ni4yMTM3NSIKICAgICAgICAgeD0iLTEzOS4xMDg1NCIKICAgICAgICAgaGVpZ2h0PSIyOC43MjYxOTYiCiAgICAgICAgIHdpZHRoPSIyOC43MjYxOTYiCiAgICAgICAgIGlkPSJyZWN0ODMzLTYtOS05LTYtOC04IgogICAgICAgICBzdHlsZT0iZmlsbDojZDM1NDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjE0ODkxNztzdHJva2UtbWl0ZXJsaW1pdDoxMDtzdG9wLWNvbG9yOiMwMDAwMDAiCiAgICAgICAgIHRyYW5zZm9ybT0icm90YXRlKDEzNSkiIC8+CiAgICAgIDxyZWN0CiAgICAgICAgIHk9Ii0xNTYuMjEzNzUiCiAgICAgICAgIHg9Ii0xMTAuMzgyMzQiCiAgICAgICAgIGhlaWdodD0iMjguNzI2MTk2IgogICAgICAgICB3aWR0aD0iMjguNzI2MTk2IgogICAgICAgICBpZD0icmVjdDgzMy03LTYtMy0xIgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI1Bvc2l0aW9uaW5nKTtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4xNDg5MTg7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3RvcC1jb2xvcjojMDAwMDAwIgogICAgICAgICB0cmFuc2Zvcm09InJvdGF0ZSgxMzUpIiAvPgogICAgICA8cmVjdAogICAgICAgICB5PSItMTI3LjQ4NzYiCiAgICAgICAgIHg9Ii0xMTAuMzgyMzQiCiAgICAgICAgIGhlaWdodD0iMjguNzI2MTk2IgogICAgICAgICB3aWR0aD0iMjguNzI2MTk2IgogICAgICAgICBpZD0icmVjdDgzMy02LTgtOC02LTEtMSIKICAgICAgICAgc3R5bGU9ImZpbGw6I2FkYjliOTtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4xNDg5MTc7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3RvcC1jb2xvcjojMDAwMDAwIgogICAgICAgICB0cmFuc2Zvcm09InJvdGF0ZSgxMzUpIiAvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==" /></a>`;
                    }
                    html+=`</div>
                </div>
                </body>
                </html>
            `;
            this.shadowRoot.innerHTML = html;
            // fire an event to signal that the iframe is ready
            window.dispatchEvent(new CustomEvent('iframeConsentLoaded', { bubbles: true, composed: true }));
        }
    }
    customElements.define('iframe-consent', IframeConsent);
})();