/**
 * viewInsights.ts
 * users should be able to view weekly/monthly insights for their courses and personal calendar
 * - for month view: users can select a week from any month and view the event insights for it as well as total num of events for that month
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

function getEventsForMonth() {  
  const monthlyEvents = $(`.fc-widget-content`).find(`.fc-day-grid-event`);
  return monthlyEvents;
}//end to getEventsForMonth

function buildSummaryHTML(summary: { [key: string]: number }, selectedDate: Date, view: string) {
    if (Object.keys(summary).length === 0) {
        return `<p>No events found for the current week.</p>`;
    }
    const courses = getSelectedCourses();
    const totalWeeklyEvents = Object.values(summary).reduce((sum, count) => sum + count, 0);
    const monthlyEvents = getEventsForMonth();
    const monthlySummary = summarizeEventsByCourse(monthlyEvents);
    const totalMonthlyEvents = Object.values(monthlySummary).reduce((sum, count) => sum + count, 0);
    const selectedWeekSunday = new Date(selectedDate);
    selectedWeekSunday.setDate(selectedDate.getDate() - selectedDate.getDay());
    const months: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formatted = `${selectedWeekSunday.getDate()} ${months[selectedWeekSunday.getMonth()]} ${selectedWeekSunday.getFullYear()}`;

    const urlMonth = new URLSearchParams(window.location.hash).get("view_start")?.split("-")[1];
    const formattedMonth = months[urlMonth ? parseInt(urlMonth) - 1 : selectedDate.getMonth()];

    // const weekTitle = $(`.navigation_title`).text().trim();
    
    return `
      ${view === "month" ? 
        `  <div style="margin-top: 20px; margin-bottom:15px; display: flex; gap: 180px">
            <div style="flex:1;">
               <p><strong>${totalWeeklyEvents}</strong> events for week of: <strong>${formatted}</strong></p>
              ${Object.entries(summary)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .map(([courseClass, count]) => {
                      const course = courses.find(c => courseClass.includes(c.courseId));
                      const name = course ? course.name : "Unknown Course";
                      return `
                          <div style="display:flex; align-items:center; margin-left:6px; padding-bottom:10px">
                              <div class="${courseClass}" style="
                                  width:14px;
                                  height:14px;
                                  margin-right:8px;
                                  border-radius:3px;">
                              </div>
                              <span>${name}: ${count} ${count === 1 ? `event` : `events`}</span>
                          </div>
                      `;
                  })
                  .join("")}
            </div>
            <div style="flex:1;">
              <p><strong>${totalMonthlyEvents}</strong> events for <strong>${formattedMonth} ${selectedWeekSunday.getFullYear()}</strong></p>
              ${Object.entries(monthlySummary)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .map(([courseClass, count]) => {
                      const course = courses.find(c => courseClass.includes(c.courseId));
                      const name = course ? course.name : "Unknown Course";
                      return `
                          <div style="display:flex; align-items:center; margin-left:6px; padding-bottom:10px">
                              <div class="${courseClass}" style="
                                  width:14px;
                                  height:14px;
                                  margin-right:8px;
                                  border-radius:3px;">
                              </div>
                              <span>${name}: ${count} ${count === 1 ? `event` : `events`}</span>
                          </div>
                      `;
                  })
                  .join("")}
            </div>
        </div>` :
        `  <div style="display: flex; flex-direction: column; align-items:center; height:100%">
            ${Object.entries(summary)
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([courseClass, count]) => {
                    const course = courses.find(c => courseClass.includes(c.courseId));
                    const name = course ? course.name : "Unknown Course";
                    return `
                        <div style="display:flex; align-items:center; margin-left:6px; padding-bottom:10px">
                            <div class="${courseClass}" style="
                                width:14px;
                                height:14px;
                                margin-right:8px;
                                border-radius:3px;">
                            </div>
                            <span>${name}: ${count} ${count === 1 ? `event` : `events`}</span>
                        </div>
                    `;
                })
                .join("")}
        </div>`
      }
    `;
}//end to buildSummaryHTML

/**MONTH VIEW */
const VIEW_INSIGHTS_BUTTON = `
<div >
 <button
   title="View Insights"
   class="insights-button"
   id="cwu-view-insights-load">
   View Insights
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
        <div style="display: flex; flex-direction: column; align-items:center; height:100%">
            <p style="margin-top: 20px; margin-bottom: 25px">Select a date to view the insights for that week and month:</p>
            <div id="cwu-week-picker"></div>
            <div id="cwu-week-summary"></div>
        </div>
    `;
}//end to renderUIDatePicker

