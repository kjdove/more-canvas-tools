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


// function getCurrentWeekEvents() {
//     const weekRow = $(".fc-day.fc-today").closest(".fc-row.fc-week");
//     const events = weekRow.find(".fc-day-grid-event");
//     return events;
// }


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

function getEventsForWeek(selectedDate: Date) {

    const formatted = selectedDate.toISOString().split("T")[0];
    const dayCell = $(`.fc-day[data-date="${formatted}"]`);

    if (!dayCell.length) {
        console.log("No matching day cell found");
        return $();
    }
    const weekRow = dayCell.closest(".fc-row.fc-week");

    const events = weekRow.find(".fc-day-grid-event");

    return events;
}


function renderUIDatePicker() {
    return `
        <div style="display:flex; flex-direction:column; gap:15px; padding:15px;">
            
            <p>Select a date to view that week's events:</p>
            
            <input 
                type="text" 
                id="cwu-week-picker" 
                placeholder="Click to select a date"
                style="padding:6px; width:200px;"
            />

            <div id="cwu-week-summary"></div>
        </div>
    `;
}

function handleWeekSelection(selectedDate: Date) {
    //selectedDate month/year has to match url param view_start



    const events = getEventsForWeek(selectedDate);
    const summary = summarizeEventsByCourse(events);
    const summaryHTML = buildSummaryHTML(summary);

    $("#cwu-week-summary").html(summaryHTML);
}

export function loadInsightsReport() {
    /**make either only appear on month view or change fucntion so that it works for when on week view*/
   const header = $(`.header-bar-outer-container.calendar_header`);
   if (header.length && !$(`#cwu-view-insights-load`).length) {
       header.append(VIEW_INSIGHTS_BUTTON);
       console.log("Insights button added");
   }
   
    const selectedCourses = getSelectedCourses();
    // const legendHTML = buildLegendHTML();

    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = startOfWeek.getMonth(); 
    const currentSunday = startOfWeek.getDate();
    const currentYear = startOfWeek.getFullYear();
 
    const currentWeek = `${months[currentMonth]} ${currentSunday}, ${currentYear}`;
    $(`#cwu-view-insights-load`).click(() => {
        waitForCalendarEvents(() => {
            setTimeout(() => {
                const dialogHTML = renderUIDatePicker();
    
            startDialog("Weekly Insights", dialogHTML);
                const $picker = $("#cwu-week-picker");
                if ($picker.hasClass("hasDatepicker")) {
                    $picker.datepicker("destroy");
                }
                $("#ui-datepicker-div").hide();
            
                $picker.datepicker({
                    showOn: "focus",
                    onSelect: function(dateText: string) {
                        handleWeekSelection(new Date(dateText));
                    }
                });
                $picker.blur();
            
            }, 200);
        })//end to waitForCalendarEvents
    });//end to click
}//end to loadInsightsReport
