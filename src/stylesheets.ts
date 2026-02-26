import { ALWAYS } from "userscripter/lib/environment";
import { Stylesheets, stylesheet } from "userscripter/lib/stylesheets";

const STYLESHEETS = {
    main: stylesheet({
        condition: ALWAYS,
        css: `
        /*background when event modal form is open*/
        .ui-widget-overlay {
               background-color: transparent;
               background: transparent;
        }
            
        /*nowline z-index*/
        .fc-time-grid .fc-slats {
               z-index: 10 !important;
               position: relative !important;
        }

        `,
    }),
} as const;

// This trick uncovers type errors in STYLESHEETS while retaining the static knowledge of its properties (so we can still write e.g. STYLESHEETS.foo):
const _: Stylesheets = STYLESHEETS; void _;

export default STYLESHEETS;
