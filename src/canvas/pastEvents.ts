/**
 * pastEvents.ts
 * shade/lighten past events on calendar month view to visually distinguish them from upcoming events
 */

import { waitForCalendarEvents, getSelectedCourses } from "src/reports/viewInsights";

function getIds() {
    const selectedCourses = getSelectedCourses();
    return selectedCourses.map(course => course.courseId);
}//end to getIds

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

    //get planner events/notes
    const plannerEventsFetch = await fetch(`/api/v1/planner_notes?start_date=${start_date}&per_page=100`);
    const plannerEvents = await plannerEventsFetch.json();

    //get course assignments/events
    const courseFetches = formattedCourseIds.map(id =>
        fetch(`/api/v1/courses/${id}/assignments?start_date=${start_date}&per_page=100`).then(res => res.json())
    );
    const courseResults = await Promise.all(courseFetches);
    const courseEvents: { [key: string]: any } = {};
    course_ids.forEach((courseId, i) => {
        courseEvents[courseId] = courseResults[i];
    });

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

            //events from calendar
            const calEvents = $(".fc-content-skeleton tbody tr").find(".fc-event").toArray();
            const calEventMap = new Map();
            calEvents.forEach((el) => {
                const rawTitle = el.getAttribute("title");
                const decodedTitle = decodeHtml(rawTitle).trim();
                calEventMap.set(decodedTitle, el);
            });//end to calEvents

            //past user events
            const pastUser = userEvents.filter((event: any) => {
                const endDateStr = event.end_at || event.due_at;
                if (!endDateStr) return false;
            
                const endDate = new Date(endDateStr);
                endDate.setHours(0,0,0,0);
            
                return endDate < todayDate;
            });//end to pastUser

            //past planner events
            const pastPlanner = plannerEvents.filter((event: any) => {
                const endDateStr = event.end_at || event.todo_date;
                if (!endDateStr) return false;
            
                const endDate = new Date(endDateStr);
                endDate.setHours(0,0,0,0);
            
                return endDate < todayDate;
            });//end to pastPlanner

            //past course events
            const pastCourse = Object.values(courseEvents).flat().filter((event: any) => {
                if (!event.due_at) return false;
        
                const dueDate = new Date(event.due_at);
                dueDate.setHours(0,0,0,0);
        
                return dueDate < todayDate;
            });//end to pastCourse

            //shade past events
            const pastEvents = [
                ...pastUser.map((e: { title: string; }) => e.title),
                ...pastPlanner.map((e: { title: string; }) => e.title),
                ...pastCourse.map(e => e.name)
            ];
            pastEvents.forEach(title => {
                const el = calEventMap.get(title?.trim());
                if (el) el.style.opacity = "0.34";
            });
        }//end to if
    
        //else if calendar renders a past month, shade all events
        else if(viewStart < today){
            const events = $(".fc-content-skeleton tbody tr").find(".fc-event");
            events.css("opacity", "0.34");
        }//end to else if
    });//end to waitForCalendarEvents
}//end to shadePastEvents

//if an event is added, edited, or deleted, readd shading
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