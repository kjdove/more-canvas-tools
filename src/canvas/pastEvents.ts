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

    waitForCalendarEvents(async () => {
        const today = new Date().toISOString().split("T")[0];
        const currentMonth = today.slice(0, 7);
        const viewStart = window.location.hash.split("view_start=")[1]?.split("&")[0];
        const viewStartMonth = viewStart?.slice(0, 7);
    
        //if calendar renders current month
        if (viewStartMonth === currentMonth) {
            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);
            let userEvents, plannerEvents, courseEvents;
            ({userEvents, plannerEvents, courseEvents} = await fetchCalendarEvents());

            const calEvents = $(".fc-content-skeleton tbody tr").find(".fc-event").toArray();

            //PAST USER EVENTS
            // console.log('userevents', userEvents);
            // const pastUser = userEvents.filter((event: any) => {
            //     const endDate = event.end_at 
            //         ? event.end_at.split("T")[0] 
            //         : event.due_at 
            //             ? event.due_at.split("T")[0] 
            //             : null;
            //     return endDate && endDate < today;
            // });
            const pastUser = userEvents.filter((event: any) => {
                const endDateStr = event.end_at || event.due_at;
                if (!endDateStr) return false;
            
                const endDate = new Date(endDateStr);
                endDate.setHours(0,0,0,0);
            
                return endDate < todayDate;
            });
            pastUser.forEach((pastUserEvent: any) => {  
                const matchingCalEvents = calEvents.filter(calEvent => calEvent.getAttribute("title") === pastUserEvent.title);
                $(matchingCalEvents).css("opacity", "0.34");
            });

            //PAST PLANNER EVENTS
            // const pastPlanner = plannerEvents.filter((event: any) => {
            //     const endDate = event.end_at 
            //         ? event.end_at.split("T")[0] 
            //         : event.todo_date 
            //             ? event.todo_date.split("T")[0] 
            //             : null;
            //     return endDate && endDate < today;
            // });
            const pastPlanner = plannerEvents.filter((event: any) => {
                const endDateStr = event.end_at || event.todo_date;
                if (!endDateStr) return false;
            
                const endDate = new Date(endDateStr);
                endDate.setHours(0,0,0,0);
            
                return endDate < todayDate;
            });
            pastPlanner.forEach((pastPlannerEvent: any) => {
                const matchingCalEvents = calEvents.filter(calEvent => calEvent.getAttribute("title") === pastPlannerEvent.title);
                $(matchingCalEvents).css("opacity", "0.34");
            });

            //PAST COURSE EVENTS
            const pastCourse = Object.values(courseEvents).flat().filter((event: any) => {
                if (!event.due_at) return false;
        
                const dueDate = new Date(event.due_at);
                dueDate.setHours(0,0,0,0);
        
                return dueDate < todayDate;
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