function handleWeekSelection(selectedDate: Date) {
    //selectedDate month/year has to match url param view_start
    const viewStart = new URLSearchParams(window.location.hash).get("view_start");
    //clear summary before rendering new ones
    $("#cwu-week-summary").html("");

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

    const eventsWeekly = getEventsForWeek(selectedDate);
    const summaryWeekly = summarizeEventsByCourse(eventsWeekly);
    const summaryHTML = buildSummaryHTML(summaryWeekly, selectedDate, "month");

    $("#cwu-week-summary").html(summaryHTML);
}//end to handleWeekSelection

function handleInsightsClick() {
    waitForCalendarEvents(() => {
      setTimeout(() => {
        const dialogHTML = renderUIDatePicker();
        startDialog("View Insights", dialogHTML);
        const $picker = $("#cwu-week-picker");

        if ($picker.hasClass("hasDatepicker")) {
          $picker.datepicker("destroy");
        }

        $("#ui-datepicker-div").hide();

        $picker.datepicker({
          showOn: "button",
          
          buttonText: "Select Date",
          
          onSelect: function (dateText: string) {
            handleWeekSelection(new Date(dateText));
          }
        });
        setTimeout(() => {
          $picker.blur();
        }, 0);
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
      console.log("Not month view. View Insights button removed");
    }
}//end to updateButtonVisibility

export function loadInsightsReport() {
    updateButtonVisibility();
    window.addEventListener('hashchange', updateButtonVisibility);
}//end to loadInsightsReport

/**WEEK VIEW */

const WV_VIEW_INSIGHTS_BUTTON = `
<div>
    <button 
    title="Insights for this Week"
    class="wv-insihgts-button"
    id="cwu-wv-view-insights-load"
    >
    View Weekly Insights
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
function wvGetEvents() {
  const weekRow = $(`.fc-row.fc-week.fc-widget-content`)[0];

  //get all day events
  const allDayEvents = $(weekRow).find(`.fc-day-grid-event`);
  
  //get events in time grid
  const timeGrid = $(`.fc-scroller.fc-time-grid-container`);
  const timeGridEvents = timeGrid.find(`.fc-time-grid-event`);

  //return all day events and time grid events
  const allEvents = allDayEvents.add(timeGridEvents);
  return allEvents;

}//end to wvGetEvents

function changeWeek(offset: number) {
  const viewStart =  new URLSearchParams(window.location.hash).get("view_start");

  if (!viewStart) return;

  const date = new Date(viewStart);
  date.setDate(date.getDate() + offset);

  const newViewStart = date.toISOString().split("T")[0];

  window.location.hash = `view_name=week&view_start=${newViewStart}`;

  wvWaitForEvents(() => {
    setTimeout(() => {
      renderWeekInsights();
    }, 200);
  });
}//end to changeWeek

function renderWeekHeaderHTML(summary: { [key: string]: number }) {
  const weekTitle = $(".navigation_title").text().trim();

  const totalWeeklyEvents = Object.values(summary)
    .reduce((sum, count) => sum + count, 0);

  return `
    <p style="text-align:center; font-size: 20px;">
      <strong>${totalWeeklyEvents}</strong> events for:
      <button style="border:1px solid #e8eaec; border-radius:3px; margin: 5px;" id="insights-prev-week">&larr;</button>
      <strong>${weekTitle}</strong>
      <button style="border:1px solid #e8eaec; border-radius:3px; margin: 5px;" id="insights-next-week">&rarr;</button>
    </p>
  `;
}//end to renderWeekHeaderHTML

function renderWeekInsights() {
  const viewStart = new URLSearchParams(window.location.hash).get("view_start");
  if (!viewStart) return;

  const events = wvGetEvents();
  const summary = summarizeEventsByCourse(events);

  const summaryHTML = buildSummaryHTML(summary, new Date(viewStart), "week");
  const headerHTML = renderWeekHeaderHTML(summary);

  const fullHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; height:100%">
      ${headerHTML}
      <div style="margin-top:20px; display:flex; gap:180px">
        <div style="flex:1;">
          ${summaryHTML}
        </div>
      </div>
    </div>
  `;

  $("#cwu-week-summary").html(fullHTML);
  $("#insights-prev-week").on("click", () => changeWeek(-7));
  $("#insights-next-week").on("click", () => changeWeek(7));
}//end to renderWeekInsights

function wvHandleInsightsClick() {
  wvWaitForEvents(() => {
    setTimeout(() => {
      startDialog(
        "View Insights",
        `<div id="cwu-week-summary"></div>`
      );
      renderWeekInsights();
    }, 200);
  });
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
      console.log("Not week view. View Weekly Insights button removed.");
    }
}//end to wvUpdateButtonVisibility

export function wvLoadInsightsReport(){
    wvUpdateButtonVisibility();
    window.addEventListener('hashchange', wvUpdateButtonVisibility);
}//end to wvLoadInsightsReport