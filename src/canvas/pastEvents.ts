/**
 * pastEvents.ts
 * shade/lighten past events on calendar month view to visually distinguish them from upcoming events
 */

import { waitForCalendarEvents } from "src/reports/viewInsights";

export function shadePastEvents() {

    waitForCalendarEvents(() => {
        const today = new Date().toISOString().split("T")[0];

        const currentMonth = today.slice(0, 7);
        const viewStart = window.location.hash.split("view_start=")[1]?.split("&")[0];
        const viewStartMonth = viewStart?.slice(0, 7);
    
        //if calendar renders current month
        if (viewStartMonth === currentMonth) {
            waitForCalendarEvents(() => {
                const weekRows = $(".fc-row.fc-week");
                // console.log('weekRows', weekRows);

                const currentWeekRow = $(".fc-day.fc-today").closest(".fc-row");
                const currentWeekInd = weekRows.index(currentWeekRow);

                weekRows.slice(0, currentWeekInd).each((_, week) => {
                    const events = $(week).find(".fc-content-skeleton tbody tr .fc-event");
                    events.css("opacity", "0.34");
                });//end to slice

                const todayCell = $(".fc-day.fc-today");
                const todayInd = todayCell.index();

                const pastDays = currentWeekRow.find(".fc-day").slice(0, todayInd);

                pastDays.each((_, day) => {
                    const columnInd = $(day).index();
                    const events = currentWeekRow.find(".fc-content-skeleton tbody tr").find(`td:eq(${columnInd}) .fc-event`);
                    events.css("opacity", "0.34");
                });//end to each
            });//end to waitForCalendarEvents
        }//end to if
    
        //else if calendar renders a past month, shade all events
        else if(viewStart < today){
            waitForCalendarEvents(() => {
                const events = $(".fc-content-skeleton tbody tr").find(".fc-event");
                events.css("opacity", "0.34");
            });
        }//end to else if
    
    });//end to waitForCalendarEvents
}//end to shadePastEvents

let lastCalendarContent = "";
function applyShading() {
    const calendarHtml = $(".fc-content-skeleton").html();
    if (calendarHtml !== lastCalendarContent) {
        lastCalendarContent = calendarHtml;
        shadePastEvents();
    }
}//end to applyShading

export function loadPastEventsShading() {
    shadePastEvents();
    let lastHash = window.location.hash;
    setInterval(applyShading, 300);
    setInterval(() => {
        if (window.location.hash !== lastHash) {
            lastHash = window.location.hash;
            shadePastEvents();
        }
    }, 200);
}//end to loadPastEventsShading