import { startDialog } from "~src/canvas/dialog";

const VIEW_INSIGHTS_BUTTON = `
<div style="display:inline-block; margin-left: 10px;">
 <button
   title="View Weekly Insights"
   class="insights-button"
   id="cwu-view-insights-load">
   View Weekly Insights
 </button>
</div>
`;

const INSIGHTS_DIALOG = `
<div id="cwu-insights-dialog" title="Weekly Insights" style="display:none;">
    <iframe id="cwu-insights-iframe" src="" width="100%" height="400px" frameborder="0"></iframe>
`;

export function loadInsightsReport() {
   const header = $(".header-bar-outer-container.calendar_header");
   if (header.length && !$("#cwu-view-insights-load").length) {
       header.append(VIEW_INSIGHTS_BUTTON);
       console.log("Insights button added");
   }
   $("#cwu-view-insights-load").click(() => {
        startDialog("Weekly Insights", INSIGHTS_DIALOG);
   });
}
