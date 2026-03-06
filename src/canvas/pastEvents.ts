/**
 * pastEvents.ts
 * shade/lighten past events on calendar month view to visually distinguish them from upcoming events
 */

import { waitForCalendarEvents } from "src/reports/viewInsights";

export function shadePastEvents() {
    const today = new Date().toISOString().split("T")[0];

    const currentMonth = today.slice(0, 7);
    console.log('today', currentMonth);
    const viewStart = window.location.hash.split("view_start=")[1]?.split("&")[0];
    const viewStartMonth = viewStart?.slice(0, 7);
    console.log('viewStart', viewStartMonth);


    //if calendar renders current month
    if (viewStartMonth === currentMonth) {
        waitForCalendarEvents(() => {
            const todayCell = $(`.fc-day.fc-today`);
            const weekRow = todayCell.closest(".fc-row");

            let pastDays = weekRow.find(".fc-day[data-date]").filter((_, el) => {
                const date = $(el).attr("data-date");
                return date !== undefined && date < today;
            });
            console.log("past days", pastDays);
            //bc of time zone differences 
            pastDays = pastDays.filter((_, day) => {
                //if day includes .fc-today, remove from past days
                const isToday = $(day).hasClass("fc-today");
                return !isToday; 
            });
            console.log("past days after filtering out today", pastDays);

            pastDays.each((_, day) => {
                const columnIndex = $(day).index();
                const events = weekRow
                    .find(".fc-content-skeleton tbody tr")
                    .find(`td:eq(${columnIndex}) .fc-event`);
                console.log('fc-content-skeleton tbody tr', weekRow.find(".fc-content-skeleton tbody tr"));
                // console.log('events', events, 'column', columnIndex, 'todayind', todayIndex);
                events.css("opacity", "0.34");

            });//end to each
        });//end to waitForCalendarEvents
    }//end to if

    //else if calendar renders a past month, shade all events
    else if(viewStart < today){
        waitForCalendarEvents(() => {
            const events = $(".fc-content-skeleton tbody tr").find(".fc-event");
            events.css("opacity", "0.34");
            // events.css('color', 'gray');
            // events.css('border-color', 'gray');
        });
    }//end to else if
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
    setInterval(applyShading, 100);
    setInterval(() => {
        if (window.location.hash !== lastHash) {
            lastHash = window.location.hash;
            console.log("calendar hash changed");
            shadePastEvents();
        }
    }, 200);
}//end to loadPastEventsShading