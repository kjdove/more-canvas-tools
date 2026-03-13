/**
 * scrollNowLine.ts
 * automatically scroll to where nowline is when current week is rendered for week view calendar
 */

function scrollToNowLine() {
    console.log('here 2');
    const isWeekView =
      window.location.pathname.includes('/calendar') &&
      window.location.hash.includes('view_name=week');
    
      if(isWeekView){
        console.log('here 3');
        const nowline = $(`.calendar-nowline`);
        console.log('found nowline', nowline);
        const scrollContent = $(`.fc-scroller.fc-time-grid-container`);
        console.log('found scroll content', scrollContent);

        if(nowline && scrollContent){
            console.log('here 4');
            nowline.get(0)?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }//end to if
      }//end to if week view

}//end to scrollToNowLine

export function loadScrollToNowLine() {
    console.log('here 1');
    const test1 = () => {
        console.log('hash changed');
        scrollToNowLine();
    }
    const test2 = () => {
        console.log('reload');
        scrollToNowLine();
    }
    window.addEventListener('hashchange', test1);
    window.addEventListener('load', test2);
}