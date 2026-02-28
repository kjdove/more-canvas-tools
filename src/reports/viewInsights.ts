/**
 * viewInsights.ts
 * users should be able to view weekly insights for their courses and personal calendar
 * - insights should be available for the current week and update as the week changes
 */
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
</div>
`;


export function getSelectedCourses() {
  const courses: { name: string; courseId: string }[] = [];

  $(`.context_list_context.checked`).each((_, el) => {
    const $el = $(el);
    const name = $el.find("label").text().trim();
    const courseId = $el.data("context");
    courses.push({ name, courseId });
    });
  return courses;
}//end to getSelectedCourses

// function buildLegendHTML() {
//     const courses = getSelectedCourses();

//     if (!courses.length) {
//         return `<p>No courses currently toggled on.</p>`;
//     }

//     return `
//         <div style="margin-bottom:15px;">
//             <h3>Legend:</h3>
//             ${courses
//                 .map(
//                     (course) => `
//                 <div style="display:flex; align-items:center; margin-bottom:6px;">
//                     <div class= "group_${course.courseId}"  style="
//                         width:14px;
//                         height:14px;
//                         margin-right:8px;
//                         border-radius:3px;">
//                     </div>
//                     <span>${course.name}</span>
//                 </div>
//             `
//                 )
//                 .join("")}
//         </div>
//     `;
// }//end to buildLegendHTML

function waitForCalendarEvents(callback: { (): void; (): void; }) {
    const interval = setInterval(() => {
        if ($(".fc-day-grid-event").length > 0) {
            clearInterval(interval);
            callback();
        }
    }, 200);
}

waitForCalendarEvents(() => {
    const events = $(".fc-day-grid-event");
    console.log("Events now exist:", events.length);
});

function getCurrentWeekEvents() {
    const weekRow = $(".fc-day.fc-today").closest(".fc-row.fc-week");
    const events = weekRow.find(".fc-day-grid-event");
    return events;
}

function summarizeEventsByCourse(events: JQuery<HTMLElement>) {
    const summary: { [key: string]: number } = {};

    events.each((_, el) => {
        const classes = el.className.split(/\s+/);
        const courseClass = classes.find(c => c.startsWith("group_course_") || c.startsWith("group_user_"));
        if (!courseClass) return;

        if (!summary[courseClass]) summary[courseClass] = 0;
        summary[courseClass]++;
    });

    return summary;
}

function buildSummaryHTML(summary: { [key: string]: number }) {
    if (Object.keys(summary).length === 0) {
        return `<p>No events found for the current week.</p>`;
    }
    const courses = getSelectedCourses();

    return `
        <div style="margin-bottom:15px;">
            <h3>Summary:</h3>
            ${Object.entries(summary)
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([courseClass, count]) => {
                    const course = courses.find(c => courseClass.includes(c.courseId));
                    const name = course ? course.name : "Unknown Course";
                    return `
                        <div style="display:flex; align-items:center; margin-bottom:6px;">
                            <div class="${courseClass}" style="
                                width:14px;
                                height:14px;
                                margin-right:8px;
                                border-radius:3px;">
                            </div>
                            <span>${name}: ${count} event(s)</span>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
}//end to buildSummaryHTML


export function loadInsightsReport() {
   const header = $(`.header-bar-outer-container.calendar_header`);
   if (header.length && !$(`#cwu-view-insights-load`).length) {
       header.append(VIEW_INSIGHTS_BUTTON);
       console.log("Insights button added");
   }
   
   const currentDate = new Date();
   const startOfWeek = new Date(currentDate);
   startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
   const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
   const currentMonth = startOfWeek.getMonth(); 
   const currentSunday = startOfWeek.getDate();
   const currentYear = startOfWeek.getFullYear();

    const currentWeek = `${months[currentMonth]} ${currentSunday}, ${currentYear}`;
     const selectedCourses = getSelectedCourses();
     console.log("Selected courses for insights:", selectedCourses);
    // const legendHTML = buildLegendHTML();

   $(`#cwu-view-insights-load`).click(() => {
    waitForCalendarEvents(() => {
        const events = getCurrentWeekEvents();
        // console.log("Current week events:", events?.length);
        // console.log("Current week events details:", events);
        const weeklySummary = summarizeEventsByCourse(events);
        // console.log("Weekly summary by course:", weeklySummary);
        const summaryHTML = buildSummaryHTML(weeklySummary);
        const innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 20px;">
                <div style="flex: 1;">${summaryHTML}</div>
            </div>
            <iframe id="cwu-insights-iframe" src="" width="100%" height="400px" frameborder="0"></iframe>
        `;
        startDialog(`Weekly Insights - Week of ${currentWeek}`, innerHTML);
     });//end to waitForCalendarEvents
  });//end to click
}//end to loadInsightsReport
