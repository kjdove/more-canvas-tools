/**
 * pastEvents.ts
 * shade/lighten past events on calendar month view to visually distinguish them from upcoming events
 */

import { waitForCalendarEvents, getSelectedCourses } from "src/reports/viewInsights";

function getIds() {
    const selectedCourses = getSelectedCourses();
    return selectedCourses.map(course => course.courseId);
}

async function fetchCalendarEvents() {
    //get ids
    const ids = getIds();

    //filter for user id and then course ids - format
    const user_id = ids.find(id => id.startsWith("user_"));
    const formattedUserId = user_id!!.split("_")[1];
    const course_ids = ids.filter(id => id.startsWith("course_"));
    const formattedCourseIds = course_ids.map(id => id.split("_")[1]);

    //get user events
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);
    const start_date = currentMonth + "-01";
    const userEventsFetch = await fetch(`/api/v1/users/${formattedUserId}/calendar_events?start_date=${start_date}&per_page=100`);
    const userEvents = await userEventsFetch.json();
    // console.log(`User events fetch for user ${user_id}:`, userEvents);

    //get planner events/notes
    const plannerEventsFetch = await fetch(`/api/v1/planner_notes?start_date=${start_date}&per_page=100`);
    const plannerEvents = await plannerEventsFetch.json();
    // console.log(`Planner events fetch:`, plannerEvents);


    //get course events
    const courseEvents: { [key: string]: any } = {};
    for (let i = 0; i < course_ids.length; i++) {
        const courseId = course_ids[i];
        const formattedCourseId = formattedCourseIds[i];
    
        const courseEventsFetch = await fetch(`/api/v1/courses/${formattedCourseId}/assignments?start_date=${start_date}&per_page=100`);
        const courseEventsJson = await courseEventsFetch.json();
    
        courseEvents[courseId] = courseEventsJson; 
        // console.log(`Course events fetch for course ${courseId}:`, courseEventsJson);
    }//end to for

    const allEvents = [ ...userEvents, ...plannerEvents, ...Object.values(courseEvents).flat()];
    // console.log('All events:', allEvents);
    // return allEvents;
    return {userEvents, plannerEvents, courseEvents};
}//end to fetchCalendarEvents

function decodeHtml(str: string | null) {
    if (!str) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}//end to decodeHTML

export function shadePastEvents() {

    waitForCalendarEvents(() => {
        const today = new Date().toISOString().split("T")[0];
        const currentMonth = today.slice(0, 7);
        const viewStart = window.location.hash.split("view_start=")[1]?.split("&")[0];
        const viewStartMonth = viewStart?.slice(0, 7);
    
        //if calendar renders current month
        if (viewStartMonth === currentMonth) {
            waitForCalendarEvents(async () => {
                let userEvents, plannerEvents, courseEvents;
                ({userEvents, plannerEvents, courseEvents} = await fetchCalendarEvents());

                const calEvents = $(".fc-content-skeleton tbody tr").find(".fc-event").toArray();

                //PAST USER EVENTS
                // console.log('userevents', userEvents);
                const pastUser = userEvents.filter((event: any) => {
                    const endDate = event.end_at 
                        ? event.end_at.split("T")[0] 
                        : event.due_at 
                            ? event.due_at.split("T")[0] 
                            : null;
                    return endDate && endDate <= today;
                });
                pastUser.forEach((pastUserEvent: any) => {  
                    const matchingCalEvents = calEvents.filter(calEvent => calEvent.getAttribute("title") === pastUserEvent.title);
                    $(matchingCalEvents).css("opacity", "0.34");
                });

                 //PAST PLANNER EVENTS
                const pastPlanner = plannerEvents.filter((event: any) => {
                    const endDate = event.end_at 
                        ? event.end_at.split("T")[0] 
                        : event.todo_date 
                            ? event.todo_date.split("T")[0] 
                            : null;
                    return endDate && endDate < today;
                });
                pastPlanner.forEach((pastPlannerEvent: any) => {
                    const matchingCalEvents = calEvents.filter(calEvent => calEvent.getAttribute("title") === pastPlannerEvent.title);
                    $(matchingCalEvents).css("opacity", "0.34");
                });

                //PAST COURSE EVENTS
                const pastCourse = Object.values(courseEvents).flat().filter((event: any) => {
                    const duedate = event.due_at ? event.due_at.split("T")[0] : null;
                    return duedate && duedate < today;
                });
            
                pastCourse.forEach((pastCourseEvent: any) => {
                    const targetTitle = pastCourseEvent.name.trim();
                    const matchingCalEvents = calEvents.filter(calEvent => {
                        const rawTitle = calEvent.getAttribute("title");
                        const decodedTitle = decodeHtml(rawTitle).trim();
                        return decodedTitle === targetTitle;
                    });                
                    $(matchingCalEvents).css("opacity", "0.34");
                });
                
                // const weekRows = $(".fc-row.fc-week");
                // // console.log('weekRows', weekRows);

                // const currentWeekRow = $(".fc-day.fc-today").closest(".fc-row");
                // const currentWeekInd = weekRows.index(currentWeekRow);

                // weekRows.slice(0, currentWeekInd).each((_, week) => {
                //     const events = $(week).find(".fc-content-skeleton tbody tr .fc-event");
                //     events.css("opacity", "0.34");
                // });//end to slice

                // const todayCell = $(".fc-day.fc-today");
                // const todayInd = todayCell.index();

                // const pastDays = currentWeekRow.find(".fc-day").slice(0, todayInd);
                // // console.log('pastDays', pastDays);
                // // console.log('currentWeekRow', currentWeekRow.find(".fc-content-skeleton tbody tr"));

                // pastDays.each((_, day) => {
                //     const columnInd = $(day).index();
                //     const events = currentWeekRow.find(".fc-content-skeleton tbody tr").map((_, tr) => {
                //         const cell = $(tr).children("td");
                //         // console.log('cell', cell);
                      
                //         const events = cell.find(".fc-event").toArray();
                //         // console.log('events', events);
                //         return events;
                //     });
                //     $(events).css("opacity", "0.34");
                // });//end to each
               
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
    fetchCalendarEvents();
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