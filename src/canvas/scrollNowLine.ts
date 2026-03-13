/**
 * scrollNowLine.ts
 * automatically scroll to where nowline is when current week is rendered for week view calendar
 */

function scrollToNowLine() {
    const isWeekView =
      window.location.pathname.includes('/calendar') &&
      window.location.hash.includes('view_name=week');
    
      if(isWeekView){
        const nowline = $(`.calendar-nowline`);
        // console.log('found nowline', nowline);
        const scrollContent = $(`.fc-scroller.fc-time-grid-container`);
        // console.log('found scroll content', scrollContent);

        if(nowline && scrollContent){
            nowline.get(0)?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }//end to if
      }//end to if week view

}//end to scrollToNowLine

export function loadScrollToNowLine() {
    window.addEventListener('hashchange', scrollToNowLine);
    window.addEventListener('load', scrollToNowLine);
}