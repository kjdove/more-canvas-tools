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
        .fc-time-grid .fc-slats{
               z-index: 10 !important;
        }

        /*insights*/
        .insights-button {
           background-color: #abcdef;
            border-radius: 0.5rem;
            border-color: transparent;
        }
        .insights-button:hover {
            background-color: #89abcd;
            border-color: transparent;
        }
        .wv-insihgts-button {
           background-color: #abcdef;
            border-radius: 0.5rem;
            border-color: transparent;
        }
        .wv-insihgts-button:hover {
            background-color: #89abcd;
            border-color: transparent;
        }

        .ui-datepicker-header {
        cursor: pointer !important;
        }


        /*resizable modal form*/
        .tab_holder.clearfix.ui-tabs-panel.ui-widget-content.ui-corner-bottom {
            max-height: calc(100vh - 210px) !important;
            resize: both !important;
            overflow-y: auto !important;
        }
        `,
    }),
} as const;

// This trick uncovers type errors in STYLESHEETS while retaining the static knowledge of its properties (so we can still write e.g. STYLESHEETS.foo):
const _: Stylesheets = STYLESHEETS; void _;

export default STYLESHEETS;
