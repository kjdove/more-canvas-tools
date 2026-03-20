/**
 * scrollNowLine.ts
 * automatically scroll to where nowline is when current week is rendered for week view calendar
 */

function scrollToNowLine() {
    const isWeekView =
        window.location.pathname.includes('/calendar') &&
        window.location.hash.includes('view_name=week');
    if (!isWeekView) return;
    
    if(isWeekView){
        setTimeout(() => {
            const nowline = $(`.calendar-nowline`);
            const scrollContent = $(`.fc-scroller.fc-time-grid-container`);

            if(nowline.length && scrollContent.length){
                const offset = nowline.position()?.top ?? 0;
                const scHeight = scrollContent.height() ?? 0;
                scrollContent.animate({
                    scrollTop: offset - scHeight / 2
                    }, 400);
            }//end to if
        }, 300)//end setTimeout, wait for the week view to be rendered
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
              scrollToNowLine();
            }
          }, 200);
    }//end to watchHashChange
    watchHashChange();
}//end to loadScrollToNowLine