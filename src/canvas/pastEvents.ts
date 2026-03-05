/**
 * pastEvents.ts
 * shade/lighten past events on calendar month view to visually distinguish them from upcoming events
 */

import { waitForCalendarEvents } from "src/reports/viewInsights";

export function shadePastEvents() {
    const today = new Date().toISOString().split("T")[0];

    waitForCalendarEvents(() => {

        const todayCell = $(`.fc-day[data-date="${today}"]`);
        const weekRow = todayCell.closest(".fc-row");

        const pastDays = weekRow.find(".fc-day[data-date]").filter((_, el) => {
            const date = $(el).attr("data-date");
            return date! < today; 
        });

        pastDays.each((_, day) => {
            const columnIndex = $(day).index();

            const events = weekRow
                .find(".fc-content-skeleton tbody tr")
                .find(`td:eq(${columnIndex}) .fc-event`);

            events.css("opacity", "0.5");
        });

    });
}//end to shadePastEvents