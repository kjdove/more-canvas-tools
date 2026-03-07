/**
 * viewInsights.ts
 * users should be able to view weekly insights for their courses and personal calendar
 * - for month view: users can select a week from any month and view the event insights for it
 * - for week view: users can view insights for currently rendered week/the corresponding week of the view_start date in url
 */
import { startDialog } from "~src/canvas/dialog";


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

function buildSummaryHTML(summary: { [key: string]: number }, selectedDate: Date) {
    if (Object.keys(summary).length === 0) {
        return `<p>No events found for the current week.</p>`;
    }
    const courses = getSelectedCourses();
    const totalEvents = Object.values(summary).reduce((sum, count) => sum + count, 0);

    const selectedWeekSunday = new Date(selectedDate);
    selectedWeekSunday.setDate(selectedDate.getDate() - selectedDate.getDay());
    //formatted DD Month YYYY
    const months: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formatted = `${selectedWeekSunday.getDate()} ${months[selectedWeekSunday.getMonth()]} ${selectedWeekSunday.getFullYear()}`;
   
    return `
        <div style="margin-bottom:15px;">
            <p><strong>${totalEvents}</strong> events for week of: <strong>${formatted}</strong></p>
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

/**MONTH VIEW */
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

export function waitForCalendarEvents(callback: { (): void; (): void; }) {
  const interval = setInterval(() => {
      if ($(".fc-day-grid-event").length > 0) {
          clearInterval(interval);
          callback();
      }
  }, 200);
}//end to waitForCalendarEvents

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
        }//end to inner if
    }//end to outer if

    const events = getEventsForWeek(selectedDate);
    const summary = summarizeEventsByCourse(events);
    const summaryHTML = buildSummaryHTML(summary, selectedDate);

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
    } 
    else {
      existingButton.remove();
      console.log("Not month view. Insights button removed");
    }
}//end to updateButtonVisibility

export function loadInsightsReport() {
    updateButtonVisibility();
    window.addEventListener('hashchange', updateButtonVisibility);
}//end to loadInsightsReport

/**WEEK VIEW */

//week view (wv) insights button
const WV_VIEW_INSIGHTS_BUTTON = `
<div>
    <button 
    title="Insights for the Week"
    class="wv-insihgts-button"
    id="cwu-wv-view-insights-load"
    >
    View Insights for the Week
    </button>
</div>
`;

//wait for week view events
function wvWaitForEvents(callback: { (): void; (): void; }) {
  const interval = setInterval(() => {
      if ($(".fc-time-grid-event").length > 0) {
          clearInterval(interval);
          callback();
      }
  }, 200);
}//end to wvWaitForEvents

//get events for week view
function wvGetEvents(selectedDate: Date) {
  const formatted = selectedDate.toISOString().split("T")[0];
  const weekRow = $(`.fc-row.fc-week.fc-widget-content`)[0];
  console.log('found week rows:', weekRow);

  //get all day events
  const allDayEvents = $(weekRow).find(`.fc-day-grid-event`);
  console.log('found all day events:', allDayEvents);
  
  //get events in time grid
  const timeGrid = $(`.fc-scroller.fc-time-grid-container`);
  console.log('found time grid:', timeGrid);  
  const timeGridEvents = timeGrid.find(`.fc-time-grid-event`);
  console.log('found time grid events:', timeGridEvents);

  //return all day events and time grid events
  const allEvents = allDayEvents.add(timeGridEvents);
  console.log('combined events:', allEvents);
  return allEvents;

}//end to wvGetEvents


function wvHandleInsightsClick() {
  wvWaitForEvents(() => {
    setTimeout(() => {
      const viewStart = new URLSearchParams(window.location.hash).get("view_start");
      const selectedDate = viewStart ? new Date(viewStart) : null;
      console.log("Selected date from URL:", selectedDate);
      if(selectedDate){
        //call wvGetEvents pass in selectedDate
        const events = wvGetEvents(selectedDate);
        //call summarizeEventsByCourse pass in events from wvGetEvents
        const summary = summarizeEventsByCourse(events);
        //call buildSummaryHTML pass in summary from summarizeEventsByCourse and selectedDate
        const summaryHTML = buildSummaryHTML(summary, selectedDate);
        //startDialog with title "Weekly Insights" and content from buildSummaryHTML
        startDialog("Weekly Insights", summaryHTML);
      }
      else {
        console.log("No view_start date found in URL");
      }

    }, 200);
  })//end to wvWaitForEvents
}//end to wvHandleInsightsClick

function wvUpdateButtonVisibility() {
    const isWeekView =
      window.location.pathname.includes('/calendar') &&
      window.location.hash.includes('view_name=week');

    const header = $('.header-bar-outer-container.calendar_header');
    const existingButton = $('#cwu-wv-view-insights-load');

    if (isWeekView && header.length) {
      if (!existingButton.length) {
        header.append(WV_VIEW_INSIGHTS_BUTTON);
        console.log("WV Insights button added");
        $('#cwu-wv-view-insights-load')
          .off('click')
          .on('click', wvHandleInsightsClick);
      }
    } 
    else {
      existingButton.remove();
      console.log("Not week view. Insights button removed");
    }
}//end to wvUpdateButtonVisibility

export function wvLoadInsightsReport(){
    wvUpdateButtonVisibility();
    window.addEventListener('hashchange', wvUpdateButtonVisibility);
}//end to wvLoadInsightsReport