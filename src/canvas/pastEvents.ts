/**
 * pastEvents.ts
 * shade/lighten past events on calendar month view to visually distinguish them from upcoming events
 */

import { waitForCalendarEvents } from "src/reports/viewInsights";

export function shadePastEvents() {
    const today = new Date().toISOString().split("T")[0];
    console.log('today', today);
    const viewStart = window.location.hash.split("view_start=")[1]?.split("&")[0];
    console.log('viewStart', viewStart);

    //if calendar renders current month
    if(viewStart === today){
        waitForCalendarEvents(() => {
            const todayCell = $(`.fc-day[data-date="${today}"]`);
            const weekRow = todayCell.closest(".fc-row");
            const todayIndex = todayCell.index();

            const pastDays = weekRow.find(".fc-day[data-date]").filter((_, el) => {
                const date = $(el).attr("data-date");
                return date !== undefined && date < today;
            });
    
            pastDays.each((_, day) => {
                const columnIndex = $(day).index();
                if (columnIndex === todayIndex) return;
        
                const events = weekRow
                    .find(".fc-content-skeleton tbody tr")
                    .find(`td:eq(${columnIndex}) .fc-event`);
        
                events.css("opacity", "0.34");
                // events.css('color', 'gray');
                // events.css('border-color', 'gray');
        
            });
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
    }
}//end to shadePastEvents

export function loadPastEventsShading() {
    shadePastEvents();
    let lastHash = window.location.hash;
    setInterval(() => {
        if (window.location.hash !== lastHash) {
            lastHash = window.location.hash;
            console.log("calendar hash changed");
            shadePastEvents();
        }

    }, 200);
}//end to loadPastEventsShading