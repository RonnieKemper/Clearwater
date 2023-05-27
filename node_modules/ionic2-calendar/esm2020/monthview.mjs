import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "./calendar.service";
import * as i2 from "@angular/common";
import * as i3 from "swiper/angular";
export class MonthViewComponent {
    constructor(calendarService, zone) {
        this.calendarService = calendarService;
        this.zone = zone;
        this.autoSelect = true;
        this.dir = '';
        this.onRangeChanged = new EventEmitter();
        this.onEventSelected = new EventEmitter();
        this.onTimeSelected = new EventEmitter();
        this.onTitleChanged = new EventEmitter();
        this.views = [];
        this.currentViewIndex = 0;
        this.mode = 'month';
        this.direction = 0;
        this.moveOnSelected = false;
        this.inited = false;
        this.callbackOnInit = true;
    }
    static getDates(startDate, n) {
        const dates = new Array(n), current = new Date(startDate.getTime());
        let i = 0;
        while (i < n) {
            dates[i++] = new Date(current.getTime());
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }
    ngOnInit() {
        if (!this.sliderOptions) {
            this.sliderOptions = {};
        }
        this.sliderOptions.loop = true;
        if (this.dateFormatter && this.dateFormatter.formatMonthViewDay) {
            this.formatDayLabel = this.dateFormatter.formatMonthViewDay;
        }
        else {
            const dayLabelDatePipe = new DatePipe('en-US');
            this.formatDayLabel = function (date) {
                return dayLabelDatePipe.transform(date, this.formatDay) || '';
            };
        }
        if (this.dateFormatter && this.dateFormatter.formatMonthViewDayHeader) {
            this.formatDayHeaderLabel = this.dateFormatter.formatMonthViewDayHeader;
        }
        else {
            const datePipe = new DatePipe(this.locale);
            this.formatDayHeaderLabel = function (date) {
                return datePipe.transform(date, this.formatDayHeader) || '';
            };
        }
        if (this.dateFormatter && this.dateFormatter.formatMonthViewTitle) {
            this.formatTitle = this.dateFormatter.formatMonthViewTitle;
        }
        else {
            const datePipe = new DatePipe(this.locale);
            this.formatTitle = function (date) {
                return datePipe.transform(date, this.formatMonthTitle) || '';
            };
        }
        this.refreshView();
        this.inited = true;
        this.currentDateChangedFromParentSubscription = this.calendarService.currentDateChangedFromParent$.subscribe(currentDate => {
            this.refreshView();
        });
        this.eventSourceChangedSubscription = this.calendarService.eventSourceChanged$.subscribe(() => {
            this.onDataLoaded();
        });
        this.slideChangedSubscription = this.calendarService.slideChanged$.subscribe(direction => {
            if (direction === 1) {
                this.slider.swiperRef.slideNext();
            }
            else if (direction === -1) {
                this.slider.swiperRef.slidePrev();
            }
        });
        this.slideUpdatedSubscription = this.calendarService.slideUpdated$.subscribe(() => {
            this.slider.swiperRef.update();
        });
    }
    ngOnDestroy() {
        if (this.currentDateChangedFromParentSubscription) {
            this.currentDateChangedFromParentSubscription.unsubscribe();
            this.currentDateChangedFromParentSubscription = undefined;
        }
        if (this.eventSourceChangedSubscription) {
            this.eventSourceChangedSubscription.unsubscribe();
            this.eventSourceChangedSubscription = undefined;
        }
        if (this.slideChangedSubscription) {
            this.slideChangedSubscription.unsubscribe();
            this.slideChangedSubscription = undefined;
        }
        if (this.slideUpdatedSubscription) {
            this.slideUpdatedSubscription.unsubscribe();
            this.slideUpdatedSubscription = undefined;
        }
    }
    ngOnChanges(changes) {
        if (!this.inited) {
            return;
        }
        const eventSourceChange = changes['eventSource'];
        if (eventSourceChange && eventSourceChange.currentValue) {
            this.onDataLoaded();
        }
        const lockSwipeToPrev = changes['lockSwipeToPrev'];
        if (lockSwipeToPrev) {
            this.slider.swiperRef.allowSlidePrev = !lockSwipeToPrev.currentValue;
        }
        const lockSwipeToNext = changes['lockSwipeToNext'];
        if (lockSwipeToNext) {
            this.slider.swiperRef.allowSlideNext = !lockSwipeToNext.currentValue;
        }
        const lockSwipes = changes['lockSwipes'];
        if (lockSwipes) {
            this.slider.swiperRef.allowTouchMove = !lockSwipes.currentValue;
        }
    }
    ngAfterViewInit() {
        const title = this.getTitle();
        this.onTitleChanged.emit(title);
    }
    setSwiperInstance(swiper) {
        this.slider = swiper;
    }
    onSlideChanged() {
        this.zone.run(() => {
            if (this.callbackOnInit) {
                this.callbackOnInit = false;
                return;
            }
            let direction = 0;
            const currentViewIndex = this.currentViewIndex;
            let currentSlideIndex = this.slider.swiperRef.activeIndex;
            currentSlideIndex = (currentSlideIndex + 2) % 3;
            if (isNaN(currentSlideIndex)) {
                currentSlideIndex = currentViewIndex;
            }
            if (currentSlideIndex - currentViewIndex === 1) {
                direction = 1;
            }
            else if (currentSlideIndex === 0 && currentViewIndex === 2) {
                direction = 1;
                this.slider.swiperRef.slideTo(1, 0, false);
            }
            else if (currentViewIndex - currentSlideIndex === 1) {
                direction = -1;
            }
            else if (currentSlideIndex === 2 && currentViewIndex === 0) {
                direction = -1;
                this.slider.swiperRef.slideTo(3, 0, false);
            }
            this.currentViewIndex = currentSlideIndex;
            this.move(direction);
        });
    }
    move(direction) {
        if (direction === 0) {
            return;
        }
        this.direction = direction;
        if (!this.moveOnSelected) {
            const adjacentDate = this.calendarService.getAdjacentCalendarDate(this.mode, direction);
            this.calendarService.setCurrentDate(adjacentDate);
        }
        this.refreshView();
        this.direction = 0;
        this.moveOnSelected = false;
    }
    createDateObject(date) {
        let disabled = false;
        if (this.markDisabled) {
            disabled = this.markDisabled(date);
        }
        return {
            date,
            events: [],
            label: this.formatDayLabel(date),
            secondary: false,
            disabled
        };
    }
    getViewData(startTime) {
        const startDate = startTime, date = startDate.getDate(), month = (startDate.getMonth() + (date !== 1 ? 1 : 0)) % 12;
        const dates = MonthViewComponent.getDates(startDate, 42);
        const days = [];
        for (let i = 0; i < 42; i++) {
            const dateObject = this.createDateObject(dates[i]);
            dateObject.secondary = dates[i].getMonth() !== month;
            days[i] = dateObject;
        }
        const dayHeaders = [];
        for (let i = 0; i < 7; i++) {
            dayHeaders.push(this.formatDayHeaderLabel(days[i].date));
        }
        return {
            dates: days,
            dayHeaders
        };
    }
    getHighlightClass(date) {
        let className = '';
        if (date.hasEvent) {
            if (date.secondary) {
                className = 'monthview-secondary-with-event';
            }
            else {
                className = 'monthview-primary-with-event';
            }
        }
        if (date.selected) {
            if (className) {
                className += ' ';
            }
            className += 'monthview-selected';
        }
        if (date.current) {
            if (className) {
                className += ' ';
            }
            className += 'monthview-current';
        }
        if (date.secondary) {
            if (className) {
                className += ' ';
            }
            className += 'text-muted';
        }
        if (date.disabled) {
            if (className) {
                className += ' ';
            }
            className += 'monthview-disabled';
        }
        return className;
    }
    getRange(currentDate) {
        const year = currentDate.getFullYear(), month = currentDate.getMonth(), firstDayOfMonth = new Date(year, month, 1, 12, 0, 0), // set hour to 12 to avoid DST problem
        difference = this.startingDayMonth - firstDayOfMonth.getDay(), numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : -difference, startDate = new Date(firstDayOfMonth.getTime());
        if (numDisplayedFromPreviousMonth > 0) {
            startDate.setDate(-numDisplayedFromPreviousMonth + 1);
        }
        const endDate = new Date(startDate.getTime());
        endDate.setDate(endDate.getDate() + 42);
        return {
            startTime: startDate,
            endTime: endDate
        };
    }
    onDataLoaded() {
        const range = this.range, eventSource = this.eventSource, len = eventSource ? eventSource.length : 0, startTime = range.startTime, endTime = range.endTime, utcStartTime = Date.UTC(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()), utcEndTime = Date.UTC(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()), currentViewIndex = this.currentViewIndex, dates = this.views[currentViewIndex].dates, oneDay = 86400000, eps = 0.0006;
        for (let r = 0; r < 42; r += 1) {
            if (dates[r].hasEvent) {
                dates[r].hasEvent = false;
                dates[r].events = [];
            }
        }
        for (let i = 0; i < len; i += 1) {
            const event = eventSource[i], eventStartTime = event.startTime, eventEndTime = event.endTime;
            let eventUTCStartTime, eventUTCEndTime;
            if (event.allDay) {
                eventUTCStartTime = eventStartTime.getTime();
                eventUTCEndTime = eventEndTime.getTime();
            }
            else {
                eventUTCStartTime = Date.UTC(eventStartTime.getFullYear(), eventStartTime.getMonth(), eventStartTime.getDate());
                eventUTCEndTime = Date.UTC(eventEndTime.getFullYear(), eventEndTime.getMonth(), eventEndTime.getDate() + 1);
            }
            if (eventUTCEndTime <= utcStartTime || eventUTCStartTime >= utcEndTime) {
                continue;
            }
            let timeDifferenceStart, timeDifferenceEnd;
            if (eventUTCStartTime < utcStartTime) {
                timeDifferenceStart = 0;
            }
            else {
                timeDifferenceStart = (eventUTCStartTime - utcStartTime) / oneDay;
            }
            if (eventUTCEndTime > utcEndTime) {
                timeDifferenceEnd = (utcEndTime - utcStartTime) / oneDay;
            }
            else {
                timeDifferenceEnd = (eventUTCEndTime - utcStartTime) / oneDay;
            }
            let index = Math.floor(timeDifferenceStart);
            const endIndex = Math.ceil(timeDifferenceEnd - eps);
            while (index < endIndex) {
                dates[index].hasEvent = true;
                let eventSet = dates[index].events;
                if (eventSet) {
                    eventSet.push(event);
                }
                else {
                    eventSet = [];
                    eventSet.push(event);
                    dates[index].events = eventSet;
                }
                index += 1;
            }
        }
        for (let r = 0; r < 42; r += 1) {
            if (dates[r].hasEvent) {
                dates[r].events.sort(this.compareEvent);
            }
        }
        if (this.autoSelect) {
            let findSelected = false;
            for (let r = 0; r < 42; r += 1) {
                if (dates[r].selected) {
                    this.selectedDate = dates[r];
                    findSelected = true;
                    break;
                }
            }
            if (findSelected && this.selectedDate) {
                this.onTimeSelected.emit({
                    selectedTime: this.selectedDate.date,
                    events: this.selectedDate.events,
                    disabled: this.selectedDate.disabled
                });
            }
        }
    }
    refreshView() {
        this.range = this.getRange(this.calendarService.currentDate);
        if (this.inited) {
            const title = this.getTitle();
            this.onTitleChanged.emit(title);
        }
        this.calendarService.populateAdjacentViews(this);
        this.updateCurrentView(this.range.startTime, this.views[this.currentViewIndex]);
        this.calendarService.rangeChanged(this);
    }
    getTitle() {
        const currentViewStartDate = this.range.startTime, date = currentViewStartDate.getDate(), month = (currentViewStartDate.getMonth() + (date !== 1 ? 1 : 0)) % 12, year = currentViewStartDate.getFullYear() + (date !== 1 && month === 0 ? 1 : 0), headerDate = new Date(year, month, 1, 12, 0, 0, 0);
        return this.formatTitle(headerDate);
    }
    compareEvent(event1, event2) {
        if (event1.allDay) {
            return 1;
        }
        else if (event2.allDay) {
            return -1;
        }
        else {
            return (event1.startTime.getTime() - event2.startTime.getTime());
        }
    }
    select(viewDate) {
        if (!this.views) {
            return;
        }
        const selectedDate = viewDate.date, events = viewDate.events;
        if (!viewDate.disabled) {
            const dates = this.views[this.currentViewIndex].dates, currentCalendarDate = this.calendarService.currentDate, currentMonth = currentCalendarDate.getMonth(), currentYear = currentCalendarDate.getFullYear(), selectedMonth = selectedDate.getMonth(), selectedYear = selectedDate.getFullYear();
            let direction = 0;
            if (currentYear === selectedYear) {
                if (currentMonth !== selectedMonth) {
                    direction = currentMonth < selectedMonth ? 1 : -1;
                }
            }
            else {
                direction = currentYear < selectedYear ? 1 : -1;
            }
            this.calendarService.setCurrentDate(selectedDate);
            if (direction === 0) {
                const currentViewStartDate = this.range.startTime, oneDay = 86400000, selectedDayDifference = Math.round((Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) - Date.UTC(currentViewStartDate.getFullYear(), currentViewStartDate.getMonth(), currentViewStartDate.getDate())) / oneDay);
                for (let r = 0; r < 42; r += 1) {
                    dates[r].selected = false;
                }
                if (selectedDayDifference >= 0 && selectedDayDifference < 42) {
                    dates[selectedDayDifference].selected = true;
                    this.selectedDate = dates[selectedDayDifference];
                }
            }
            else {
                this.moveOnSelected = true;
                this.slideView(direction);
            }
        }
        this.onTimeSelected.emit({ selectedTime: selectedDate, events, disabled: viewDate.disabled });
    }
    slideView(direction) {
        if (direction === 1) {
            this.slider.swiperRef.slideNext();
        }
        else if (direction === -1) {
            this.slider.swiperRef.slidePrev();
        }
    }
    updateCurrentView(currentViewStartDate, view) {
        const currentCalendarDate = this.calendarService.currentDate, today = new Date(), oneDay = 86400000, selectedDayDifference = Math.round((Date.UTC(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), currentCalendarDate.getDate()) - Date.UTC(currentViewStartDate.getFullYear(), currentViewStartDate.getMonth(), currentViewStartDate.getDate())) / oneDay), currentDayDifference = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(currentViewStartDate.getFullYear(), currentViewStartDate.getMonth(), currentViewStartDate.getDate())) / oneDay);
        for (let r = 0; r < 42; r += 1) {
            view.dates[r].selected = false;
        }
        if (selectedDayDifference >= 0 && selectedDayDifference < 42 && !view.dates[selectedDayDifference].disabled && (this.autoSelect || this.moveOnSelected)) {
            view.dates[selectedDayDifference].selected = true;
            this.selectedDate = view.dates[selectedDayDifference];
        }
        else {
            this.selectedDate = undefined;
        }
        if (currentDayDifference >= 0 && currentDayDifference < 42) {
            view.dates[currentDayDifference].current = true;
        }
    }
    eventSelected(event) {
        this.onEventSelected.emit(event);
    }
}
MonthViewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: MonthViewComponent, deps: [{ token: i1.CalendarService }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
MonthViewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.1.2", type: MonthViewComponent, selector: "monthview", inputs: { monthviewDisplayEventTemplate: "monthviewDisplayEventTemplate", monthviewInactiveDisplayEventTemplate: "monthviewInactiveDisplayEventTemplate", monthviewEventDetailTemplate: "monthviewEventDetailTemplate", formatDay: "formatDay", formatDayHeader: "formatDayHeader", formatMonthTitle: "formatMonthTitle", eventSource: "eventSource", startingDayMonth: "startingDayMonth", showEventDetail: "showEventDetail", noEventsLabel: "noEventsLabel", autoSelect: "autoSelect", markDisabled: "markDisabled", locale: "locale", dateFormatter: "dateFormatter", dir: "dir", lockSwipeToPrev: "lockSwipeToPrev", lockSwipeToNext: "lockSwipeToNext", lockSwipes: "lockSwipes", sliderOptions: "sliderOptions" }, outputs: { onRangeChanged: "onRangeChanged", onEventSelected: "onEventSelected", onTimeSelected: "onTimeSelected", onTitleChanged: "onTitleChanged" }, viewQueries: [{ propertyName: "slider", first: true, predicate: ["swiper"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
        <div>
            <swiper #swiper [config]="sliderOptions" [dir]="dir" [allowSlidePrev]="!lockSwipeToPrev" [allowSlideNext]="!lockSwipeToNext" [allowTouchMove]="!lockSwipes" (slideChangeTransitionEnd)="onSlideChanged()">
                <ng-template swiperSlide>
                    <table *ngIf="0===currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr>
                            <th *ngFor="let dayHeader of views[0].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]" tappable (click)="select(views[0].dates[row*7+col])"
                                [ngClass]="getHighlightClass(views[0].dates[row*7+col])">
                                <ng-template [ngTemplateOutlet]="monthviewDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[0], row: row, col: col}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <table *ngIf="0!==currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr class="text-center">
                            <th *ngFor="let dayHeader of views[0].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]">
                                <ng-template [ngTemplateOutlet]="monthviewInactiveDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[0], row: row, col: col}">
                                </ng-template>
                            </td>
                        <tr>
                        </tbody>
                    </table>
                </ng-template>
                <ng-template swiperSlide>
                    <table *ngIf="1===currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr>
                            <th *ngFor="let dayHeader of views[1].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]" tappable (click)="select(views[1].dates[row*7+col])"
                                [ngClass]="getHighlightClass(views[1].dates[row*7+col])">
                                <ng-template [ngTemplateOutlet]="monthviewDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[1], row: row, col: col}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <table *ngIf="1!==currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr class="text-center">
                            <th *ngFor="let dayHeader of views[1].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]">
                                <ng-template [ngTemplateOutlet]="monthviewInactiveDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[1], row: row, col: col}">
                                </ng-template>
                            </td>
                        <tr>
                        </tbody>
                    </table>
                </ng-template>
                <ng-template swiperSlide>
                    <table *ngIf="2===currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr>
                            <th *ngFor="let dayHeader of views[2].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]" tappable (click)="select(views[2].dates[row*7+col])"
                                [ngClass]="getHighlightClass(views[2].dates[row*7+col])">
                                <ng-template [ngTemplateOutlet]="monthviewDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[2], row: row, col: col}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <table *ngIf="2!==currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr class="text-center">
                            <th *ngFor="let dayHeader of views[2].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]">
                                <ng-template [ngTemplateOutlet]="monthviewInactiveDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[2], row: row, col: col}">
                                </ng-template>
                            </td>
                        <tr>
                        </tbody>
                    </table>
                </ng-template>
            </swiper>
            <ng-template [ngTemplateOutlet]="monthviewEventDetailTemplate"
                         [ngTemplateOutletContext]="{showEventDetail:showEventDetail, selectedDate: selectedDate, noEventsLabel: noEventsLabel}">
            </ng-template>
        </div>
    `, isInline: true, styles: [".text-muted{color:#999}.table-fixed{table-layout:fixed}.table{width:100%;max-width:100%;background-color:transparent}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:20px;vertical-align:top}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>thead:first-child>tr:first-child>th,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.monthview-primary-with-event{background-color:#3a87ad;color:#fff}.monthview-current{background-color:#f0f0f0}.monthview-selected{background-color:#090;color:#fff}.monthview-datetable td.monthview-disabled{color:#d3d3d3;cursor:default}.monthview-datetable th{text-align:center}.monthview-datetable td{cursor:pointer;text-align:center}.monthview-secondary-with-event{background-color:#d9edf7}::-webkit-scrollbar,*::-webkit-scrollbar{display:none}\n"], dependencies: [{ kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: i3.SwiperComponent, selector: "swiper, [swiper]", inputs: ["enabled", "on", "direction", "touchEventsTarget", "initialSlide", "speed", "cssMode", "updateOnWindowResize", "resizeObserver", "nested", "focusableElements", "width", "height", "preventInteractionOnTransition", "userAgent", "url", "edgeSwipeDetection", "edgeSwipeThreshold", "freeMode", "autoHeight", "setWrapperSize", "virtualTranslate", "effect", "breakpoints", "spaceBetween", "slidesPerView", "maxBackfaceHiddenSlides", "grid", "slidesPerGroup", "slidesPerGroupSkip", "centeredSlides", "centeredSlidesBounds", "slidesOffsetBefore", "slidesOffsetAfter", "normalizeSlideIndex", "centerInsufficientSlides", "watchOverflow", "roundLengths", "touchRatio", "touchAngle", "simulateTouch", "shortSwipes", "longSwipes", "longSwipesRatio", "longSwipesMs", "followFinger", "allowTouchMove", "threshold", "touchMoveStopPropagation", "touchStartPreventDefault", "touchStartForcePreventDefault", "touchReleaseOnEdges", "uniqueNavElements", "resistance", "resistanceRatio", "watchSlidesProgress", "grabCursor", "preventClicks", "preventClicksPropagation", "slideToClickedSlide", "preloadImages", "updateOnImagesReady", "loop", "loopAdditionalSlides", "loopedSlides", "loopedSlidesLimit", "loopFillGroupWithBlank", "loopPreventsSlide", "rewind", "allowSlidePrev", "allowSlideNext", "swipeHandler", "noSwiping", "noSwipingClass", "noSwipingSelector", "passiveListeners", "containerModifierClass", "slideClass", "slideBlankClass", "slideActiveClass", "slideDuplicateActiveClass", "slideVisibleClass", "slideDuplicateClass", "slideNextClass", "slideDuplicateNextClass", "slidePrevClass", "slideDuplicatePrevClass", "wrapperClass", "runCallbacksOnInit", "observeParents", "observeSlideChildren", "a11y", "autoplay", "controller", "coverflowEffect", "cubeEffect", "fadeEffect", "flipEffect", "creativeEffect", "cardsEffect", "hashNavigation", "history", "keyboard", "lazy", "mousewheel", "parallax", "thumbs", "zoom", "slidesPerGroupAuto", "class", "id", "navigation", "pagination", "scrollbar", "virtual", "config"], outputs: ["_beforeBreakpoint", "_containerClasses", "_slideClass", "_swiper", "activeIndexChange", "afterInit", "autoplay", "autoplayStart", "autoplayStop", "autoplayPause", "autoplayResume", "beforeDestroy", "beforeInit", "beforeLoopFix", "beforeResize", "beforeSlideChangeStart", "beforeTransitionStart", "breakpoint", "changeDirection", "click", "doubleTap", "doubleClick", "destroy", "fromEdge", "hashChange", "hashSet", "imagesReady", "init", "keyPress", "lazyImageLoad", "lazyImageReady", "loopFix", "momentumBounce", "navigationHide", "navigationShow", "navigationPrev", "navigationNext", "observerUpdate", "orientationchange", "paginationHide", "paginationRender", "paginationShow", "paginationUpdate", "progress", "reachBeginning", "reachEnd", "realIndexChange", "resize", "scroll", "scrollbarDragEnd", "scrollbarDragMove", "scrollbarDragStart", "setTransition", "setTranslate", "slideChange", "slideChangeTransitionEnd", "slideChangeTransitionStart", "slideNextTransitionEnd", "slideNextTransitionStart", "slidePrevTransitionEnd", "slidePrevTransitionStart", "slideResetTransitionStart", "slideResetTransitionEnd", "sliderMove", "sliderFirstMove", "slidesLengthChange", "slidesGridLengthChange", "snapGridLengthChange", "snapIndexChange", "tap", "toEdge", "touchEnd", "touchMove", "touchMoveOpposite", "touchStart", "transitionEnd", "transitionStart", "update", "zoomChange", "swiper", "lock", "unlock"] }, { kind: "directive", type: i3.SwiperSlideDirective, selector: "ng-template[swiperSlide]", inputs: ["virtualIndex", "class", "ngClass", "data-swiper-autoplay", "zoom"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: MonthViewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'monthview', template: `
        <div>
            <swiper #swiper [config]="sliderOptions" [dir]="dir" [allowSlidePrev]="!lockSwipeToPrev" [allowSlideNext]="!lockSwipeToNext" [allowTouchMove]="!lockSwipes" (slideChangeTransitionEnd)="onSlideChanged()">
                <ng-template swiperSlide>
                    <table *ngIf="0===currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr>
                            <th *ngFor="let dayHeader of views[0].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]" tappable (click)="select(views[0].dates[row*7+col])"
                                [ngClass]="getHighlightClass(views[0].dates[row*7+col])">
                                <ng-template [ngTemplateOutlet]="monthviewDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[0], row: row, col: col}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <table *ngIf="0!==currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr class="text-center">
                            <th *ngFor="let dayHeader of views[0].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]">
                                <ng-template [ngTemplateOutlet]="monthviewInactiveDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[0], row: row, col: col}">
                                </ng-template>
                            </td>
                        <tr>
                        </tbody>
                    </table>
                </ng-template>
                <ng-template swiperSlide>
                    <table *ngIf="1===currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr>
                            <th *ngFor="let dayHeader of views[1].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]" tappable (click)="select(views[1].dates[row*7+col])"
                                [ngClass]="getHighlightClass(views[1].dates[row*7+col])">
                                <ng-template [ngTemplateOutlet]="monthviewDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[1], row: row, col: col}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <table *ngIf="1!==currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr class="text-center">
                            <th *ngFor="let dayHeader of views[1].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]">
                                <ng-template [ngTemplateOutlet]="monthviewInactiveDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[1], row: row, col: col}">
                                </ng-template>
                            </td>
                        <tr>
                        </tbody>
                    </table>
                </ng-template>
                <ng-template swiperSlide>
                    <table *ngIf="2===currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr>
                            <th *ngFor="let dayHeader of views[2].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]" tappable (click)="select(views[2].dates[row*7+col])"
                                [ngClass]="getHighlightClass(views[2].dates[row*7+col])">
                                <ng-template [ngTemplateOutlet]="monthviewDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[2], row: row, col: col}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <table *ngIf="2!==currentViewIndex" class="table table-bordered table-fixed monthview-datetable">
                        <thead>
                        <tr class="text-center">
                            <th *ngFor="let dayHeader of views[2].dayHeaders">
                                <small>{{dayHeader}}</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr *ngFor="let row of [0,1,2,3,4,5]">
                            <td *ngFor="let col of [0,1,2,3,4,5,6]">
                                <ng-template [ngTemplateOutlet]="monthviewInactiveDisplayEventTemplate"
                                             [ngTemplateOutletContext]="{view: views[2], row: row, col: col}">
                                </ng-template>
                            </td>
                        <tr>
                        </tbody>
                    </table>
                </ng-template>
            </swiper>
            <ng-template [ngTemplateOutlet]="monthviewEventDetailTemplate"
                         [ngTemplateOutletContext]="{showEventDetail:showEventDetail, selectedDate: selectedDate, noEventsLabel: noEventsLabel}">
            </ng-template>
        </div>
    `, styles: [".text-muted{color:#999}.table-fixed{table-layout:fixed}.table{width:100%;max-width:100%;background-color:transparent}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:20px;vertical-align:top}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>thead:first-child>tr:first-child>th,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.monthview-primary-with-event{background-color:#3a87ad;color:#fff}.monthview-current{background-color:#f0f0f0}.monthview-selected{background-color:#090;color:#fff}.monthview-datetable td.monthview-disabled{color:#d3d3d3;cursor:default}.monthview-datetable th{text-align:center}.monthview-datetable td{cursor:pointer;text-align:center}.monthview-secondary-with-event{background-color:#d9edf7}::-webkit-scrollbar,*::-webkit-scrollbar{display:none}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CalendarService }, { type: i0.NgZone }]; }, propDecorators: { slider: [{
                type: ViewChild,
                args: ['swiper', { static: false }]
            }], monthviewDisplayEventTemplate: [{
                type: Input
            }], monthviewInactiveDisplayEventTemplate: [{
                type: Input
            }], monthviewEventDetailTemplate: [{
                type: Input
            }], formatDay: [{
                type: Input
            }], formatDayHeader: [{
                type: Input
            }], formatMonthTitle: [{
                type: Input
            }], eventSource: [{
                type: Input
            }], startingDayMonth: [{
                type: Input
            }], showEventDetail: [{
                type: Input
            }], noEventsLabel: [{
                type: Input
            }], autoSelect: [{
                type: Input
            }], markDisabled: [{
                type: Input
            }], locale: [{
                type: Input
            }], dateFormatter: [{
                type: Input
            }], dir: [{
                type: Input
            }], lockSwipeToPrev: [{
                type: Input
            }], lockSwipeToNext: [{
                type: Input
            }], lockSwipes: [{
                type: Input
            }], sliderOptions: [{
                type: Input
            }], onRangeChanged: [{
                type: Output
            }], onEventSelected: [{
                type: Output
            }], onTimeSelected: [{
                type: Output
            }], onTitleChanged: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9udGh2aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21vbnRodmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsU0FBUyxFQUdULEtBQUssRUFDTCxNQUFNLEVBQ04sWUFBWSxFQUtaLFNBQVMsRUFFWixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7O0FBZ096QyxNQUFNLE9BQU8sa0JBQWtCO0lBRTNCLFlBQW9CLGVBQWdDLEVBQVUsSUFBVztRQUFyRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFPO1FBZWhFLGVBQVUsR0FBRyxJQUFJLENBQUM7UUFJbEIsUUFBRyxHQUFHLEVBQUUsQ0FBQztRQU1SLG1CQUFjLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUM1QyxvQkFBZSxHQUFHLElBQUksWUFBWSxFQUFVLENBQUM7UUFDN0MsbUJBQWMsR0FBRyxJQUFJLFlBQVksRUFBaUIsQ0FBQztRQUNuRCxtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFVLENBQUM7UUFFL0MsVUFBSyxHQUFpQixFQUFFLENBQUM7UUFDekIscUJBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBR3JCLFNBQUksR0FBaUIsT0FBTyxDQUFDO1FBQzdCLGNBQVMsR0FBRyxDQUFDLENBQUM7UUFFYixtQkFBYyxHQUFHLEtBQUssQ0FBQztRQUN2QixXQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ2YsbUJBQWMsR0FBRyxJQUFJLENBQUM7SUF0QzlCLENBQUM7SUFpREQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFlLEVBQUUsQ0FBUztRQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFDdEIsT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLElBQUks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LE1BQU0sRUFBRSxLQUFLLEVBQUU7Z0JBRTdCLDZCQUE2QjtzQkFBckMsS0FBSztnQkFDRyxxQ0FBcUM7c0JBQTdDLEtBQUs7Z0JBQ0csNEJBQTRCO3NCQUFwQyxLQUFLO2dCQUVHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxNQUFNO3NCQUFkLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFFSSxjQUFjO3NCQUF2QixNQUFNO2dCQUNHLGVBQWU7c0JBQXhCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTTtnQkFDRyxjQUFjO3NCQUF2QixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBDb21wb25lbnQsXG4gICAgT25Jbml0LFxuICAgIE9uQ2hhbmdlcyxcbiAgICBJbnB1dCxcbiAgICBPdXRwdXQsXG4gICAgRXZlbnRFbWl0dGVyLFxuICAgIFNpbXBsZUNoYW5nZXMsXG4gICAgVGVtcGxhdGVSZWYsXG4gICAgT25EZXN0cm95LFxuICAgIEFmdGVyVmlld0luaXQsXG4gICAgVmlld0NoaWxkLFxuICAgIE5nWm9uZVxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7RGF0ZVBpcGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1N3aXBlckNvbXBvbmVudH0gZnJvbSAnc3dpcGVyL2FuZ3VsYXInO1xuXG5pbXBvcnQge0lDYWxlbmRhckNvbXBvbmVudCwgSUV2ZW50LCBJTW9udGhWaWV3LCBJTW9udGhWaWV3Um93LCBJVGltZVNlbGVjdGVkLCBJUmFuZ2UsIENhbGVuZGFyTW9kZSwgSURhdGVGb3JtYXR0ZXIsIElNb250aFZpZXdEaXNwbGF5RXZlbnRUZW1wbGF0ZUNvbnRleHR9IGZyb20gJy4vY2FsZW5kYXIuaW50ZXJmYWNlJztcbmltcG9ydCB7Q2FsZW5kYXJTZXJ2aWNlfSBmcm9tICcuL2NhbGVuZGFyLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ21vbnRodmlldycsXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxzd2lwZXIgI3N3aXBlciBbY29uZmlnXT1cInNsaWRlck9wdGlvbnNcIiBbZGlyXT1cImRpclwiIFthbGxvd1NsaWRlUHJldl09XCIhbG9ja1N3aXBlVG9QcmV2XCIgW2FsbG93U2xpZGVOZXh0XT1cIiFsb2NrU3dpcGVUb05leHRcIiBbYWxsb3dUb3VjaE1vdmVdPVwiIWxvY2tTd2lwZXNcIiAoc2xpZGVDaGFuZ2VUcmFuc2l0aW9uRW5kKT1cIm9uU2xpZGVDaGFuZ2VkKClcIj5cbiAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgc3dpcGVyU2xpZGU+XG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSAqbmdJZj1cIjA9PT1jdXJyZW50Vmlld0luZGV4XCIgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCBtb250aHZpZXctZGF0ZXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoICpuZ0Zvcj1cImxldCBkYXlIZWFkZXIgb2Ygdmlld3NbMF0uZGF5SGVhZGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c21hbGw+e3tkYXlIZWFkZXJ9fTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2YgWzAsMSwyLDMsNCw1XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgY29sIG9mIFswLDEsMiwzLDQsNSw2XVwiIHRhcHBhYmxlIChjbGljayk9XCJzZWxlY3Qodmlld3NbMF0uZGF0ZXNbcm93KjcrY29sXSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRIaWdobGlnaHRDbGFzcyh2aWV3c1swXS5kYXRlc1tyb3cqNytjb2xdKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwibW9udGh2aWV3RGlzcGxheUV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt2aWV3OiB2aWV3c1swXSwgcm93OiByb3csIGNvbDogY29sfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRhYmxlICpuZ0lmPVwiMCE9PWN1cnJlbnRWaWV3SW5kZXhcIiBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIG1vbnRodmlldy1kYXRldGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cInRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoICpuZ0Zvcj1cImxldCBkYXlIZWFkZXIgb2Ygdmlld3NbMF0uZGF5SGVhZGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c21hbGw+e3tkYXlIZWFkZXJ9fTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2YgWzAsMSwyLDMsNCw1XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgY29sIG9mIFswLDEsMiwzLDQsNSw2XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwibW9udGh2aWV3SW5hY3RpdmVEaXNwbGF5RXZlbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3ZpZXc6IHZpZXdzWzBdLCByb3c6IHJvdywgY29sOiBjb2x9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgc3dpcGVyU2xpZGU+XG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSAqbmdJZj1cIjE9PT1jdXJyZW50Vmlld0luZGV4XCIgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCBtb250aHZpZXctZGF0ZXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoICpuZ0Zvcj1cImxldCBkYXlIZWFkZXIgb2Ygdmlld3NbMV0uZGF5SGVhZGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c21hbGw+e3tkYXlIZWFkZXJ9fTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2YgWzAsMSwyLDMsNCw1XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgY29sIG9mIFswLDEsMiwzLDQsNSw2XVwiIHRhcHBhYmxlIChjbGljayk9XCJzZWxlY3Qodmlld3NbMV0uZGF0ZXNbcm93KjcrY29sXSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRIaWdobGlnaHRDbGFzcyh2aWV3c1sxXS5kYXRlc1tyb3cqNytjb2xdKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwibW9udGh2aWV3RGlzcGxheUV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt2aWV3OiB2aWV3c1sxXSwgcm93OiByb3csIGNvbDogY29sfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRhYmxlICpuZ0lmPVwiMSE9PWN1cnJlbnRWaWV3SW5kZXhcIiBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIG1vbnRodmlldy1kYXRldGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cInRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoICpuZ0Zvcj1cImxldCBkYXlIZWFkZXIgb2Ygdmlld3NbMV0uZGF5SGVhZGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c21hbGw+e3tkYXlIZWFkZXJ9fTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2YgWzAsMSwyLDMsNCw1XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgY29sIG9mIFswLDEsMiwzLDQsNSw2XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwibW9udGh2aWV3SW5hY3RpdmVEaXNwbGF5RXZlbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3ZpZXc6IHZpZXdzWzFdLCByb3c6IHJvdywgY29sOiBjb2x9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgc3dpcGVyU2xpZGU+XG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSAqbmdJZj1cIjI9PT1jdXJyZW50Vmlld0luZGV4XCIgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCBtb250aHZpZXctZGF0ZXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoICpuZ0Zvcj1cImxldCBkYXlIZWFkZXIgb2Ygdmlld3NbMl0uZGF5SGVhZGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c21hbGw+e3tkYXlIZWFkZXJ9fTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2YgWzAsMSwyLDMsNCw1XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgY29sIG9mIFswLDEsMiwzLDQsNSw2XVwiIHRhcHBhYmxlIChjbGljayk9XCJzZWxlY3Qodmlld3NbMl0uZGF0ZXNbcm93KjcrY29sXSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRIaWdobGlnaHRDbGFzcyh2aWV3c1syXS5kYXRlc1tyb3cqNytjb2xdKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwibW9udGh2aWV3RGlzcGxheUV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt2aWV3OiB2aWV3c1syXSwgcm93OiByb3csIGNvbDogY29sfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRhYmxlICpuZ0lmPVwiMiE9PWN1cnJlbnRWaWV3SW5kZXhcIiBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIG1vbnRodmlldy1kYXRldGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cInRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoICpuZ0Zvcj1cImxldCBkYXlIZWFkZXIgb2Ygdmlld3NbMl0uZGF5SGVhZGVyc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c21hbGw+e3tkYXlIZWFkZXJ9fTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2YgWzAsMSwyLDMsNCw1XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgY29sIG9mIFswLDEsMiwzLDQsNSw2XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwibW9udGh2aWV3SW5hY3RpdmVEaXNwbGF5RXZlbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3ZpZXc6IHZpZXdzWzJdLCByb3c6IHJvdywgY29sOiBjb2x9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgIDwvc3dpcGVyPlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIm1vbnRodmlld0V2ZW50RGV0YWlsVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7c2hvd0V2ZW50RGV0YWlsOnNob3dFdmVudERldGFpbCwgc2VsZWN0ZWREYXRlOiBzZWxlY3RlZERhdGUsIG5vRXZlbnRzTGFiZWw6IG5vRXZlbnRzTGFiZWx9XCI+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICBgLFxuICAgIHN0eWxlczogW2BcbiAgICAgICAgLnRleHQtbXV0ZWQge1xuICAgICAgICAgICAgY29sb3I6ICM5OTk7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtZml4ZWQge1xuICAgICAgICAgICAgdGFibGUtbGF5b3V0OiBmaXhlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZSB7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgIG1heC13aWR0aDogMTAwJTtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlID4gdGhlYWQgPiB0ciA+IHRoLCAudGFibGUgPiB0Ym9keSA+IHRyID4gdGgsIC50YWJsZSA+IHRmb290ID4gdHIgPiB0aCwgLnRhYmxlID4gdGhlYWQgPiB0ciA+IHRkLFxuICAgICAgICAudGFibGUgPiB0Ym9keSA+IHRyID4gdGQsIC50YWJsZSA+IHRmb290ID4gdHIgPiB0ZCB7XG4gICAgICAgICAgICBwYWRkaW5nOiA4cHg7XG4gICAgICAgICAgICBsaW5lLWhlaWdodDogMjBweDtcbiAgICAgICAgICAgIHZlcnRpY2FsLWFsaWduOiB0b3A7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0aGVhZCA+IHRyID4gdGgge1xuICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IGJvdHRvbTtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlID4gdGhlYWQ6Zmlyc3QtY2hpbGQgPiB0cjpmaXJzdC1jaGlsZCA+IHRoLCAudGFibGUgPiB0aGVhZDpmaXJzdC1jaGlsZCA+IHRyOmZpcnN0LWNoaWxkID4gdGQge1xuICAgICAgICAgICAgYm9yZGVyLXRvcDogMFxuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlID4gdGJvZHkgKyB0Ym9keSB7XG4gICAgICAgICAgICBib3JkZXItdG9wOiAycHggc29saWQgI2RkZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZS1ib3JkZXJlZCB7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlLWJvcmRlcmVkID4gdGhlYWQgPiB0ciA+IHRoLCAudGFibGUtYm9yZGVyZWQgPiB0Ym9keSA+IHRyID4gdGgsIC50YWJsZS1ib3JkZXJlZCA+IHRmb290ID4gdHIgPiB0aCxcbiAgICAgICAgLnRhYmxlLWJvcmRlcmVkID4gdGhlYWQgPiB0ciA+IHRkLCAudGFibGUtYm9yZGVyZWQgPiB0Ym9keSA+IHRyID4gdGQsIC50YWJsZS1ib3JkZXJlZCA+IHRmb290ID4gdHIgPiB0ZCB7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlLWJvcmRlcmVkID4gdGhlYWQgPiB0ciA+IHRoLCAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGQge1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbS13aWR0aDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlLXN0cmlwZWQgPiB0Ym9keSA+IHRyOm50aC1jaGlsZChvZGQpID4gdGQsIC50YWJsZS1zdHJpcGVkID4gdGJvZHkgPiB0cjpudGgtY2hpbGQob2RkKSA+IHRoIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmOWY5ZjlcbiAgICAgICAgfVxuXG4gICAgICAgIC5tb250aHZpZXctcHJpbWFyeS13aXRoLWV2ZW50IHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzYTg3YWQ7XG4gICAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgIH1cblxuICAgICAgICAubW9udGh2aWV3LWN1cnJlbnQge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YwZjBmMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5tb250aHZpZXctc2VsZWN0ZWQge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwOTkwMDtcbiAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5tb250aHZpZXctZGF0ZXRhYmxlIHRkLm1vbnRodmlldy1kaXNhYmxlZCB7XG4gICAgICAgICAgICBjb2xvcjogbGlnaHRncmV5O1xuICAgICAgICAgICAgY3Vyc29yOiBkZWZhdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLm1vbnRodmlldy1kYXRldGFibGUgdGgge1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLm1vbnRodmlldy1kYXRldGFibGUgdGQge1xuICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLm1vbnRodmlldy1zZWNvbmRhcnktd2l0aC1ldmVudCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDllZGY3O1xuICAgICAgICB9XG5cbiAgICAgICAgOjotd2Via2l0LXNjcm9sbGJhcixcbiAgICAgICAgKjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICAgICAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICAgICAgfVxuICAgIGBdXG59KVxuZXhwb3J0IGNsYXNzIE1vbnRoVmlld0NvbXBvbmVudCBpbXBsZW1lbnRzIElDYWxlbmRhckNvbXBvbmVudCwgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgQWZ0ZXJWaWV3SW5pdCB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbGVuZGFyU2VydmljZTogQ2FsZW5kYXJTZXJ2aWNlLCBwcml2YXRlIHpvbmU6Tmdab25lKSB7XG4gICAgfSAgXG4gICAgQFZpZXdDaGlsZCgnc3dpcGVyJywgeyBzdGF0aWM6IGZhbHNlIH0pIHNsaWRlciE6IFN3aXBlckNvbXBvbmVudDtcblxuICAgIEBJbnB1dCgpIG1vbnRodmlld0Rpc3BsYXlFdmVudFRlbXBsYXRlITogVGVtcGxhdGVSZWY8SU1vbnRoVmlld0Rpc3BsYXlFdmVudFRlbXBsYXRlQ29udGV4dD47XG4gICAgQElucHV0KCkgbW9udGh2aWV3SW5hY3RpdmVEaXNwbGF5RXZlbnRUZW1wbGF0ZSE6IFRlbXBsYXRlUmVmPElNb250aFZpZXdEaXNwbGF5RXZlbnRUZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIG1vbnRodmlld0V2ZW50RGV0YWlsVGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJTW9udGhWaWV3RGlzcGxheUV2ZW50VGVtcGxhdGVDb250ZXh0PjtcblxuICAgIEBJbnB1dCgpIGZvcm1hdERheT86IHN0cmluZztcbiAgICBASW5wdXQoKSBmb3JtYXREYXlIZWFkZXI/OiBzdHJpbmc7XG4gICAgQElucHV0KCkgZm9ybWF0TW9udGhUaXRsZT86IHN0cmluZztcbiAgICBASW5wdXQoKSBldmVudFNvdXJjZSE6IElFdmVudFtdO1xuICAgIEBJbnB1dCgpIHN0YXJ0aW5nRGF5TW9udGghOiBudW1iZXI7XG4gICAgQElucHV0KCkgc2hvd0V2ZW50RGV0YWlsPzogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBub0V2ZW50c0xhYmVsPzogc3RyaW5nO1xuICAgIEBJbnB1dCgpIGF1dG9TZWxlY3QgPSB0cnVlO1xuICAgIEBJbnB1dCgpIG1hcmtEaXNhYmxlZD86IChkYXRlOiBEYXRlKSA9PiBib29sZWFuO1xuICAgIEBJbnB1dCgpIGxvY2FsZSE6IHN0cmluZztcbiAgICBASW5wdXQoKSBkYXRlRm9ybWF0dGVyPzogSURhdGVGb3JtYXR0ZXI7XG4gICAgQElucHV0KCkgZGlyID0gJyc7XG4gICAgQElucHV0KCkgbG9ja1N3aXBlVG9QcmV2PzogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBsb2NrU3dpcGVUb05leHQ/OiBib29sZWFuO1xuICAgIEBJbnB1dCgpIGxvY2tTd2lwZXM/OiBib29sZWFuO1xuICAgIEBJbnB1dCgpIHNsaWRlck9wdGlvbnM6IGFueTtcblxuICAgIEBPdXRwdXQoKSBvblJhbmdlQ2hhbmdlZCA9IG5ldyBFdmVudEVtaXR0ZXI8SVJhbmdlPigpO1xuICAgIEBPdXRwdXQoKSBvbkV2ZW50U2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPElFdmVudD4oKTtcbiAgICBAT3V0cHV0KCkgb25UaW1lU2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPElUaW1lU2VsZWN0ZWQ+KCk7XG4gICAgQE91dHB1dCgpIG9uVGl0bGVDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxzdHJpbmc+KCk7XG5cbiAgICBwdWJsaWMgdmlld3M6IElNb250aFZpZXdbXSA9IFtdO1xuICAgIHB1YmxpYyBjdXJyZW50Vmlld0luZGV4ID0gMDtcbiAgICBwdWJsaWMgc2VsZWN0ZWREYXRlPzogSU1vbnRoVmlld1JvdztcbiAgICBwdWJsaWMgcmFuZ2UhOiBJUmFuZ2U7XG4gICAgcHVibGljIG1vZGU6IENhbGVuZGFyTW9kZSA9ICdtb250aCc7XG4gICAgcHVibGljIGRpcmVjdGlvbiA9IDA7XG5cbiAgICBwcml2YXRlIG1vdmVPblNlbGVjdGVkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBpbml0ZWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGNhbGxiYWNrT25Jbml0ID0gdHJ1ZTtcblxuICAgIHByaXZhdGUgY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIGV2ZW50U291cmNlQ2hhbmdlZFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIHNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIHNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcblxuICAgIHByaXZhdGUgZm9ybWF0RGF5TGFiZWwhOiAoZGF0ZTogRGF0ZSkgPT4gc3RyaW5nO1xuICAgIHByaXZhdGUgZm9ybWF0RGF5SGVhZGVyTGFiZWwhOiAoZGF0ZTogRGF0ZSkgPT4gc3RyaW5nO1xuICAgIHByaXZhdGUgZm9ybWF0VGl0bGUhOiAoZGF0ZTogRGF0ZSkgPT4gc3RyaW5nO1xuXG4gICAgc3RhdGljIGdldERhdGVzKHN0YXJ0RGF0ZTogRGF0ZSwgbjogbnVtYmVyKTogRGF0ZVtdIHtcbiAgICAgICAgY29uc3QgZGF0ZXMgPSBuZXcgQXJyYXkobiksXG4gICAgICAgICAgICBjdXJyZW50ID0gbmV3IERhdGUoc3RhcnREYXRlLmdldFRpbWUoKSk7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBuKSB7XG4gICAgICAgICAgICBkYXRlc1tpKytdID0gbmV3IERhdGUoY3VycmVudC5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGVzO1xuICAgIH1cblxuICAgIG5nT25Jbml0KCkge1xuICAgICAgICBpZiAoIXRoaXMuc2xpZGVyT3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXJPcHRpb25zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zbGlkZXJPcHRpb25zLmxvb3AgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0aGlzLmRhdGVGb3JtYXR0ZXIgJiYgdGhpcy5kYXRlRm9ybWF0dGVyLmZvcm1hdE1vbnRoVmlld0RheSkge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXREYXlMYWJlbCA9IHRoaXMuZGF0ZUZvcm1hdHRlci5mb3JtYXRNb250aFZpZXdEYXk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkYXlMYWJlbERhdGVQaXBlID0gbmV3IERhdGVQaXBlKCdlbi1VUycpO1xuICAgICAgICAgICAgdGhpcy5mb3JtYXREYXlMYWJlbCA9IGZ1bmN0aW9uKGRhdGU6IERhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF5TGFiZWxEYXRlUGlwZS50cmFuc2Zvcm0oZGF0ZSwgdGhpcy5mb3JtYXREYXkpfHwnJztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kYXRlRm9ybWF0dGVyICYmIHRoaXMuZGF0ZUZvcm1hdHRlci5mb3JtYXRNb250aFZpZXdEYXlIZWFkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0RGF5SGVhZGVyTGFiZWwgPSB0aGlzLmRhdGVGb3JtYXR0ZXIuZm9ybWF0TW9udGhWaWV3RGF5SGVhZGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGF0ZVBpcGUgPSBuZXcgRGF0ZVBpcGUodGhpcy5sb2NhbGUpO1xuICAgICAgICAgICAgdGhpcy5mb3JtYXREYXlIZWFkZXJMYWJlbCA9IGZ1bmN0aW9uKGRhdGU6IERhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZVBpcGUudHJhbnNmb3JtKGRhdGUsIHRoaXMuZm9ybWF0RGF5SGVhZGVyKXx8Jyc7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGF0ZUZvcm1hdHRlciAmJiB0aGlzLmRhdGVGb3JtYXR0ZXIuZm9ybWF0TW9udGhWaWV3VGl0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0VGl0bGUgPSB0aGlzLmRhdGVGb3JtYXR0ZXIuZm9ybWF0TW9udGhWaWV3VGl0bGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkYXRlUGlwZSA9IG5ldyBEYXRlUGlwZSh0aGlzLmxvY2FsZSk7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdFRpdGxlID0gZnVuY3Rpb24oZGF0ZTogRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlUGlwZS50cmFuc2Zvcm0oZGF0ZSwgdGhpcy5mb3JtYXRNb250aFRpdGxlKXx8Jyc7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoVmlldygpO1xuICAgICAgICB0aGlzLmluaXRlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tUGFyZW50U3Vic2NyaXB0aW9uID0gdGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudCQuc3Vic2NyaWJlKGN1cnJlbnREYXRlID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5ldmVudFNvdXJjZUNoYW5nZWRTdWJzY3JpcHRpb24gPSB0aGlzLmNhbGVuZGFyU2VydmljZS5ldmVudFNvdXJjZUNoYW5nZWQkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uRGF0YUxvYWRlZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNsaWRlQ2hhbmdlZCQuc3Vic2NyaWJlKGRpcmVjdGlvbiA9PiB7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnNsaWRlTmV4dCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnNsaWRlUHJldigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNsaWRlVXBkYXRlZCQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi51cGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnREYXRlQ2hhbmdlZEZyb21QYXJlbnRTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tUGFyZW50U3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZXZlbnRTb3VyY2VDaGFuZ2VkU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50U291cmNlQ2hhbmdlZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5ldmVudFNvdXJjZUNoYW5nZWRTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zbGlkZUNoYW5nZWRTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVDaGFuZ2VkU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLnNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zbGlkZVVwZGF0ZWRTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVVcGRhdGVkU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBpZiAoIXRoaXMuaW5pdGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBldmVudFNvdXJjZUNoYW5nZSA9IGNoYW5nZXNbJ2V2ZW50U291cmNlJ107XG4gICAgICAgIGlmIChldmVudFNvdXJjZUNoYW5nZSAmJiBldmVudFNvdXJjZUNoYW5nZS5jdXJyZW50VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMub25EYXRhTG9hZGVkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NrU3dpcGVUb1ByZXYgPSBjaGFuZ2VzWydsb2NrU3dpcGVUb1ByZXYnXTtcbiAgICAgICAgaWYgKGxvY2tTd2lwZVRvUHJldikge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFsbG93U2xpZGVQcmV2ID0gIWxvY2tTd2lwZVRvUHJldi5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NrU3dpcGVUb05leHQgPSBjaGFuZ2VzWydsb2NrU3dpcGVUb05leHQnXTtcbiAgICAgICAgaWYgKGxvY2tTd2lwZVRvTmV4dCkge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFsbG93U2xpZGVOZXh0ID0gIWxvY2tTd2lwZVRvTmV4dC5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NrU3dpcGVzID0gY2hhbmdlc1snbG9ja1N3aXBlcyddO1xuICAgICAgICBpZiAobG9ja1N3aXBlcykge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFsbG93VG91Y2hNb3ZlID0gIWxvY2tTd2lwZXMuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgICAgICBjb25zdCB0aXRsZSA9IHRoaXMuZ2V0VGl0bGUoKTtcbiAgICAgICAgdGhpcy5vblRpdGxlQ2hhbmdlZC5lbWl0KHRpdGxlKTtcbiAgICB9XG5cbiAgICBzZXRTd2lwZXJJbnN0YW5jZShzd2lwZXI6IGFueSkge1xuICAgICAgICB0aGlzLnNsaWRlciA9IHN3aXBlcjtcbiAgICB9XG5cbiAgICBvblNsaWRlQ2hhbmdlZCgpIHtcbiAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsYmFja09uSW5pdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tPbkluaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBkaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFZpZXdJbmRleCA9IHRoaXMuY3VycmVudFZpZXdJbmRleDtcblxuICAgICAgICAgICAgbGV0IGN1cnJlbnRTbGlkZUluZGV4ID0gdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFjdGl2ZUluZGV4O1xuICAgICAgICAgICAgY3VycmVudFNsaWRlSW5kZXggPSAoY3VycmVudFNsaWRlSW5kZXggKyAyKSAlIDM7XG4gICAgICAgICAgICBpZihpc05hTihjdXJyZW50U2xpZGVJbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50U2xpZGVJbmRleCA9IGN1cnJlbnRWaWV3SW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCAtIGN1cnJlbnRWaWV3SW5kZXggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50U2xpZGVJbmRleCA9PT0gMCAmJiBjdXJyZW50Vmlld0luZGV4ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgICAgICB0aGlzLnNsaWRlci5zd2lwZXJSZWYuc2xpZGVUbygxLCAwLCBmYWxzZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRWaWV3SW5kZXggLSBjdXJyZW50U2xpZGVJbmRleCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IC0xO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50U2xpZGVJbmRleCA9PT0gMiAmJiBjdXJyZW50Vmlld0luZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gLTE7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnNsaWRlVG8oMywgMCwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Vmlld0luZGV4ID0gY3VycmVudFNsaWRlSW5kZXg7XG4gICAgICAgICAgICB0aGlzLm1vdmUoZGlyZWN0aW9uKTsgICBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbW92ZShkaXJlY3Rpb246IG51bWJlcikge1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKCF0aGlzLm1vdmVPblNlbGVjdGVkKSB7XG4gICAgICAgICAgICBjb25zdCBhZGphY2VudERhdGUgPSB0aGlzLmNhbGVuZGFyU2VydmljZS5nZXRBZGphY2VudENhbGVuZGFyRGF0ZSh0aGlzLm1vZGUsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICB0aGlzLmNhbGVuZGFyU2VydmljZS5zZXRDdXJyZW50RGF0ZShhZGphY2VudERhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSAwO1xuICAgICAgICB0aGlzLm1vdmVPblNlbGVjdGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY3JlYXRlRGF0ZU9iamVjdChkYXRlOiBEYXRlKTogSU1vbnRoVmlld1JvdyB7XG4gICAgICAgIGxldCBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5tYXJrRGlzYWJsZWQpIHtcbiAgICAgICAgICAgIGRpc2FibGVkID0gdGhpcy5tYXJrRGlzYWJsZWQoZGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0ZSxcbiAgICAgICAgICAgIGV2ZW50czogW10sXG4gICAgICAgICAgICBsYWJlbDogdGhpcy5mb3JtYXREYXlMYWJlbChkYXRlKSxcbiAgICAgICAgICAgIHNlY29uZGFyeTogZmFsc2UsXG4gICAgICAgICAgICBkaXNhYmxlZFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGdldFZpZXdEYXRhKHN0YXJ0VGltZTogRGF0ZSk6IElNb250aFZpZXcge1xuICAgICAgICBjb25zdCBzdGFydERhdGUgPSBzdGFydFRpbWUsXG4gICAgICAgICAgICBkYXRlID0gc3RhcnREYXRlLmdldERhdGUoKSxcbiAgICAgICAgICAgIG1vbnRoID0gKHN0YXJ0RGF0ZS5nZXRNb250aCgpICsgKGRhdGUgIT09IDEgPyAxIDogMCkpICUgMTI7XG5cbiAgICAgICAgY29uc3QgZGF0ZXMgPSBNb250aFZpZXdDb21wb25lbnQuZ2V0RGF0ZXMoc3RhcnREYXRlLCA0Mik7XG4gICAgICAgIGNvbnN0IGRheXM6IElNb250aFZpZXdSb3dbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQyOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGVPYmplY3QgPSB0aGlzLmNyZWF0ZURhdGVPYmplY3QoZGF0ZXNbaV0pO1xuICAgICAgICAgICAgZGF0ZU9iamVjdC5zZWNvbmRhcnkgPSBkYXRlc1tpXS5nZXRNb250aCgpICE9PSBtb250aDtcbiAgICAgICAgICAgIGRheXNbaV0gPSBkYXRlT2JqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF5SGVhZGVyczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgICAgIGRheUhlYWRlcnMucHVzaCh0aGlzLmZvcm1hdERheUhlYWRlckxhYmVsKGRheXNbaV0uZGF0ZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRlczogZGF5cyxcbiAgICAgICAgICAgIGRheUhlYWRlcnNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXRIaWdobGlnaHRDbGFzcyhkYXRlOiBJTW9udGhWaWV3Um93KTogc3RyaW5nIHtcbiAgICAgICAgbGV0IGNsYXNzTmFtZSA9ICcnO1xuXG4gICAgICAgIGlmIChkYXRlLmhhc0V2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZGF0ZS5zZWNvbmRhcnkpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSAnbW9udGh2aWV3LXNlY29uZGFyeS13aXRoLWV2ZW50JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ21vbnRodmlldy1wcmltYXJ5LXdpdGgtZXZlbnQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGUuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgKz0gJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xhc3NOYW1lICs9ICdtb250aHZpZXctc2VsZWN0ZWQnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGUuY3VycmVudCkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSAnICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGFzc05hbWUgKz0gJ21vbnRodmlldy1jdXJyZW50JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRlLnNlY29uZGFyeSkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSAnICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGFzc05hbWUgKz0gJ3RleHQtbXV0ZWQnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGUuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgKz0gJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xhc3NOYW1lICs9ICdtb250aHZpZXctZGlzYWJsZWQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgZ2V0UmFuZ2UoY3VycmVudERhdGU6IERhdGUpOiBJUmFuZ2Uge1xuICAgICAgICBjb25zdCB5ZWFyID0gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICAgICAgIG1vbnRoID0gY3VycmVudERhdGUuZ2V0TW9udGgoKSxcbiAgICAgICAgICAgIGZpcnN0RGF5T2ZNb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAxLCAxMiwgMCwgMCksIC8vIHNldCBob3VyIHRvIDEyIHRvIGF2b2lkIERTVCBwcm9ibGVtXG5cbiAgICAgICAgICAgIGRpZmZlcmVuY2UgPSB0aGlzLnN0YXJ0aW5nRGF5TW9udGggLSBmaXJzdERheU9mTW9udGguZ2V0RGF5KCksXG4gICAgICAgICAgICBudW1EaXNwbGF5ZWRGcm9tUHJldmlvdXNNb250aCA9IChkaWZmZXJlbmNlID4gMCkgPyA3IC0gZGlmZmVyZW5jZSA6IC1kaWZmZXJlbmNlLFxuICAgICAgICAgICAgc3RhcnREYXRlID0gbmV3IERhdGUoZmlyc3REYXlPZk1vbnRoLmdldFRpbWUoKSk7XG5cbiAgICAgICAgaWYgKG51bURpc3BsYXllZEZyb21QcmV2aW91c01vbnRoID4gMCkge1xuICAgICAgICAgICAgc3RhcnREYXRlLnNldERhdGUoLW51bURpc3BsYXllZEZyb21QcmV2aW91c01vbnRoICsgMSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbmREYXRlID0gbmV3IERhdGUoc3RhcnREYXRlLmdldFRpbWUoKSk7XG4gICAgICAgIGVuZERhdGUuc2V0RGF0ZShlbmREYXRlLmdldERhdGUoKSArIDQyKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhcnRUaW1lOiBzdGFydERhdGUsXG4gICAgICAgICAgICBlbmRUaW1lOiBlbmREYXRlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25EYXRhTG9hZGVkKCkge1xuICAgICAgICBjb25zdCByYW5nZSA9IHRoaXMucmFuZ2UsXG4gICAgICAgICAgICBldmVudFNvdXJjZSA9IHRoaXMuZXZlbnRTb3VyY2UsXG4gICAgICAgICAgICBsZW4gPSBldmVudFNvdXJjZSA/IGV2ZW50U291cmNlLmxlbmd0aCA6IDAsXG4gICAgICAgICAgICBzdGFydFRpbWUgPSByYW5nZS5zdGFydFRpbWUsXG4gICAgICAgICAgICBlbmRUaW1lID0gcmFuZ2UuZW5kVGltZSxcbiAgICAgICAgICAgIHV0Y1N0YXJ0VGltZSA9IERhdGUuVVRDKHN0YXJ0VGltZS5nZXRGdWxsWWVhcigpLCBzdGFydFRpbWUuZ2V0TW9udGgoKSwgc3RhcnRUaW1lLmdldERhdGUoKSksXG4gICAgICAgICAgICB1dGNFbmRUaW1lID0gRGF0ZS5VVEMoZW5kVGltZS5nZXRGdWxsWWVhcigpLCBlbmRUaW1lLmdldE1vbnRoKCksIGVuZFRpbWUuZ2V0RGF0ZSgpKSxcbiAgICAgICAgICAgIGN1cnJlbnRWaWV3SW5kZXggPSB0aGlzLmN1cnJlbnRWaWV3SW5kZXgsXG4gICAgICAgICAgICBkYXRlcyA9IHRoaXMudmlld3NbY3VycmVudFZpZXdJbmRleF0uZGF0ZXMsXG4gICAgICAgICAgICBvbmVEYXkgPSA4NjQwMDAwMCxcbiAgICAgICAgICAgIGVwcyA9IDAuMDAwNjtcblxuICAgICAgICBmb3IgKGxldCByID0gMDsgciA8IDQyOyByICs9IDEpIHtcbiAgICAgICAgICAgIGlmIChkYXRlc1tyXS5oYXNFdmVudCkge1xuICAgICAgICAgICAgICAgIGRhdGVzW3JdLmhhc0V2ZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZGF0ZXNbcl0uZXZlbnRzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGV2ZW50U291cmNlW2ldLFxuICAgICAgICAgICAgICAgIGV2ZW50U3RhcnRUaW1lID0gZXZlbnQuc3RhcnRUaW1lLFxuICAgICAgICAgICAgICAgIGV2ZW50RW5kVGltZSA9IGV2ZW50LmVuZFRpbWU7XG5cbiAgICAgICAgICAgIGxldCBldmVudFVUQ1N0YXJ0VGltZTogbnVtYmVyLFxuICAgICAgICAgICAgICAgIGV2ZW50VVRDRW5kVGltZTogbnVtYmVyO1xuICAgICAgICAgICAgaWYgKGV2ZW50LmFsbERheSkge1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDU3RhcnRUaW1lID0gZXZlbnRTdGFydFRpbWUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDRW5kVGltZSA9IGV2ZW50RW5kVGltZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDU3RhcnRUaW1lID0gRGF0ZS5VVEMoZXZlbnRTdGFydFRpbWUuZ2V0RnVsbFllYXIoKSwgZXZlbnRTdGFydFRpbWUuZ2V0TW9udGgoKSwgZXZlbnRTdGFydFRpbWUuZ2V0RGF0ZSgpKTtcbiAgICAgICAgICAgICAgICBldmVudFVUQ0VuZFRpbWUgPSBEYXRlLlVUQyhldmVudEVuZFRpbWUuZ2V0RnVsbFllYXIoKSwgZXZlbnRFbmRUaW1lLmdldE1vbnRoKCksIGV2ZW50RW5kVGltZS5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50VVRDRW5kVGltZSA8PSB1dGNTdGFydFRpbWUgfHwgZXZlbnRVVENTdGFydFRpbWUgPj0gdXRjRW5kVGltZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdGltZURpZmZlcmVuY2VTdGFydDogbnVtYmVyLFxuICAgICAgICAgICAgICAgIHRpbWVEaWZmZXJlbmNlRW5kOiBudW1iZXI7XG5cbiAgICAgICAgICAgIGlmIChldmVudFVUQ1N0YXJ0VGltZSA8IHV0Y1N0YXJ0VGltZSkge1xuICAgICAgICAgICAgICAgIHRpbWVEaWZmZXJlbmNlU3RhcnQgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aW1lRGlmZmVyZW5jZVN0YXJ0ID0gKGV2ZW50VVRDU3RhcnRUaW1lIC0gdXRjU3RhcnRUaW1lKSAvIG9uZURheTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50VVRDRW5kVGltZSA+IHV0Y0VuZFRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aW1lRGlmZmVyZW5jZUVuZCA9ICh1dGNFbmRUaW1lIC0gdXRjU3RhcnRUaW1lKSAvIG9uZURheTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VFbmQgPSAoZXZlbnRVVENFbmRUaW1lIC0gdXRjU3RhcnRUaW1lKSAvIG9uZURheTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGluZGV4ID0gTWF0aC5mbG9vcih0aW1lRGlmZmVyZW5jZVN0YXJ0KTtcbiAgICAgICAgICAgIGNvbnN0IGVuZEluZGV4ID0gTWF0aC5jZWlsKHRpbWVEaWZmZXJlbmNlRW5kIC0gZXBzKTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGVuZEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZGF0ZXNbaW5kZXhdLmhhc0V2ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBsZXQgZXZlbnRTZXQgPSBkYXRlc1tpbmRleF0uZXZlbnRzO1xuICAgICAgICAgICAgICAgIGlmIChldmVudFNldCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudFNldC5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBldmVudFNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBldmVudFNldC5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZXNbaW5kZXhdLmV2ZW50cyA9IGV2ZW50U2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCA0MjsgciArPSAxKSB7XG4gICAgICAgICAgICBpZiAoZGF0ZXNbcl0uaGFzRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBkYXRlc1tyXS5ldmVudHMuc29ydCh0aGlzLmNvbXBhcmVFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5hdXRvU2VsZWN0KSB7XG4gICAgICAgICAgICBsZXQgZmluZFNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCByID0gMDsgciA8IDQyOyByICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZXNbcl0uc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERhdGUgPSBkYXRlc1tyXTtcbiAgICAgICAgICAgICAgICAgICAgZmluZFNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZmluZFNlbGVjdGVkICYmIHRoaXMuc2VsZWN0ZWREYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vblRpbWVTZWxlY3RlZC5lbWl0KHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRUaW1lOiB0aGlzLnNlbGVjdGVkRGF0ZS5kYXRlLFxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHRoaXMuc2VsZWN0ZWREYXRlLmV2ZW50cyxcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRoaXMuc2VsZWN0ZWREYXRlLmRpc2FibGVkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZWZyZXNoVmlldygpIHtcbiAgICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuZ2V0UmFuZ2UodGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGUpO1xuXG4gICAgICAgIGlmICh0aGlzLmluaXRlZCkge1xuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSB0aGlzLmdldFRpdGxlKCk7XG4gICAgICAgICAgICB0aGlzLm9uVGl0bGVDaGFuZ2VkLmVtaXQodGl0bGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnBvcHVsYXRlQWRqYWNlbnRWaWV3cyh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50Vmlldyh0aGlzLnJhbmdlLnN0YXJ0VGltZSwgdGhpcy52aWV3c1t0aGlzLmN1cnJlbnRWaWV3SW5kZXhdKTtcbiAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2UucmFuZ2VDaGFuZ2VkKHRoaXMpO1xuICAgIH1cblxuICAgIGdldFRpdGxlKCk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRWaWV3U3RhcnREYXRlID0gdGhpcy5yYW5nZS5zdGFydFRpbWUsXG4gICAgICAgICAgICBkYXRlID0gY3VycmVudFZpZXdTdGFydERhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgbW9udGggPSAoY3VycmVudFZpZXdTdGFydERhdGUuZ2V0TW9udGgoKSArIChkYXRlICE9PSAxID8gMSA6IDApKSAlIDEyLFxuICAgICAgICAgICAgeWVhciA9IGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldEZ1bGxZZWFyKCkgKyAoZGF0ZSAhPT0gMSAmJiBtb250aCA9PT0gMCA/IDEgOiAwKSxcbiAgICAgICAgICAgIGhlYWRlckRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSwgMTIsIDAsIDAsIDApO1xuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXRUaXRsZShoZWFkZXJEYXRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbXBhcmVFdmVudChldmVudDE6IElFdmVudCwgZXZlbnQyOiBJRXZlbnQpOiBudW1iZXIge1xuICAgICAgICBpZiAoZXZlbnQxLmFsbERheSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQyLmFsbERheSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIChldmVudDEuc3RhcnRUaW1lLmdldFRpbWUoKSAtIGV2ZW50Mi5zdGFydFRpbWUuZ2V0VGltZSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdCh2aWV3RGF0ZTogSU1vbnRoVmlld1Jvdykge1xuICAgICAgICBpZiAoIXRoaXMudmlld3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkRGF0ZSA9IHZpZXdEYXRlLmRhdGUsXG4gICAgICAgICAgICBldmVudHMgPSB2aWV3RGF0ZS5ldmVudHM7XG5cbiAgICAgICAgaWYgKCF2aWV3RGF0ZS5kaXNhYmxlZCkge1xuICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLnZpZXdzW3RoaXMuY3VycmVudFZpZXdJbmRleF0uZGF0ZXMsXG4gICAgICAgICAgICAgICAgY3VycmVudENhbGVuZGFyRGF0ZSA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLmN1cnJlbnREYXRlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRNb250aCA9IGN1cnJlbnRDYWxlbmRhckRhdGUuZ2V0TW9udGgoKSxcbiAgICAgICAgICAgICAgICBjdXJyZW50WWVhciA9IGN1cnJlbnRDYWxlbmRhckRhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICBzZWxlY3RlZE1vbnRoID0gc2VsZWN0ZWREYXRlLmdldE1vbnRoKCksXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRZZWFyID0gc2VsZWN0ZWREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgICBsZXQgZGlyZWN0aW9uID0gMDtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSBzZWxlY3RlZFllYXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE1vbnRoICE9PSBzZWxlY3RlZE1vbnRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGN1cnJlbnRNb250aCA8IHNlbGVjdGVkTW9udGggPyAxIDogLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBjdXJyZW50WWVhciA8IHNlbGVjdGVkWWVhciA/IDEgOiAtMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2Uuc2V0Q3VycmVudERhdGUoc2VsZWN0ZWREYXRlKTtcbiAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Vmlld1N0YXJ0RGF0ZSA9IHRoaXMucmFuZ2Uuc3RhcnRUaW1lLFxuICAgICAgICAgICAgICAgICAgICBvbmVEYXkgPSA4NjQwMDAwMCxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWREYXlEaWZmZXJlbmNlID0gTWF0aC5yb3VuZCgoRGF0ZS5VVEMoc2VsZWN0ZWREYXRlLmdldEZ1bGxZZWFyKCksIHNlbGVjdGVkRGF0ZS5nZXRNb250aCgpLCBzZWxlY3RlZERhdGUuZ2V0RGF0ZSgpKSAtIERhdGUuVVRDKGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldE1vbnRoKCksIGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldERhdGUoKSkpIC8gb25lRGF5KTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgNDI7IHIgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRlc1tyXS5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZERheURpZmZlcmVuY2UgPj0gMCAmJiBzZWxlY3RlZERheURpZmZlcmVuY2UgPCA0Mikge1xuICAgICAgICAgICAgICAgICAgICBkYXRlc1tzZWxlY3RlZERheURpZmZlcmVuY2VdLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERhdGUgPSBkYXRlc1tzZWxlY3RlZERheURpZmZlcmVuY2VdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlT25TZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZVZpZXcoZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub25UaW1lU2VsZWN0ZWQuZW1pdCh7c2VsZWN0ZWRUaW1lOiBzZWxlY3RlZERhdGUsIGV2ZW50cywgZGlzYWJsZWQ6IHZpZXdEYXRlLmRpc2FibGVkfSk7XG4gICAgfVxuXG4gICAgc2xpZGVWaWV3KGRpcmVjdGlvbjogbnVtYmVyKSB7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi5zbGlkZU5leHQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnNsaWRlci5zd2lwZXJSZWYuc2xpZGVQcmV2KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDdXJyZW50VmlldyhjdXJyZW50Vmlld1N0YXJ0RGF0ZTogRGF0ZSwgdmlldzogSU1vbnRoVmlldykge1xuICAgICAgICBjb25zdCBjdXJyZW50Q2FsZW5kYXJEYXRlID0gdGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGUsXG4gICAgICAgICAgICB0b2RheSA9IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBvbmVEYXkgPSA4NjQwMDAwMCxcbiAgICAgICAgICAgIHNlbGVjdGVkRGF5RGlmZmVyZW5jZSA9IE1hdGgucm91bmQoKERhdGUuVVRDKGN1cnJlbnRDYWxlbmRhckRhdGUuZ2V0RnVsbFllYXIoKSwgY3VycmVudENhbGVuZGFyRGF0ZS5nZXRNb250aCgpLCBjdXJyZW50Q2FsZW5kYXJEYXRlLmdldERhdGUoKSkgLSBEYXRlLlVUQyhjdXJyZW50Vmlld1N0YXJ0RGF0ZS5nZXRGdWxsWWVhcigpLCBjdXJyZW50Vmlld1N0YXJ0RGF0ZS5nZXRNb250aCgpLCBjdXJyZW50Vmlld1N0YXJ0RGF0ZS5nZXREYXRlKCkpKSAvIG9uZURheSksXG4gICAgICAgICAgICBjdXJyZW50RGF5RGlmZmVyZW5jZSA9IE1hdGgucm91bmQoKERhdGUuVVRDKHRvZGF5LmdldEZ1bGxZZWFyKCksIHRvZGF5LmdldE1vbnRoKCksIHRvZGF5LmdldERhdGUoKSkgLSBEYXRlLlVUQyhjdXJyZW50Vmlld1N0YXJ0RGF0ZS5nZXRGdWxsWWVhcigpLCBjdXJyZW50Vmlld1N0YXJ0RGF0ZS5nZXRNb250aCgpLCBjdXJyZW50Vmlld1N0YXJ0RGF0ZS5nZXREYXRlKCkpKSAvIG9uZURheSk7XG5cbiAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCA0MjsgciArPSAxKSB7XG4gICAgICAgICAgICB2aWV3LmRhdGVzW3JdLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZWN0ZWREYXlEaWZmZXJlbmNlID49IDAgJiYgc2VsZWN0ZWREYXlEaWZmZXJlbmNlIDwgNDIgJiYgIXZpZXcuZGF0ZXNbc2VsZWN0ZWREYXlEaWZmZXJlbmNlXS5kaXNhYmxlZCAmJiAodGhpcy5hdXRvU2VsZWN0IHx8IHRoaXMubW92ZU9uU2VsZWN0ZWQpKSB7XG4gICAgICAgICAgICB2aWV3LmRhdGVzW3NlbGVjdGVkRGF5RGlmZmVyZW5jZV0uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERhdGUgPSB2aWV3LmRhdGVzW3NlbGVjdGVkRGF5RGlmZmVyZW5jZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjdXJyZW50RGF5RGlmZmVyZW5jZSA+PSAwICYmIGN1cnJlbnREYXlEaWZmZXJlbmNlIDwgNDIpIHtcbiAgICAgICAgICAgIHZpZXcuZGF0ZXNbY3VycmVudERheURpZmZlcmVuY2VdLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXZlbnRTZWxlY3RlZChldmVudDogSUV2ZW50KSB7XG4gICAgICAgIHRoaXMub25FdmVudFNlbGVjdGVkLmVtaXQoZXZlbnQpO1xuICAgIH1cbn1cbiJdfQ==