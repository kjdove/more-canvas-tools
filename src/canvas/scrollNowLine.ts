/**
 * scrollNowLine.ts
 * automatically scroll to where nowline is when current week is rendered for week view calendar
 */

function scrollToNowLine() {
    // const currentWeek = 
    const isWeekView =
        window.location.pathname.includes('/calendar') &&
        window.location.hash.includes('view_name=week');
    if (!isWeekView) return;
    
    if(isWeekView){
        setTimeout(() => {
            const nowline = $(`.calendar-nowline`);
            // console.log('found nowline', nowline.position());
            // console.log('nowline ', nowline.get(0));    
            const scrollContent = $(`.fc-scroller.fc-time-grid-container`);
            // console.log('found scroll content', scrollContent);

            if(nowline.length && scrollContent.length){
                const offset = nowline.position()?.top ?? 0;
                const scHeight = scrollContent.height() ?? 0;
                scrollContent.animate({
                    scrollTop: offset - scHeight / 2
                    }, 400);
            }//end to if
        }, 300)//wait for the week view to be rendered
    }//end to if week view

}//end to scrollToNowLine

export function loadScrollToNowLine() {
    scrollToNowLine();
    window.addEventListener('load', scrollToNowLine);
    let lastHash = window.location.hash;
    const watchHashChange = () => {
        setInterval(() => {
            if (window.location.hash !== lastHash) {
              lastHash = window.location.hash;
              console.log("hash changed", lastHash);
              scrollToNowLine();
            }
          }, 200);
    }//end to watchHashChange
    watchHashChange();
}//end to loadScrollToNowLine