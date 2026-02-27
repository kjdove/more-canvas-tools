import { startDialog } from "~src/canvas/dialog";
import { Course } from "~src/canvas/interfaces";

const VIEW_INSIGHTS_BUTTON = `
<div style="display:inline-block; margin-left: 10px;">
 <button
   title="View Weekly Insights"
   class="insights-button"
   id="cwu-view-insights-load">
   View Weekly Insights
 </button>
</div>
`;

const INSIGHTS_DIALOG = `
<div id="cwu-insights-dialog" title="Weekly Insights" style="display:none;">
    <iframe id="cwu-insights-iframe" src="" width="100%" height="400px" frameborder="0"></iframe>
</div>
`;


function getSelectedCoursesLegend() {
  const courses: { name: string; courseId: string }[] = [];

  $(".context_list_context.checked").each((_, el) => {
    const $el = $(el);
    const name = $el.find("label").text().trim();
    const courseId = $el.data("context");
   
    courses.push({ name, courseId });
    });

  console.log("Selected courses for legend:", courses);
  return courses;
}

function buildLegendHTML() {
    const courses = getSelectedCoursesLegend();

    if (!courses.length) {
        return `<p>No courses currently toggled on.</p>`;
    }

    return `
        <div style="margin-bottom:15px;">
            <h3>Legend:</h3>
            ${courses
                .map(
                    (course) => `
                <div style="display:flex; align-items:center; margin-bottom:6px;">
                    <div class= "group_${course.courseId}"  style="
                        width:14px;
                        height:14px;
                        margin-right:8px;
                        border-radius:3px;">
                    </div>
                    <span>${course.name}</span>
                </div>
            `
                )
                .join("")}
        </div>
    `;
}


export function loadInsightsReport() {
   const header = $(".header-bar-outer-container.calendar_header");
   if (header.length && !$("#cwu-view-insights-load").length) {
       header.append(VIEW_INSIGHTS_BUTTON);
       console.log("Insights button added");
   }

   const currentDate = new Date();
  //  console.log("Current date:", currentDate);
   const startOfWeek = new Date(currentDate);
   startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
  //  console.log("Start of week:", startOfWeek);
   const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
   const currentMonth = startOfWeek.getMonth(); 
   const currentSunday = startOfWeek.getDate();
   const currentYear = startOfWeek.getFullYear();
  //  console.log("Current month:", currentMonth);
  //  console.log("Current Sunday date:", currentSunday);

   const currentWeek = `${months[currentMonth]} ${currentSunday}, ${currentYear}`;

   const legendHTML = buildLegendHTML();
   $("#cwu-view-insights-load").click(() => {
    const innerHTML = `
        ${legendHTML}
        <iframe id="cwu-insights-iframe" src="" width="100%" height="400px" frameborder="0"></iframe>
    `;
    startDialog(`Weekly Insights - Week of ${currentWeek}`, innerHTML);
  });
}//end to loadInsightsReport
