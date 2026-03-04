/**
 * viewInsights.ts
 * users should be able to view weekly insights for their courses and personal calendar
 * - insights should be available for the current week and update as the week changes
 */
import { startDialog } from "~src/canvas/dialog";


const VIEW_INSIGHTS_BUTTON = `
<div >
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



function waitForCalendarEvents(callback: { (): void; (): void; }) {
    const interval = setInterval(() => {
        if ($(".fc-day-grid-event").length > 0) {
            clearInterval(interval);
            callback();
        }
    }, 200);
}//end to waitForCalendarEvents


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
}//end to summarizeEventsByCourse

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
}//end to getEventsForWeek


function renderUIDatePicker() {
    return `
        <div>
            <p>Select a date to view the insights for that week:</p>
            
            <input 
                type="text" 
                id="cwu-week-picker" 
                placeholder="Click to select a date"
                style="padding:6px; width:200px;"
            />

            <div id="cwu-week-summary"></div>
        </div>
    `;
}//end to renderUIDatePicker

function handleWeekSelection(selectedDate: Date) {
    //selectedDate month/year has to match url param view_start
    const viewStart = new URLSearchParams(window.location.hash).get("view_start");
    console.log("view start", viewStart);
    console.log("selected date", selectedDate);

    //if view start month != selected month, navigate to month of selected date
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    if (viewStart) {
        const [year, month] = viewStart.split("-").map(Number);
        if (month - 1 !== selectedMonth || year !== selectedYear) {
            const newViewStart = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
            window.location.hash = `view_name=month&view_start=${newViewStart}`;
            waitForCalendarEvents(() => {
                handleWeekSelection(selectedDate);
            });
            return;
        }
    }

    const events = getEventsForWeek(selectedDate);
    const summary = summarizeEventsByCourse(events);
    const summaryHTML = buildSummaryHTML(summary);

    $("#cwu-week-summary").html(summaryHTML);
}//end to handleWeekSelection

function handleInsightsClick() {
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
          onSelect: function (dateText: string) {
            handleWeekSelection(new Date(dateText));
          }
        });

        $picker.blur();
      }, 200);//end to setTimeout
    });//end to waitForCalendarEvents
}//end to handleInsightsClick

function updateButtonVisibility() {
    const isMonthView =
      window.location.pathname.includes('/calendar') &&
      window.location.hash.includes('view_name=month');

    const header = $('.header-bar-outer-container.calendar_header');
    const existingButton = $('#cwu-view-insights-load');

    if (isMonthView && header.length) {
      if (!existingButton.length) {
        header.append(VIEW_INSIGHTS_BUTTON);
        console.log("Insights button added");
        $('#cwu-view-insights-load')
          .off('click')
          .on('click', handleInsightsClick);
      }
    } else {
      existingButton.remove();
      console.log("Insights button removed");
    }
}//end to updateButtonVisibility

export function loadInsightsReport() {
    updateButtonVisibility();
    window.addEventListener('hashchange', updateButtonVisibility);
}//end to loadInsightsReport