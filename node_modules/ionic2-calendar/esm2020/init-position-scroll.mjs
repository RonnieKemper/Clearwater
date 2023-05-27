import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import * as i0 from "@angular/core";
export class initPositionScrollComponent {
    constructor(el, ngZone) {
        this.ngZone = ngZone;
        this.onScroll = new EventEmitter();
        this.listenerAttached = false;
        this.element = el;
    }
    ngOnChanges(changes) {
        let initPosition = changes['initPosition'];
        if (initPosition && initPosition.currentValue !== undefined && this.scrollContent && initPosition.currentValue != this.scrollContent.scrollTop) {
            const me = this;
            this.ngZone.run(() => {
                me.scrollContent.scrollTop = initPosition.currentValue;
            });
        }
    }
    ngAfterViewInit() {
        const scrollContent = this.scrollContent = this.element.nativeElement.querySelector('.scroll-content');
        if (this.initPosition !== undefined) {
            scrollContent.scrollTop = this.initPosition;
        }
        if (this.emitEvent && !this.listenerAttached) {
            let onScroll = this.onScroll;
            let me = this;
            this.handler = function () {
                if (me.initPosition != scrollContent.scrollTop) {
                    onScroll.emit(scrollContent.scrollTop);
                }
            };
            this.listenerAttached = true;
            scrollContent.addEventListener('scroll', this.handler);
        }
    }
    ngOnDestroy() {
        if (this.listenerAttached) {
            this.scrollContent.removeEventListener('scroll', this.handler);
            this.listenerAttached = false;
        }
    }
}
initPositionScrollComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: initPositionScrollComponent, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
initPositionScrollComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.1.2", type: initPositionScrollComponent, selector: "init-position-scroll", inputs: { initPosition: "initPosition", emitEvent: "emitEvent" }, outputs: { onScroll: "onScroll" }, usesOnChanges: true, ngImport: i0, template: `
        <div class="scroll-content" style="height:100%">
            <ng-content></ng-content>
        </div>
    `, isInline: true, styles: [".scroll-content{overflow-y:auto;overflow-x:hidden}\n"], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: initPositionScrollComponent, decorators: [{
            type: Component,
            args: [{ selector: 'init-position-scroll', template: `
        <div class="scroll-content" style="height:100%">
            <ng-content></ng-content>
        </div>
    `, encapsulation: ViewEncapsulation.None, styles: [".scroll-content{overflow-y:auto;overflow-x:hidden}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { initPosition: [{
                type: Input
            }], emitEvent: [{
                type: Input
            }], onScroll: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC1wb3NpdGlvbi1zY3JvbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5pdC1wb3NpdGlvbi1zY3JvbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFDVCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFNWixpQkFBaUIsRUFFcEIsTUFBTSxlQUFlLENBQUM7O0FBaUJ2QixNQUFNLE9BQU8sMkJBQTJCO0lBVXBDLFlBQVksRUFBYSxFQUFVLE1BQWM7UUFBZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBUHZDLGFBQVEsR0FBRyxJQUFJLFlBQVksRUFBVSxDQUFDO1FBS3hDLHFCQUFnQixHQUFXLEtBQUssQ0FBQztRQUdyQyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXFCO1FBQzdCLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMzQyxJQUFJLFlBQVksSUFBSSxZQUFZLENBQUMsWUFBWSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLFlBQVksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUU7WUFDNUksTUFBTSxFQUFFLEdBQUUsSUFBSSxDQUFDO1lBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNqQixFQUFFLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDO1lBQzNELENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUQsZUFBZTtRQUNYLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdkcsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRTtZQUNqQyxhQUFhLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7U0FDL0M7UUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDMUMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUM3QixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDZCxJQUFJLENBQUMsT0FBTyxHQUFHO2dCQUNYLElBQUcsRUFBRSxDQUFDLFlBQVksSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFO29CQUMzQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDMUM7WUFDTCxDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzdCLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzFEO0lBQ0wsQ0FBQztJQUVELFdBQVc7UUFDUCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUN2QixJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztTQUNqQztJQUNMLENBQUM7O3dIQWhEUSwyQkFBMkI7NEdBQTNCLDJCQUEyQixzTEFiMUI7Ozs7S0FJVDsyRkFTUSwyQkFBMkI7a0JBZnZDLFNBQVM7K0JBQ0ksc0JBQXNCLFlBQ3RCOzs7O0tBSVQsaUJBT2MsaUJBQWlCLENBQUMsSUFBSTtzSEFHNUIsWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNJLFFBQVE7c0JBQWpCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENvbXBvbmVudCxcbiAgICBJbnB1dCxcbiAgICBPdXRwdXQsXG4gICAgRXZlbnRFbWl0dGVyLFxuICAgIEVsZW1lbnRSZWYsXG4gICAgU2ltcGxlQ2hhbmdlcyxcbiAgICBPbkNoYW5nZXMsXG4gICAgQWZ0ZXJWaWV3SW5pdCxcbiAgICBPbkRlc3Ryb3ksXG4gICAgVmlld0VuY2Fwc3VsYXRpb24sXG4gICAgTmdab25lXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2luaXQtcG9zaXRpb24tc2Nyb2xsJyxcbiAgICB0ZW1wbGF0ZTogYFxuICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWNvbnRlbnRcIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+XG4gICAgICAgICAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG4gICAgICAgIDwvZGl2PlxuICAgIGAsXG4gICAgc3R5bGVzOiBbYFxuICAgICAgICAuc2Nyb2xsLWNvbnRlbnQge1xuICAgICAgICAgICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICAgICAgfSAgICAgICAgXG4gICAgYF0sXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZVxufSlcbmV4cG9ydCBjbGFzcyBpbml0UG9zaXRpb25TY3JvbGxDb21wb25lbnQgaW1wbGVtZW50cyBPbkNoYW5nZXMsIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gICAgQElucHV0KCkgaW5pdFBvc2l0aW9uITpudW1iZXI7XG4gICAgQElucHV0KCkgZW1pdEV2ZW50Pzpib29sZWFuO1xuICAgIEBPdXRwdXQoKSBvblNjcm9sbCA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPigpO1xuXG4gICAgcHJpdmF0ZSBlbGVtZW50OkVsZW1lbnRSZWY7XG4gICAgcHJpdmF0ZSBzY3JvbGxDb250ZW50ITpIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGhhbmRsZXIhOigpPT52b2lkO1xuICAgIHByaXZhdGUgbGlzdGVuZXJBdHRhY2hlZDpib29sZWFuID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihlbDpFbGVtZW50UmVmLCBwcml2YXRlIG5nWm9uZTogTmdab25lKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsO1xuICAgIH1cblxuICAgIG5nT25DaGFuZ2VzKGNoYW5nZXM6U2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBsZXQgaW5pdFBvc2l0aW9uID0gY2hhbmdlc1snaW5pdFBvc2l0aW9uJ107XG4gICAgICAgIGlmIChpbml0UG9zaXRpb24gJiYgaW5pdFBvc2l0aW9uLmN1cnJlbnRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuc2Nyb2xsQ29udGVudCAmJiBpbml0UG9zaXRpb24uY3VycmVudFZhbHVlICE9IHRoaXMuc2Nyb2xsQ29udGVudC5zY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIGNvbnN0IG1lID10aGlzO1xuICAgICAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBtZS5zY3JvbGxDb250ZW50LnNjcm9sbFRvcCA9IGluaXRQb3NpdGlvbi5jdXJyZW50VmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsQ29udGVudCA9IHRoaXMuc2Nyb2xsQ29udGVudCA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zY3JvbGwtY29udGVudCcpO1xuICAgICAgICBpZiAodGhpcy5pbml0UG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2Nyb2xsQ29udGVudC5zY3JvbGxUb3AgPSB0aGlzLmluaXRQb3NpdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmVtaXRFdmVudCAmJiAhdGhpcy5saXN0ZW5lckF0dGFjaGVkKSB7XG4gICAgICAgICAgICBsZXQgb25TY3JvbGwgPSB0aGlzLm9uU2Nyb2xsO1xuICAgICAgICAgICAgbGV0IG1lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZihtZS5pbml0UG9zaXRpb24gIT0gc2Nyb2xsQ29udGVudC5zY3JvbGxUb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgb25TY3JvbGwuZW1pdChzY3JvbGxDb250ZW50LnNjcm9sbFRvcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJBdHRhY2hlZCA9IHRydWU7XG4gICAgICAgICAgICBzY3JvbGxDb250ZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uRGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJBdHRhY2hlZCkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxDb250ZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuaGFuZGxlcik7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyQXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==