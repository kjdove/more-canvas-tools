const VIEW_INSIGHTS_BUTTON = `
<div style="display:inline-block; margin-left: 10px;">
 <button
   title="View Weekly Insights"
   class="btn btn-primary"
   id="cwu-view-insights-load">
   View Weekly Insights
 </button>
</div>
`;


export function loadInsightsReport() {
   const header = $(".header-bar-outer-container.calendar_header");


   if (header.length && !$("#cwu-view-insights-load").length) {
       header.append(VIEW_INSIGHTS_BUTTON);
       console.log("Insights button added");
   }
}
