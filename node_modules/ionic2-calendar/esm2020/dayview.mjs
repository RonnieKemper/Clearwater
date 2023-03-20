import { DatePipe } from '@angular/common';
import { Component, HostBinding, Input, Output, EventEmitter, ViewChild, ViewEncapsulation } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "./calendar.service";
import * as i2 from "@angular/common";
import * as i3 from "swiper/angular";
import * as i4 from "./init-position-scroll";
export class DayViewComponent {
    constructor(calendarService, elm, zone) {
        this.calendarService = calendarService;
        this.elm = elm;
        this.zone = zone;
        this.class = true;
        this.dir = '';
        this.scrollToHour = 0;
        this.onRangeChanged = new EventEmitter();
        this.onEventSelected = new EventEmitter();
        this.onTimeSelected = new EventEmitter();
        this.onTitleChanged = new EventEmitter(true);
        this.views = [];
        this.currentViewIndex = 0;
        this.direction = 0;
        this.mode = 'day';
        this.inited = false;
        this.callbackOnInit = true;
    }
    static createDateObjects(startTime, startHour, endHour, timeInterval) {
        const rows = [], currentHour = 0, currentDate = startTime.getDate();
        let time, hourStep, minStep;
        if (timeInterval < 1) {
            hourStep = Math.floor(1 / timeInterval);
            minStep = 60;
        }
        else {
            hourStep = 1;
            minStep = Math.floor(60 / timeInterval);
        }
        for (let hour = startHour; hour < endHour; hour += hourStep) {
            for (let interval = 0; interval < 60; interval += minStep) {
                time = new Date(startTime.getTime());
                time.setHours(currentHour + hour, interval);
                time.setDate(currentDate);
                rows.push({
                    time,
                    events: []
                });
            }
        }
        return rows;
    }
    static compareEventByStartOffset(eventA, eventB) {
        return eventA.startOffset - eventB.startOffset;
    }
    static calculateWidth(orderedEvents, size, hourParts) {
        const totalSize = size * hourParts, cells = new Array(totalSize);
        // sort by position in descending order, the right most columns should be calculated first
        orderedEvents.sort((eventA, eventB) => {
            return eventB.position - eventA.position;
        });
        for (let i = 0; i < totalSize; i += 1) {
            cells[i] = {
                calculated: false,
                events: []
            };
        }
        const len = orderedEvents.length;
        for (let i = 0; i < len; i += 1) {
            const event = orderedEvents[i];
            let index = event.startIndex * hourParts + event.startOffset;
            while (index < event.endIndex * hourParts - event.endOffset) {
                cells[index].events.push(event);
                index += 1;
            }
        }
        let i = 0;
        while (i < len) {
            let event = orderedEvents[i];
            if (!event.overlapNumber) {
                const overlapNumber = event.position + 1;
                event.overlapNumber = overlapNumber;
                const eventQueue = [event];
                while (event = eventQueue.shift()) {
                    let index = event.startIndex * hourParts + event.startOffset;
                    while (index < event.endIndex * hourParts - event.endOffset) {
                        if (!cells[index].calculated) {
                            cells[index].calculated = true;
                            if (cells[index].events) {
                                const eventCountInCell = cells[index].events.length;
                                for (let j = 0; j < eventCountInCell; j += 1) {
                                    const currentEventInCell = cells[index].events[j];
                                    if (!currentEventInCell.overlapNumber) {
                                        currentEventInCell.overlapNumber = overlapNumber;
                                        eventQueue.push(currentEventInCell);
                                    }
                                }
                            }
                        }
                        index += 1;
                    }
                }
            }
            i += 1;
        }
    }
    ngOnInit() {
        if (!this.sliderOptions) {
            this.sliderOptions = {};
        }
        this.sliderOptions.loop = true;
        this.hourRange = (this.endHour - this.startHour) * this.hourSegments;
        if (this.dateFormatter && this.dateFormatter.formatDayViewTitle) {
            this.formatTitle = this.dateFormatter.formatDayViewTitle;
        }
        else {
            const datePipe = new DatePipe(this.locale);
            this.formatTitle = function (date) {
                return datePipe.transform(date, this.formatDayTitle) || '';
            };
        }
        if (this.dateFormatter && this.dateFormatter.formatDayViewHourColumn) {
            this.formatHourColumnLabel = this.dateFormatter.formatDayViewHourColumn;
        }
        else {
            const datePipe = new DatePipe(this.locale);
            this.formatHourColumnLabel = function (date) {
                return datePipe.transform(date, this.formatHourColumn) || '';
            };
        }
        this.refreshView();
        this.hourColumnLabels = this.getHourColumnLabels();
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
    ngAfterViewInit() {
        const title = this.getTitle();
        this.onTitleChanged.emit(title);
        if (this.scrollToHour > 0) {
            const hourColumns = this.elm.nativeElement.querySelector('.dayview-normal-event-container').querySelectorAll('.calendar-hour-column');
            const me = this;
            setTimeout(() => {
                me.initScrollPosition = hourColumns[me.scrollToHour - me.startHour].offsetTop;
            }, 50);
        }
    }
    ngOnChanges(changes) {
        if (!this.inited) {
            return;
        }
        if ((changes['startHour'] || changes['endHour']) && (!changes['startHour'].isFirstChange() || !changes['endHour'].isFirstChange())) {
            this.views = [];
            this.hourRange = (this.endHour - this.startHour) * this.hourSegments;
            this.direction = 0;
            this.refreshView();
            this.hourColumnLabels = this.getHourColumnLabels();
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
        if (lockSwipeToPrev) {
            this.slider.swiperRef.allowSlideNext = !lockSwipeToNext.currentValue;
        }
        const lockSwipes = changes['lockSwipes'];
        if (lockSwipes) {
            this.slider.swiperRef.allowTouchMove = !lockSwipes.currentValue;
        }
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
        const adjacentDate = this.calendarService.getAdjacentCalendarDate(this.mode, direction);
        this.calendarService.setCurrentDate(adjacentDate);
        this.refreshView();
        this.direction = 0;
    }
    getHourColumnLabels() {
        const hourColumnLabels = [];
        for (let hour = 0, length = this.views[0].rows.length; hour < length; hour += 1) {
            // handle edge case for DST
            if (hour === 0 && this.views[0].rows[hour].time.getHours() !== this.startHour) {
                const time = new Date(this.views[0].rows[hour].time);
                time.setDate(time.getDate() + 1);
                time.setHours(this.startHour);
                hourColumnLabels.push(this.formatHourColumnLabel(time));
            }
            else {
                hourColumnLabels.push(this.formatHourColumnLabel(this.views[0].rows[hour].time));
            }
        }
        return hourColumnLabels;
    }
    getViewData(startTime) {
        return {
            rows: DayViewComponent.createDateObjects(startTime, this.startHour, this.endHour, this.hourSegments),
            allDayEvents: []
        };
    }
    getRange(currentDate) {
        const year = currentDate.getFullYear(), month = currentDate.getMonth(), date = currentDate.getDate(), startTime = new Date(year, month, date, 12, 0, 0), endTime = new Date(year, month, date + 1, 12, 0, 0);
        return {
            startTime,
            endTime
        };
    }
    onDataLoaded() {
        const eventSource = this.eventSource, len = eventSource ? eventSource.length : 0, startTime = this.range.startTime, endTime = this.range.endTime, utcStartTime = Date.UTC(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()), utcEndTime = Date.UTC(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()), currentViewIndex = this.currentViewIndex, rows = this.views[currentViewIndex].rows, allDayEvents = this.views[currentViewIndex].allDayEvents = [], oneHour = 3600000, eps = 0.016, rangeStartRowIndex = this.startHour * this.hourSegments, rangeEndRowIndex = this.endHour * this.hourSegments;
        let normalEventInRange = false;
        for (let hour = 0; hour < this.hourRange; hour += 1) {
            rows[hour].events = [];
        }
        for (let i = 0; i < len; i += 1) {
            const event = eventSource[i];
            const eventStartTime = event.startTime;
            const eventEndTime = event.endTime;
            let eventUTCStartTime, eventUTCEndTime;
            if (event.allDay) {
                eventUTCStartTime = eventStartTime.getTime();
                eventUTCEndTime = eventEndTime.getTime();
            }
            else {
                eventUTCStartTime = Date.UTC(eventStartTime.getFullYear(), eventStartTime.getMonth(), eventStartTime.getDate());
                eventUTCEndTime = Date.UTC(eventEndTime.getFullYear(), eventEndTime.getMonth(), eventEndTime.getDate() + 1);
            }
            if (eventUTCEndTime <= utcStartTime || eventUTCStartTime >= utcEndTime || eventStartTime >= eventEndTime) {
                continue;
            }
            if (event.allDay) {
                allDayEvents.push({
                    event
                });
            }
            else {
                normalEventInRange = true;
                let timeDifferenceStart;
                if (eventUTCStartTime < utcStartTime) {
                    timeDifferenceStart = 0;
                }
                else {
                    timeDifferenceStart = (eventStartTime.getHours() + eventStartTime.getMinutes() / 60) * this.hourSegments;
                }
                let timeDifferenceEnd;
                if (eventUTCEndTime > utcEndTime) {
                    timeDifferenceEnd = (utcEndTime - utcStartTime) / oneHour * this.hourSegments;
                }
                else {
                    timeDifferenceEnd = (eventEndTime.getHours() + eventEndTime.getMinutes() / 60) * this.hourSegments;
                }
                let startIndex = Math.floor(timeDifferenceStart);
                let endIndex = Math.ceil(timeDifferenceEnd - eps);
                let startOffset = 0;
                let endOffset = 0;
                if (this.hourParts !== 1) {
                    if (startIndex < rangeStartRowIndex) {
                        startOffset = 0;
                    }
                    else {
                        startOffset = Math.floor((timeDifferenceStart - startIndex) * this.hourParts);
                    }
                    if (endIndex > rangeEndRowIndex) {
                        endOffset = 0;
                    }
                    else {
                        endOffset = Math.floor((endIndex - timeDifferenceEnd) * this.hourParts);
                    }
                }
                if (startIndex < rangeStartRowIndex) {
                    startIndex = 0;
                }
                else {
                    startIndex -= rangeStartRowIndex;
                }
                if (endIndex > rangeEndRowIndex) {
                    endIndex = rangeEndRowIndex;
                }
                endIndex -= rangeStartRowIndex;
                if (startIndex < endIndex) {
                    const displayEvent = {
                        event,
                        startIndex,
                        endIndex,
                        startOffset,
                        endOffset,
                        position: 0
                    };
                    let eventSet = rows[startIndex].events;
                    if (eventSet) {
                        eventSet.push(displayEvent);
                    }
                    else {
                        eventSet = [];
                        eventSet.push(displayEvent);
                        rows[startIndex].events = eventSet;
                    }
                }
            }
        }
        if (normalEventInRange) {
            let orderedEvents = [];
            for (let hour = 0; hour < this.hourRange; hour += 1) {
                if (rows[hour].events) {
                    rows[hour].events.sort(DayViewComponent.compareEventByStartOffset);
                    orderedEvents = orderedEvents.concat(rows[hour].events);
                }
            }
            if (orderedEvents.length > 0) {
                this.placeEvents(orderedEvents);
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
        this.calendarService.rangeChanged(this);
    }
    getTitle() {
        const startingDate = new Date(this.range.startTime.getTime());
        startingDate.setHours(12, 0, 0, 0);
        return this.formatTitle(startingDate);
    }
    select(selectedTime, events) {
        let disabled = false;
        if (this.markDisabled) {
            disabled = this.markDisabled(selectedTime);
        }
        this.onTimeSelected.emit({
            selectedTime,
            events: events.map(e => e.event),
            disabled
        });
    }
    placeEvents(orderedEvents) {
        this.calculatePosition(orderedEvents);
        DayViewComponent.calculateWidth(orderedEvents, this.hourRange, this.hourParts);
    }
    placeAllDayEvents(orderedEvents) {
        this.calculatePosition(orderedEvents);
    }
    overlap(event1, event2) {
        let earlyEvent = event1, lateEvent = event2;
        if (event1.startIndex > event2.startIndex || (event1.startIndex === event2.startIndex && event1.startOffset > event2.startOffset)) {
            earlyEvent = event2;
            lateEvent = event1;
        }
        if (earlyEvent.endIndex <= lateEvent.startIndex) {
            return false;
        }
        else {
            return !(earlyEvent.endIndex - lateEvent.startIndex === 1 && earlyEvent.endOffset + lateEvent.startOffset >= this.hourParts);
        }
    }
    calculatePosition(events) {
        const len = events.length, isForbidden = new Array(len);
        let maxColumn = 0, col;
        for (let i = 0; i < len; i += 1) {
            for (col = 0; col < maxColumn; col += 1) {
                isForbidden[col] = false;
            }
            for (let j = 0; j < i; j += 1) {
                if (this.overlap(events[i], events[j])) {
                    isForbidden[events[j].position] = true;
                }
            }
            for (col = 0; col < maxColumn; col += 1) {
                if (!isForbidden[col]) {
                    break;
                }
            }
            if (col < maxColumn) {
                events[i].position = col;
            }
            else {
                events[i].position = maxColumn++;
            }
        }
        if (this.dir === 'rtl') {
            for (let i = 0; i < len; i += 1) {
                events[i].position = maxColumn - 1 - events[i].position;
            }
        }
    }
    eventSelected(event) {
        this.onEventSelected.emit(event);
    }
    setScrollPosition(scrollPosition) {
        this.initScrollPosition = scrollPosition;
    }
}
DayViewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: DayViewComponent, deps: [{ token: i1.CalendarService }, { token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
DayViewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.1.2", type: DayViewComponent, selector: "dayview", inputs: { dayviewAllDayEventTemplate: "dayviewAllDayEventTemplate", dayviewNormalEventTemplate: "dayviewNormalEventTemplate", dayviewAllDayEventSectionTemplate: "dayviewAllDayEventSectionTemplate", dayviewNormalEventSectionTemplate: "dayviewNormalEventSectionTemplate", dayviewInactiveAllDayEventSectionTemplate: "dayviewInactiveAllDayEventSectionTemplate", dayviewInactiveNormalEventSectionTemplate: "dayviewInactiveNormalEventSectionTemplate", formatHourColumn: "formatHourColumn", formatDayTitle: "formatDayTitle", allDayLabel: "allDayLabel", hourParts: "hourParts", eventSource: "eventSource", markDisabled: "markDisabled", locale: "locale", dateFormatter: "dateFormatter", dir: "dir", scrollToHour: "scrollToHour", preserveScrollPosition: "preserveScrollPosition", lockSwipeToPrev: "lockSwipeToPrev", lockSwipeToNext: "lockSwipeToNext", lockSwipes: "lockSwipes", startHour: "startHour", endHour: "endHour", sliderOptions: "sliderOptions", hourSegments: "hourSegments" }, outputs: { onRangeChanged: "onRangeChanged", onEventSelected: "onEventSelected", onTimeSelected: "onTimeSelected", onTitleChanged: "onTitleChanged" }, host: { properties: { "class.dayview": "this.class" } }, viewQueries: [{ propertyName: "slider", first: true, predicate: ["swiper"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
        <swiper #swiper [config]="sliderOptions" [dir]="dir" [allowSlidePrev]="!lockSwipeToPrev" [allowSlideNext]="!lockSwipeToNext" [allowTouchMove]="!lockSwipes" (slideChangeTransitionEnd)="onSlideChanged()" class="slides-container">
            <ng-template swiperSlide class="slide-container">
                <div class="dayview-allday-table">
                    <div class="dayview-allday-label">{{allDayLabel}}</div>
                    <div class="dayview-allday-content-wrapper scroll-content">
                        <table class="table table-bordered dayview-allday-content-table">
                            <tbody>
                            <tr>
                                <td class="calendar-cell" [ngClass]="{'calendar-event-wrap':views[0].allDayEvents.length>0}"
                                    [ngStyle]="{height: 25*views[0].allDayEvents.length+'px'}"
                                    *ngIf="0===currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[0].allDayEvents,eventTemplate:dayviewAllDayEventTemplate}">
                                    </ng-template>
                                </td>
                                <td class="calendar-cell" *ngIf="0!==currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewInactiveAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[0].allDayEvents}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <init-position-scroll *ngIf="0===currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition" [emitEvent]="preserveScrollPosition"
                                      (onScroll)="setScrollPosition($event)">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[0].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell" tappable (click)="select(tm.time, tm.events)">
                                <ng-template [ngTemplateOutlet]="dayviewNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:dayviewNormalEventTemplate}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
                <init-position-scroll *ngIf="0!==currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[0].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell">
                                <ng-template [ngTemplateOutlet]="dayviewInactiveNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <div class="dayview-allday-table">
                    <div class="dayview-allday-label">{{allDayLabel}}</div>
                    <div class="dayview-allday-content-wrapper scroll-content">
                        <table class="table table-bordered dayview-allday-content-table">
                            <tbody>
                            <tr>
                                <td class="calendar-cell" [ngClass]="{'calendar-event-wrap':views[1].allDayEvents.length>0}"
                                    [ngStyle]="{height: 25*views[1].allDayEvents.length+'px'}"
                                    *ngIf="1===currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[1].allDayEvents,eventTemplate:dayviewAllDayEventTemplate}">
                                    </ng-template>
                                </td>
                                <td class="calendar-cell" *ngIf="1!==currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewInactiveAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[1].allDayEvents}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <init-position-scroll *ngIf="1===currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition" [emitEvent]="preserveScrollPosition"
                                      (onScroll)="setScrollPosition($event)">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[1].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell" tappable (click)="select(tm.time, tm.events)">
                                <ng-template [ngTemplateOutlet]="dayviewNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:dayviewNormalEventTemplate}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
                <init-position-scroll *ngIf="1!==currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[1].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell">
                                <ng-template [ngTemplateOutlet]="dayviewInactiveNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <div class="dayview-allday-table">
                    <div class="dayview-allday-label">{{allDayLabel}}</div>
                    <div class="dayview-allday-content-wrapper scroll-content">
                        <table class="table table-bordered dayview-allday-content-table">
                            <tbody>
                            <tr>
                                <td class="calendar-cell" [ngClass]="{'calendar-event-wrap':views[2].allDayEvents.length>0}"
                                    [ngStyle]="{height: 25*views[2].allDayEvents.length+'px'}"
                                    *ngIf="2===currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[2].allDayEvents,eventTemplate:dayviewAllDayEventTemplate}">
                                    </ng-template>
                                </td>
                                <td class="calendar-cell" *ngIf="2!==currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewInactiveAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[2].allDayEvents}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <init-position-scroll *ngIf="2===currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition" [emitEvent]="preserveScrollPosition"
                                      (onScroll)="setScrollPosition($event)">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[2].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell" tappable (click)="select(tm.time, tm.events)">
                                <ng-template [ngTemplateOutlet]="dayviewNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:dayviewNormalEventTemplate}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
                <init-position-scroll *ngIf="2!==currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[2].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell">
                                <ng-template [ngTemplateOutlet]="dayviewInactiveNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
            </ng-template>
        </swiper>
    `, isInline: true, styles: [".table-fixed{table-layout:fixed}.table{width:100%;max-width:100%;background-color:transparent}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:20px;vertical-align:top}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>thead:first-child>tr:first-child>th,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.calendar-hour-column{width:50px;white-space:nowrap}.calendar-event-wrap{position:relative;width:100%;height:100%}.calendar-event{position:absolute;padding:2px;cursor:pointer;z-index:10000}.slides-container{height:100%}.slide-container{display:block!important}.calendar-cell{padding:0!important;height:37px}.dayview-allday-label{float:left;height:100%;line-height:50px;text-align:center;width:50px;border-left:1px solid #ddd}[dir=rtl] .dayview-allday-label{border-right:1px solid #ddd;float:right}.dayview-allday-content-wrapper{margin-left:50px;overflow:hidden;height:51px}[dir=rtl] .dayview-allday-content-wrapper{margin-left:0;margin-right:50px}.dayview-allday-content-table{min-height:50px}.dayview-allday-content-table td{border-left:1px solid #ddd;border-right:1px solid #ddd}.dayview-allday-table{height:50px;position:relative;border-bottom:1px solid #ddd;font-size:14px}.dayview-normal-event-container{margin-top:50px;overflow:hidden;inset:0;position:absolute;font-size:14px}.scroll-content{overflow-y:auto;overflow-x:hidden}::-webkit-scrollbar,*::-webkit-scrollbar{display:none}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle}@media (max-width: 750px){.dayview-allday-label,.calendar-hour-column{width:31px;font-size:12px}.dayview-allday-label{padding-top:4px}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle;line-height:12px}.dayview-allday-label{line-height:20px}.dayview-allday-content-wrapper{margin-left:31px}[dir=rtl] .dayview-allday-content-wrapper{margin-left:0;margin-right:31px}}\n"], dependencies: [{ kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i3.SwiperComponent, selector: "swiper, [swiper]", inputs: ["enabled", "on", "direction", "touchEventsTarget", "initialSlide", "speed", "cssMode", "updateOnWindowResize", "resizeObserver", "nested", "focusableElements", "width", "height", "preventInteractionOnTransition", "userAgent", "url", "edgeSwipeDetection", "edgeSwipeThreshold", "freeMode", "autoHeight", "setWrapperSize", "virtualTranslate", "effect", "breakpoints", "spaceBetween", "slidesPerView", "maxBackfaceHiddenSlides", "grid", "slidesPerGroup", "slidesPerGroupSkip", "centeredSlides", "centeredSlidesBounds", "slidesOffsetBefore", "slidesOffsetAfter", "normalizeSlideIndex", "centerInsufficientSlides", "watchOverflow", "roundLengths", "touchRatio", "touchAngle", "simulateTouch", "shortSwipes", "longSwipes", "longSwipesRatio", "longSwipesMs", "followFinger", "allowTouchMove", "threshold", "touchMoveStopPropagation", "touchStartPreventDefault", "touchStartForcePreventDefault", "touchReleaseOnEdges", "uniqueNavElements", "resistance", "resistanceRatio", "watchSlidesProgress", "grabCursor", "preventClicks", "preventClicksPropagation", "slideToClickedSlide", "preloadImages", "updateOnImagesReady", "loop", "loopAdditionalSlides", "loopedSlides", "loopedSlidesLimit", "loopFillGroupWithBlank", "loopPreventsSlide", "rewind", "allowSlidePrev", "allowSlideNext", "swipeHandler", "noSwiping", "noSwipingClass", "noSwipingSelector", "passiveListeners", "containerModifierClass", "slideClass", "slideBlankClass", "slideActiveClass", "slideDuplicateActiveClass", "slideVisibleClass", "slideDuplicateClass", "slideNextClass", "slideDuplicateNextClass", "slidePrevClass", "slideDuplicatePrevClass", "wrapperClass", "runCallbacksOnInit", "observeParents", "observeSlideChildren", "a11y", "autoplay", "controller", "coverflowEffect", "cubeEffect", "fadeEffect", "flipEffect", "creativeEffect", "cardsEffect", "hashNavigation", "history", "keyboard", "lazy", "mousewheel", "parallax", "thumbs", "zoom", "slidesPerGroupAuto", "class", "id", "navigation", "pagination", "scrollbar", "virtual", "config"], outputs: ["_beforeBreakpoint", "_containerClasses", "_slideClass", "_swiper", "activeIndexChange", "afterInit", "autoplay", "autoplayStart", "autoplayStop", "autoplayPause", "autoplayResume", "beforeDestroy", "beforeInit", "beforeLoopFix", "beforeResize", "beforeSlideChangeStart", "beforeTransitionStart", "breakpoint", "changeDirection", "click", "doubleTap", "doubleClick", "destroy", "fromEdge", "hashChange", "hashSet", "imagesReady", "init", "keyPress", "lazyImageLoad", "lazyImageReady", "loopFix", "momentumBounce", "navigationHide", "navigationShow", "navigationPrev", "navigationNext", "observerUpdate", "orientationchange", "paginationHide", "paginationRender", "paginationShow", "paginationUpdate", "progress", "reachBeginning", "reachEnd", "realIndexChange", "resize", "scroll", "scrollbarDragEnd", "scrollbarDragMove", "scrollbarDragStart", "setTransition", "setTranslate", "slideChange", "slideChangeTransitionEnd", "slideChangeTransitionStart", "slideNextTransitionEnd", "slideNextTransitionStart", "slidePrevTransitionEnd", "slidePrevTransitionStart", "slideResetTransitionStart", "slideResetTransitionEnd", "sliderMove", "sliderFirstMove", "slidesLengthChange", "slidesGridLengthChange", "snapGridLengthChange", "snapIndexChange", "tap", "toEdge", "touchEnd", "touchMove", "touchMoveOpposite", "touchStart", "transitionEnd", "transitionStart", "update", "zoomChange", "swiper", "lock", "unlock"] }, { kind: "directive", type: i3.SwiperSlideDirective, selector: "ng-template[swiperSlide]", inputs: ["virtualIndex", "class", "ngClass", "data-swiper-autoplay", "zoom"] }, { kind: "component", type: i4.initPositionScrollComponent, selector: "init-position-scroll", inputs: ["initPosition", "emitEvent"], outputs: ["onScroll"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: DayViewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'dayview', template: `
        <swiper #swiper [config]="sliderOptions" [dir]="dir" [allowSlidePrev]="!lockSwipeToPrev" [allowSlideNext]="!lockSwipeToNext" [allowTouchMove]="!lockSwipes" (slideChangeTransitionEnd)="onSlideChanged()" class="slides-container">
            <ng-template swiperSlide class="slide-container">
                <div class="dayview-allday-table">
                    <div class="dayview-allday-label">{{allDayLabel}}</div>
                    <div class="dayview-allday-content-wrapper scroll-content">
                        <table class="table table-bordered dayview-allday-content-table">
                            <tbody>
                            <tr>
                                <td class="calendar-cell" [ngClass]="{'calendar-event-wrap':views[0].allDayEvents.length>0}"
                                    [ngStyle]="{height: 25*views[0].allDayEvents.length+'px'}"
                                    *ngIf="0===currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[0].allDayEvents,eventTemplate:dayviewAllDayEventTemplate}">
                                    </ng-template>
                                </td>
                                <td class="calendar-cell" *ngIf="0!==currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewInactiveAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[0].allDayEvents}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <init-position-scroll *ngIf="0===currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition" [emitEvent]="preserveScrollPosition"
                                      (onScroll)="setScrollPosition($event)">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[0].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell" tappable (click)="select(tm.time, tm.events)">
                                <ng-template [ngTemplateOutlet]="dayviewNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:dayviewNormalEventTemplate}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
                <init-position-scroll *ngIf="0!==currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[0].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell">
                                <ng-template [ngTemplateOutlet]="dayviewInactiveNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <div class="dayview-allday-table">
                    <div class="dayview-allday-label">{{allDayLabel}}</div>
                    <div class="dayview-allday-content-wrapper scroll-content">
                        <table class="table table-bordered dayview-allday-content-table">
                            <tbody>
                            <tr>
                                <td class="calendar-cell" [ngClass]="{'calendar-event-wrap':views[1].allDayEvents.length>0}"
                                    [ngStyle]="{height: 25*views[1].allDayEvents.length+'px'}"
                                    *ngIf="1===currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[1].allDayEvents,eventTemplate:dayviewAllDayEventTemplate}">
                                    </ng-template>
                                </td>
                                <td class="calendar-cell" *ngIf="1!==currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewInactiveAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[1].allDayEvents}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <init-position-scroll *ngIf="1===currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition" [emitEvent]="preserveScrollPosition"
                                      (onScroll)="setScrollPosition($event)">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[1].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell" tappable (click)="select(tm.time, tm.events)">
                                <ng-template [ngTemplateOutlet]="dayviewNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:dayviewNormalEventTemplate}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
                <init-position-scroll *ngIf="1!==currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[1].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell">
                                <ng-template [ngTemplateOutlet]="dayviewInactiveNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <div class="dayview-allday-table">
                    <div class="dayview-allday-label">{{allDayLabel}}</div>
                    <div class="dayview-allday-content-wrapper scroll-content">
                        <table class="table table-bordered dayview-allday-content-table">
                            <tbody>
                            <tr>
                                <td class="calendar-cell" [ngClass]="{'calendar-event-wrap':views[2].allDayEvents.length>0}"
                                    [ngStyle]="{height: 25*views[2].allDayEvents.length+'px'}"
                                    *ngIf="2===currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[2].allDayEvents,eventTemplate:dayviewAllDayEventTemplate}">
                                    </ng-template>
                                </td>
                                <td class="calendar-cell" *ngIf="2!==currentViewIndex">
                                    <ng-template [ngTemplateOutlet]="dayviewInactiveAllDayEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{allDayEvents:views[2].allDayEvents}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <init-position-scroll *ngIf="2===currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition" [emitEvent]="preserveScrollPosition"
                                      (onScroll)="setScrollPosition($event)">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[2].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell" tappable (click)="select(tm.time, tm.events)">
                                <ng-template [ngTemplateOutlet]="dayviewNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:dayviewNormalEventTemplate}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
                <init-position-scroll *ngIf="2!==currentViewIndex" class="dayview-normal-event-container"
                                      [initPosition]="initScrollPosition">
                    <table class="table table-bordered table-fixed dayview-normal-event-table">
                        <tbody>
                        <tr *ngFor="let tm of views[2].rows; let i = index">
                            <td class="calendar-hour-column text-center">
                                {{hourColumnLabels[i]}}
                            </td>
                            <td class="calendar-cell">
                                <ng-template [ngTemplateOutlet]="dayviewInactiveNormalEventSectionTemplate"
                                             [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                </ng-template>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </init-position-scroll>
            </ng-template>
        </swiper>
    `, encapsulation: ViewEncapsulation.None, styles: [".table-fixed{table-layout:fixed}.table{width:100%;max-width:100%;background-color:transparent}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:20px;vertical-align:top}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>thead:first-child>tr:first-child>th,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.calendar-hour-column{width:50px;white-space:nowrap}.calendar-event-wrap{position:relative;width:100%;height:100%}.calendar-event{position:absolute;padding:2px;cursor:pointer;z-index:10000}.slides-container{height:100%}.slide-container{display:block!important}.calendar-cell{padding:0!important;height:37px}.dayview-allday-label{float:left;height:100%;line-height:50px;text-align:center;width:50px;border-left:1px solid #ddd}[dir=rtl] .dayview-allday-label{border-right:1px solid #ddd;float:right}.dayview-allday-content-wrapper{margin-left:50px;overflow:hidden;height:51px}[dir=rtl] .dayview-allday-content-wrapper{margin-left:0;margin-right:50px}.dayview-allday-content-table{min-height:50px}.dayview-allday-content-table td{border-left:1px solid #ddd;border-right:1px solid #ddd}.dayview-allday-table{height:50px;position:relative;border-bottom:1px solid #ddd;font-size:14px}.dayview-normal-event-container{margin-top:50px;overflow:hidden;inset:0;position:absolute;font-size:14px}.scroll-content{overflow-y:auto;overflow-x:hidden}::-webkit-scrollbar,*::-webkit-scrollbar{display:none}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle}@media (max-width: 750px){.dayview-allday-label,.calendar-hour-column{width:31px;font-size:12px}.dayview-allday-label{padding-top:4px}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle;line-height:12px}.dayview-allday-label{line-height:20px}.dayview-allday-content-wrapper{margin-left:31px}[dir=rtl] .dayview-allday-content-wrapper{margin-left:0;margin-right:31px}}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CalendarService }, { type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { class: [{
                type: HostBinding,
                args: ['class.dayview']
            }], slider: [{
                type: ViewChild,
                args: ['swiper', { static: false }]
            }], dayviewAllDayEventTemplate: [{
                type: Input
            }], dayviewNormalEventTemplate: [{
                type: Input
            }], dayviewAllDayEventSectionTemplate: [{
                type: Input
            }], dayviewNormalEventSectionTemplate: [{
                type: Input
            }], dayviewInactiveAllDayEventSectionTemplate: [{
                type: Input
            }], dayviewInactiveNormalEventSectionTemplate: [{
                type: Input
            }], formatHourColumn: [{
                type: Input
            }], formatDayTitle: [{
                type: Input
            }], allDayLabel: [{
                type: Input
            }], hourParts: [{
                type: Input
            }], eventSource: [{
                type: Input
            }], markDisabled: [{
                type: Input
            }], locale: [{
                type: Input
            }], dateFormatter: [{
                type: Input
            }], dir: [{
                type: Input
            }], scrollToHour: [{
                type: Input
            }], preserveScrollPosition: [{
                type: Input
            }], lockSwipeToPrev: [{
                type: Input
            }], lockSwipeToNext: [{
                type: Input
            }], lockSwipes: [{
                type: Input
            }], startHour: [{
                type: Input
            }], endHour: [{
                type: Input
            }], sliderOptions: [{
                type: Input
            }], hourSegments: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF5dmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kYXl2aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0gsU0FBUyxFQUdULFdBQVcsRUFDWCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFFWixTQUFTLEVBQ1QsaUJBQWlCLEVBTXBCLE1BQU0sZUFBZSxDQUFDOzs7Ozs7QUFrWXZCLE1BQU0sT0FBTyxnQkFBZ0I7SUFFekIsWUFBb0IsZUFBZ0MsRUFBVSxHQUFlLEVBQVUsSUFBWTtRQUEvRSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFBVSxRQUFHLEdBQUgsR0FBRyxDQUFZO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUdyRSxVQUFLLEdBQUcsSUFBSSxDQUFDO1FBa0JsQyxRQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ1QsaUJBQVksR0FBRyxDQUFDLENBQUM7UUFVaEIsbUJBQWMsR0FBRyxJQUFJLFlBQVksRUFBVSxDQUFDO1FBQzVDLG9CQUFlLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUM3QyxtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFpQixDQUFDO1FBQ25ELG1CQUFjLEdBQUcsSUFBSSxZQUFZLENBQVMsSUFBSSxDQUFDLENBQUM7UUFFbkQsVUFBSyxHQUFlLEVBQUUsQ0FBQztRQUN2QixxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDckIsY0FBUyxHQUFHLENBQUMsQ0FBQztRQUNkLFNBQUksR0FBaUIsS0FBSyxDQUFDO1FBRzFCLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFDZixtQkFBYyxHQUFHLElBQUksQ0FBQztJQTNDOUIsQ0FBQztJQXVERCxNQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBZSxFQUFFLFNBQWlCLEVBQUUsT0FBZSxFQUFFLFlBQW9CO1FBQzlGLE1BQU0sSUFBSSxHQUFrQixFQUFFLEVB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QkFBZixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFFSSxjQUFjO3NCQUF2QixNQUFNO2dCQUNHLGVBQWU7c0JBQXhCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTTtnQkFDRyxjQUFjO3NCQUF2QixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtEYXRlUGlwZX0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gICAgQ29tcG9uZW50LFxuICAgIE9uSW5pdCxcbiAgICBPbkNoYW5nZXMsXG4gICAgSG9zdEJpbmRpbmcsXG4gICAgSW5wdXQsXG4gICAgT3V0cHV0LFxuICAgIEV2ZW50RW1pdHRlcixcbiAgICBTaW1wbGVDaGFuZ2VzLFxuICAgIFZpZXdDaGlsZCxcbiAgICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICBUZW1wbGF0ZVJlZixcbiAgICBFbGVtZW50UmVmLFxuICAgIEFmdGVyVmlld0luaXQsIFxuICAgIE9uRGVzdHJveSxcbiAgICBOZ1pvbmVcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBTd2lwZXJDb21wb25lbnQgfSBmcm9tICdzd2lwZXIvYW5ndWxhcic7XG5cbmltcG9ydCB7XG4gICAgSUNhbGVuZGFyQ29tcG9uZW50LFxuICAgIElEYXlWaWV3LFxuICAgIElEYXlWaWV3Um93LFxuICAgIElEaXNwbGF5RXZlbnQsXG4gICAgSUV2ZW50LFxuICAgIElUaW1lU2VsZWN0ZWQsXG4gICAgSVJhbmdlLFxuICAgIENhbGVuZGFyTW9kZSxcbiAgICBJRGF0ZUZvcm1hdHRlcixcbiAgICBJRGlzcGxheUFsbERheUV2ZW50LFxuICAgIElEYXlWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0LFxuICAgIElEYXlWaWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0XG59IGZyb20gJy4vY2FsZW5kYXIuaW50ZXJmYWNlJztcbmltcG9ydCB7Q2FsZW5kYXJTZXJ2aWNlfSBmcm9tICcuL2NhbGVuZGFyLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ2RheXZpZXcnLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxzd2lwZXIgI3N3aXBlciBbY29uZmlnXT1cInNsaWRlck9wdGlvbnNcIiBbZGlyXT1cImRpclwiIFthbGxvd1NsaWRlUHJldl09XCIhbG9ja1N3aXBlVG9QcmV2XCIgW2FsbG93U2xpZGVOZXh0XT1cIiFsb2NrU3dpcGVUb05leHRcIiBbYWxsb3dUb3VjaE1vdmVdPVwiIWxvY2tTd2lwZXNcIiAoc2xpZGVDaGFuZ2VUcmFuc2l0aW9uRW5kKT1cIm9uU2xpZGVDaGFuZ2VkKClcIiBjbGFzcz1cInNsaWRlcy1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBzd2lwZXJTbGlkZSBjbGFzcz1cInNsaWRlLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkYXl2aWV3LWFsbGRheS10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGF5dmlldy1hbGxkYXktbGFiZWxcIj57e2FsbERheUxhYmVsfX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRheXZpZXctYWxsZGF5LWNvbnRlbnQtd3JhcHBlciBzY3JvbGwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWQgZGF5dmlldy1hbGxkYXktY29udGVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIiBbbmdDbGFzc109XCJ7J2NhbGVuZGFyLWV2ZW50LXdyYXAnOnZpZXdzWzBdLmFsbERheUV2ZW50cy5sZW5ndGg+MH1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nU3R5bGVdPVwie2hlaWdodDogMjUqdmlld3NbMF0uYWxsRGF5RXZlbnRzLmxlbmd0aCsncHgnfVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqbmdJZj1cIjA9PT1jdXJyZW50Vmlld0luZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwiZGF5dmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie2FsbERheUV2ZW50czp2aWV3c1swXS5hbGxEYXlFdmVudHMsZXZlbnRUZW1wbGF0ZTpkYXl2aWV3QWxsRGF5RXZlbnRUZW1wbGF0ZX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIiAqbmdJZj1cIjAhPT1jdXJyZW50Vmlld0luZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwiZGF5dmlld0luYWN0aXZlQWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7YWxsRGF5RXZlbnRzOnZpZXdzWzBdLmFsbERheUV2ZW50c31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGluaXQtcG9zaXRpb24tc2Nyb2xsICpuZ0lmPVwiMD09PWN1cnJlbnRWaWV3SW5kZXhcIiBjbGFzcz1cImRheXZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtpbml0UG9zaXRpb25dPVwiaW5pdFNjcm9sbFBvc2l0aW9uXCIgW2VtaXRFdmVudF09XCJwcmVzZXJ2ZVNjcm9sbFBvc2l0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9uU2Nyb2xsKT1cInNldFNjcm9sbFBvc2l0aW9uKCRldmVudClcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWQgdGFibGUtZml4ZWQgZGF5dmlldy1ub3JtYWwtZXZlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciAqbmdGb3I9XCJsZXQgdG0gb2Ygdmlld3NbMF0ucm93czsgbGV0IGkgPSBpbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWhvdXItY29sdW1uIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7aG91ckNvbHVtbkxhYmVsc1tpXX19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCIgdGFwcGFibGUgKGNsaWNrKT1cInNlbGVjdCh0bS50aW1lLCB0bS5ldmVudHMpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJkYXl2aWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt0bTp0bSwgaG91clBhcnRzOiBob3VyUGFydHMsIGV2ZW50VGVtcGxhdGU6ZGF5dmlld05vcm1hbEV2ZW50VGVtcGxhdGV9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDwvaW5pdC1wb3NpdGlvbi1zY3JvbGw+XG4gICAgICAgICAgICAgICAgPGluaXQtcG9zaXRpb24tc2Nyb2xsICpuZ0lmPVwiMCE9PWN1cnJlbnRWaWV3SW5kZXhcIiBjbGFzcz1cImRheXZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtpbml0UG9zaXRpb25dPVwiaW5pdFNjcm9sbFBvc2l0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIGRheXZpZXctbm9ybWFsLWV2ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHIgKm5nRm9yPVwibGV0IHRtIG9mIHZpZXdzWzBdLnJvd3M7IGxldCBpID0gaW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1ob3VyLWNvbHVtbiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7e2hvdXJDb2x1bW5MYWJlbHNbaV19fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwiZGF5dmlld0luYWN0aXZlTm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt0bTp0bSwgaG91clBhcnRzOiBob3VyUGFydHN9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDwvaW5pdC1wb3NpdGlvbi1zY3JvbGw+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlIHN3aXBlclNsaWRlIGNsYXNzPVwic2xpZGUtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRheXZpZXctYWxsZGF5LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkYXl2aWV3LWFsbGRheS1sYWJlbFwiPnt7YWxsRGF5TGFiZWx9fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGF5dmlldy1hbGxkYXktY29udGVudC13cmFwcGVyIHNjcm9sbC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCBkYXl2aWV3LWFsbGRheS1jb250ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiIFtuZ0NsYXNzXT1cInsnY2FsZW5kYXItZXZlbnQtd3JhcCc6dmlld3NbMV0uYWxsRGF5RXZlbnRzLmxlbmd0aD4wfVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdTdHlsZV09XCJ7aGVpZ2h0OiAyNSp2aWV3c1sxXS5hbGxEYXlFdmVudHMubGVuZ3RoKydweCd9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwiMT09PWN1cnJlbnRWaWV3SW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJkYXl2aWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7YWxsRGF5RXZlbnRzOnZpZXdzWzFdLmFsbERheUV2ZW50cyxldmVudFRlbXBsYXRlOmRheXZpZXdBbGxEYXlFdmVudFRlbXBsYXRlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiICpuZ0lmPVwiMSE9PWN1cnJlbnRWaWV3SW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJkYXl2aWV3SW5hY3RpdmVBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInthbGxEYXlFdmVudHM6dmlld3NbMV0uYWxsRGF5RXZlbnRzfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8aW5pdC1wb3NpdGlvbi1zY3JvbGwgKm5nSWY9XCIxPT09Y3VycmVudFZpZXdJbmRleFwiIGNsYXNzPVwiZGF5dmlldy1ub3JtYWwtZXZlbnQtY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2luaXRQb3NpdGlvbl09XCJpbml0U2Nyb2xsUG9zaXRpb25cIiBbZW1pdEV2ZW50XT1cInByZXNlcnZlU2Nyb2xsUG9zaXRpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAob25TY3JvbGwpPVwic2V0U2Nyb2xsUG9zaXRpb24oJGV2ZW50KVwiPlxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCBkYXl2aWV3LW5vcm1hbC1ldmVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCB0bSBvZiB2aWV3c1sxXS5yb3dzOyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItaG91ci1jb2x1bW4gdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3tob3VyQ29sdW1uTGFiZWxzW2ldfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIiB0YXBwYWJsZSAoY2xpY2spPVwic2VsZWN0KHRtLnRpbWUsIHRtLmV2ZW50cylcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cImRheXZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3RtOnRtLCBob3VyUGFydHM6IGhvdXJQYXJ0cywgZXZlbnRUZW1wbGF0ZTpkYXl2aWV3Tm9ybWFsRXZlbnRUZW1wbGF0ZX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9pbml0LXBvc2l0aW9uLXNjcm9sbD5cbiAgICAgICAgICAgICAgICA8aW5pdC1wb3NpdGlvbi1zY3JvbGwgKm5nSWY9XCIxIT09Y3VycmVudFZpZXdJbmRleFwiIGNsYXNzPVwiZGF5dmlldy1ub3JtYWwtZXZlbnQtY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2luaXRQb3NpdGlvbl09XCJpbml0U2Nyb2xsUG9zaXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWQgdGFibGUtZml4ZWQgZGF5dmlldy1ub3JtYWwtZXZlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciAqbmdGb3I9XCJsZXQgdG0gb2Ygdmlld3NbMV0ucm93czsgbGV0IGkgPSBpbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWhvdXItY29sdW1uIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7aG91ckNvbHVtbkxhYmVsc1tpXX19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJkYXl2aWV3SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3RtOnRtLCBob3VyUGFydHM6IGhvdXJQYXJ0c31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC9pbml0LXBvc2l0aW9uLXNjcm9sbD5cbiAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgc3dpcGVyU2xpZGUgY2xhc3M9XCJzbGlkZS1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZGF5dmlldy1hbGxkYXktdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRheXZpZXctYWxsZGF5LWxhYmVsXCI+e3thbGxEYXlMYWJlbH19PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkYXl2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIgc2Nyb2xsLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIGRheXZpZXctYWxsZGF5LWNvbnRlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCIgW25nQ2xhc3NdPVwieydjYWxlbmRhci1ldmVudC13cmFwJzp2aWV3c1syXS5hbGxEYXlFdmVudHMubGVuZ3RoPjB9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1N0eWxlXT1cIntoZWlnaHQ6IDI1KnZpZXdzWzJdLmFsbERheUV2ZW50cy5sZW5ndGgrJ3B4J31cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCIyPT09Y3VycmVudFZpZXdJbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cImRheXZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInthbGxEYXlFdmVudHM6dmlld3NbMl0uYWxsRGF5RXZlbnRzLGV2ZW50VGVtcGxhdGU6ZGF5dmlld0FsbERheUV2ZW50VGVtcGxhdGV9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCIgKm5nSWY9XCIyIT09Y3VycmVudFZpZXdJbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cImRheXZpZXdJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie2FsbERheUV2ZW50czp2aWV3c1syXS5hbGxEYXlFdmVudHN9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxpbml0LXBvc2l0aW9uLXNjcm9sbCAqbmdJZj1cIjI9PT1jdXJyZW50Vmlld0luZGV4XCIgY2xhc3M9XCJkYXl2aWV3LW5vcm1hbC1ldmVudC1jb250YWluZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbaW5pdFBvc2l0aW9uXT1cImluaXRTY3JvbGxQb3NpdGlvblwiIFtlbWl0RXZlbnRdPVwicHJlc2VydmVTY3JvbGxQb3NpdGlvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvblNjcm9sbCk9XCJzZXRTY3JvbGxQb3NpdGlvbigkZXZlbnQpXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIGRheXZpZXctbm9ybWFsLWV2ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHIgKm5nRm9yPVwibGV0IHRtIG9mIHZpZXdzWzJdLnJvd3M7IGxldCBpID0gaW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1ob3VyLWNvbHVtbiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7e2hvdXJDb2x1bW5MYWJlbHNbaV19fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiIHRhcHBhYmxlIChjbGljayk9XCJzZWxlY3QodG0udGltZSwgdG0uZXZlbnRzKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwiZGF5dmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7dG06dG0sIGhvdXJQYXJ0czogaG91clBhcnRzLCBldmVudFRlbXBsYXRlOmRheXZpZXdOb3JtYWxFdmVudFRlbXBsYXRlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2luaXQtcG9zaXRpb24tc2Nyb2xsPlxuICAgICAgICAgICAgICAgIDxpbml0LXBvc2l0aW9uLXNjcm9sbCAqbmdJZj1cIjIhPT1jdXJyZW50Vmlld0luZGV4XCIgY2xhc3M9XCJkYXl2aWV3LW5vcm1hbC1ldmVudC1jb250YWluZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbaW5pdFBvc2l0aW9uXT1cImluaXRTY3JvbGxQb3NpdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCBkYXl2aWV3LW5vcm1hbC1ldmVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCB0bSBvZiB2aWV3c1syXS5yb3dzOyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItaG91ci1jb2x1bW4gdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3tob3VyQ29sdW1uTGFiZWxzW2ldfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cImRheXZpZXdJbmFjdGl2ZU5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7dG06dG0sIGhvdXJQYXJ0czogaG91clBhcnRzfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2luaXQtcG9zaXRpb24tc2Nyb2xsPlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9zd2lwZXI+XG4gICAgYCxcbiAgICBzdHlsZXM6IFtgXG4gICAgICAgIC50YWJsZS1maXhlZCB7XG4gICAgICAgICAgICB0YWJsZS1sYXlvdXQ6IGZpeGVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0aGVhZCA+IHRyID4gdGgsIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0aCwgLnRhYmxlID4gdGZvb3QgPiB0ciA+IHRoLCAudGFibGUgPiB0aGVhZCA+IHRyID4gdGQsXG4gICAgICAgIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0ZCwgLnRhYmxlID4gdGZvb3QgPiB0ciA+IHRkIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDhweDtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAyMHB4O1xuICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IHRvcDtcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZSA+IHRoZWFkID4gdHIgPiB0aCB7XG4gICAgICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogYm90dG9tO1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0aGVhZDpmaXJzdC1jaGlsZCA+IHRyOmZpcnN0LWNoaWxkID4gdGgsIC50YWJsZSA+IHRoZWFkOmZpcnN0LWNoaWxkID4gdHI6Zmlyc3QtY2hpbGQgPiB0ZCB7XG4gICAgICAgICAgICBib3JkZXItdG9wOiAwXG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0Ym9keSArIHRib2R5IHtcbiAgICAgICAgICAgIGJvcmRlci10b3A6IDJweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlLWJvcmRlcmVkIHtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGgsIC50YWJsZS1ib3JkZXJlZCA+IHRib2R5ID4gdHIgPiB0aCwgLnRhYmxlLWJvcmRlcmVkID4gdGZvb3QgPiB0ciA+IHRoLFxuICAgICAgICAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGQsIC50YWJsZS1ib3JkZXJlZCA+IHRib2R5ID4gdHIgPiB0ZCwgLnRhYmxlLWJvcmRlcmVkID4gdGZvb3QgPiB0ciA+IHRkIHtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGgsIC50YWJsZS1ib3JkZXJlZCA+IHRoZWFkID4gdHIgPiB0ZCB7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tLXdpZHRoOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtc3RyaXBlZCA+IHRib2R5ID4gdHI6bnRoLWNoaWxkKG9kZCkgPiB0ZCwgLnRhYmxlLXN0cmlwZWQgPiB0Ym9keSA+IHRyOm50aC1jaGlsZChvZGQpID4gdGgge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjlmOVxuICAgICAgICB9XG5cbiAgICAgICAgLmNhbGVuZGFyLWhvdXItY29sdW1uIHtcbiAgICAgICAgICAgIHdpZHRoOiA1MHB4O1xuICAgICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5jYWxlbmRhci1ldmVudC13cmFwIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNhbGVuZGFyLWV2ZW50IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDJweDtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHotaW5kZXg6IDEwMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnNsaWRlcy1jb250YWluZXIge1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLnNsaWRlLWNvbnRhaW5lciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jayAhaW1wb3J0YW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLmNhbGVuZGFyLWNlbGwge1xuICAgICAgICAgICAgcGFkZGluZzogMCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgaGVpZ2h0OiAzN3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmRheXZpZXctYWxsZGF5LWxhYmVsIHtcbiAgICAgICAgICAgIGZsb2F0OiBsZWZ0O1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDUwcHg7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgICB3aWR0aDogNTBweDtcbiAgICAgICAgICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgI2RkZDtcbiAgICAgICAgfVxuXG4gICAgICAgIFtkaXI9XCJydGxcIl0gLmRheXZpZXctYWxsZGF5LWxhYmVsIHtcbiAgICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgICBmbG9hdDogcmlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICAuZGF5dmlldy1hbGxkYXktY29udGVudC13cmFwcGVyIHtcbiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiA1MHB4O1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICAgIGhlaWdodDogNTFweDtcbiAgICAgICAgfVxuXG4gICAgICAgIFtkaXI9XCJydGxcIl0gLmRheXZpZXctYWxsZGF5LWNvbnRlbnQtd3JhcHBlciB7XG4gICAgICAgICAgICBtYXJnaW4tbGVmdDogMDtcbiAgICAgICAgICAgIG1hcmdpbi1yaWdodDogNTBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5kYXl2aWV3LWFsbGRheS1jb250ZW50LXRhYmxlIHtcbiAgICAgICAgICAgIG1pbi1oZWlnaHQ6IDUwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAuZGF5dmlldy1hbGxkYXktY29udGVudC10YWJsZSB0ZCB7XG4gICAgICAgICAgICBib3JkZXItbGVmdDogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLmRheXZpZXctYWxsZGF5LXRhYmxlIHtcbiAgICAgICAgICAgIGhlaWdodDogNTBweDtcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmRheXZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lciB7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiA1MHB4O1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgICByaWdodDogMDtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGJvdHRvbTogMDtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zY3JvbGwtY29udGVudCB7XG4gICAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICAgICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgOjotd2Via2l0LXNjcm9sbGJhcixcbiAgICAgICAgKjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICAgICAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0ZC5jYWxlbmRhci1ob3VyLWNvbHVtbiB7XG4gICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDA7XG4gICAgICAgICAgICBwYWRkaW5nLXJpZ2h0OiAwO1xuICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIEBtZWRpYSAobWF4LXdpZHRoOiA3NTBweCkge1xuICAgICAgICAgICAgLmRheXZpZXctYWxsZGF5LWxhYmVsLCAuY2FsZW5kYXItaG91ci1jb2x1bW4ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAzMXB4O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLmRheXZpZXctYWxsZGF5LWxhYmVsIHtcbiAgICAgICAgICAgICAgICBwYWRkaW5nLXRvcDogNHB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAudGFibGUgPiB0Ym9keSA+IHRyID4gdGQuY2FsZW5kYXItaG91ci1jb2x1bW4ge1xuICAgICAgICAgICAgICAgIHBhZGRpbmctbGVmdDogMDtcbiAgICAgICAgICAgICAgICBwYWRkaW5nLXJpZ2h0OiAwO1xuICAgICAgICAgICAgICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEycHg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5kYXl2aWV3LWFsbGRheS1sYWJlbCB7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDIwcHg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5kYXl2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIge1xuICAgICAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAzMXB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBbZGlyPVwicnRsXCJdIC5kYXl2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIge1xuICAgICAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAwO1xuICAgICAgICAgICAgICAgIG1hcmdpbi1yaWdodDogMzFweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGBdLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmVcbn0pXG5leHBvcnQgY2xhc3MgRGF5Vmlld0NvbXBvbmVudCBpbXBsZW1lbnRzIElDYWxlbmRhckNvbXBvbmVudCwgT25Jbml0LCBPbkNoYW5nZXMsIE9uRGVzdHJveSwgQWZ0ZXJWaWV3SW5pdCB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbGVuZGFyU2VydmljZTogQ2FsZW5kYXJTZXJ2aWNlLCBwcml2YXRlIGVsbTogRWxlbWVudFJlZiwgcHJpdmF0ZSB6b25lOiBOZ1pvbmUpIHtcbiAgICB9XG5cbiAgICBASG9zdEJpbmRpbmcoJ2NsYXNzLmRheXZpZXcnKSBjbGFzcyA9IHRydWU7XG4gICAgQFZpZXdDaGlsZCgnc3dpcGVyJywgeyBzdGF0aWM6IGZhbHNlIH0pIHNsaWRlciE6IFN3aXBlckNvbXBvbmVudDtcblxuICAgIEBJbnB1dCgpIGRheXZpZXdBbGxEYXlFdmVudFRlbXBsYXRlITogVGVtcGxhdGVSZWY8SURpc3BsYXlBbGxEYXlFdmVudD47XG4gICAgQElucHV0KCkgZGF5dmlld05vcm1hbEV2ZW50VGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJRGlzcGxheUV2ZW50PjtcbiAgICBASW5wdXQoKSBkYXl2aWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJRGF5Vmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlQ29udGV4dD47XG4gICAgQElucHV0KCkgZGF5dmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlITogVGVtcGxhdGVSZWY8SURheVZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIGRheXZpZXdJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlITogVGVtcGxhdGVSZWY8SURheVZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIGRheXZpZXdJbmFjdGl2ZU5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlITogVGVtcGxhdGVSZWY8SURheVZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuXG4gICAgQElucHV0KCkgZm9ybWF0SG91ckNvbHVtbj86IHN0cmluZztcbiAgICBASW5wdXQoKSBmb3JtYXREYXlUaXRsZT86IHN0cmluZztcbiAgICBASW5wdXQoKSBhbGxEYXlMYWJlbD86IHN0cmluZztcbiAgICBASW5wdXQoKSBob3VyUGFydHMhOiBudW1iZXI7XG4gICAgQElucHV0KCkgZXZlbnRTb3VyY2UhOiBJRXZlbnRbXTtcbiAgICBASW5wdXQoKSBtYXJrRGlzYWJsZWQ/OiAoZGF0ZTogRGF0ZSkgPT4gYm9vbGVhbjtcbiAgICBASW5wdXQoKSBsb2NhbGUhOiBzdHJpbmc7XG4gICAgQElucHV0KCkgZGF0ZUZvcm1hdHRlcj86IElEYXRlRm9ybWF0dGVyO1xuICAgIEBJbnB1dCgpIGRpciA9ICcnO1xuICAgIEBJbnB1dCgpIHNjcm9sbFRvSG91ciA9IDA7XG4gICAgQElucHV0KCkgcHJlc2VydmVTY3JvbGxQb3NpdGlvbj86IGJvb2xlYW47XG4gICAgQElucHV0KCkgbG9ja1N3aXBlVG9QcmV2PzogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBsb2NrU3dpcGVUb05leHQ/OiBib29sZWFuO1xuICAgIEBJbnB1dCgpIGxvY2tTd2lwZXM/OiBib29sZWFuO1xuICAgIEBJbnB1dCgpIHN0YXJ0SG91ciE6IG51bWJlcjtcbiAgICBASW5wdXQoKSBlbmRIb3VyITogbnVtYmVyO1xuICAgIEBJbnB1dCgpIHNsaWRlck9wdGlvbnM6IGFueTtcbiAgICBASW5wdXQoKSBob3VyU2VnbWVudHMhOiBudW1iZXI7XG5cbiAgICBAT3V0cHV0KCkgb25SYW5nZUNoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPElSYW5nZT4oKTtcbiAgICBAT3V0cHV0KCkgb25FdmVudFNlbGVjdGVkID0gbmV3IEV2ZW50RW1pdHRlcjxJRXZlbnQ+KCk7XG4gICAgQE91dHB1dCgpIG9uVGltZVNlbGVjdGVkID0gbmV3IEV2ZW50RW1pdHRlcjxJVGltZVNlbGVjdGVkPigpO1xuICAgIEBPdXRwdXQoKSBvblRpdGxlQ2hhbmdlZCA9IG5ldyBFdmVudEVtaXR0ZXI8c3RyaW5nPih0cnVlKTtcblxuICAgIHB1YmxpYyB2aWV3czogSURheVZpZXdbXSA9IFtdO1xuICAgIHB1YmxpYyBjdXJyZW50Vmlld0luZGV4ID0gMDtcbiAgICBwdWJsaWMgZGlyZWN0aW9uID0gMDtcbiAgICBwdWJsaWMgbW9kZTogQ2FsZW5kYXJNb2RlID0gJ2RheSc7XG4gICAgcHVibGljIHJhbmdlITogSVJhbmdlO1xuXG4gICAgcHJpdmF0ZSBpbml0ZWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGNhbGxiYWNrT25Jbml0ID0gdHJ1ZTtcbiAgICBwcml2YXRlIGN1cnJlbnREYXRlQ2hhbmdlZEZyb21QYXJlbnRTdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG4gICAgcHJpdmF0ZSBldmVudFNvdXJjZUNoYW5nZWRTdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG4gICAgcHJpdmF0ZSBzbGlkZUNoYW5nZWRTdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG4gICAgcHJpdmF0ZSBzbGlkZVVwZGF0ZWRTdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG5cbiAgICBwdWJsaWMgaG91ckNvbHVtbkxhYmVscyE6IHN0cmluZ1tdO1xuICAgIHB1YmxpYyBpbml0U2Nyb2xsUG9zaXRpb24hOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBmb3JtYXRUaXRsZSE6IChkYXRlOiBEYXRlKSA9PiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBmb3JtYXRIb3VyQ29sdW1uTGFiZWwhOiAoZGF0ZTogRGF0ZSkgPT4gc3RyaW5nO1xuICAgIHByaXZhdGUgaG91clJhbmdlITogbnVtYmVyO1xuXG4gICAgc3RhdGljIGNyZWF0ZURhdGVPYmplY3RzKHN0YXJ0VGltZTogRGF0ZSwgc3RhcnRIb3VyOiBudW1iZXIsIGVuZEhvdXI6IG51bWJlciwgdGltZUludGVydmFsOiBudW1iZXIpOiBJRGF5Vmlld1Jvd1tdIHtcbiAgICAgICAgY29uc3Qgcm93czogSURheVZpZXdSb3dbXSA9IFtdLFxuICAgICAgICAgICAgY3VycmVudEhvdXIgPSAwLFxuICAgICAgICAgICAgY3VycmVudERhdGUgPSBzdGFydFRpbWUuZ2V0RGF0ZSgpO1xuICAgICAgICBsZXQgdGltZTogRGF0ZSxcbiAgICAgICAgICAgIGhvdXJTdGVwLFxuICAgICAgICAgICAgbWluU3RlcDtcblxuICAgICAgICBpZiAodGltZUludGVydmFsIDwgMSkge1xuICAgICAgICAgICAgaG91clN0ZXAgPSBNYXRoLmZsb29yKDEgLyB0aW1lSW50ZXJ2YWwpO1xuICAgICAgICAgICAgbWluU3RlcCA9IDYwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaG91clN0ZXAgPSAxO1xuICAgICAgICAgICAgbWluU3RlcCA9IE1hdGguZmxvb3IoNjAgLyB0aW1lSW50ZXJ2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaG91ciA9IHN0YXJ0SG91cjsgaG91ciA8IGVuZEhvdXI7IGhvdXIgKz0gaG91clN0ZXApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGludGVydmFsID0gMDsgaW50ZXJ2YWwgPCA2MDsgaW50ZXJ2YWwgKz0gbWluU3RlcCkge1xuICAgICAgICAgICAgICAgIHRpbWUgPSBuZXcgRGF0ZShzdGFydFRpbWUuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgICAgICB0aW1lLnNldEhvdXJzKGN1cnJlbnRIb3VyICsgaG91ciwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHRpbWUuc2V0RGF0ZShjdXJyZW50RGF0ZSk7XG4gICAgICAgICAgICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdGltZSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiBbXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByb3dzO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIGNvbXBhcmVFdmVudEJ5U3RhcnRPZmZzZXQoZXZlbnRBOiBJRGlzcGxheUV2ZW50LCBldmVudEI6IElEaXNwbGF5RXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50QS5zdGFydE9mZnNldCAtIGV2ZW50Qi5zdGFydE9mZnNldDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBjYWxjdWxhdGVXaWR0aChvcmRlcmVkRXZlbnRzOiBJRGlzcGxheUV2ZW50W10sIHNpemU6IG51bWJlciwgaG91clBhcnRzOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdG90YWxTaXplID0gc2l6ZSAqIGhvdXJQYXJ0cyxcbiAgICAgICAgICAgIGNlbGxzOiB7IGNhbGN1bGF0ZWQ6IGJvb2xlYW47IGV2ZW50czogSURpc3BsYXlFdmVudFtdOyB9W10gPSBuZXcgQXJyYXkodG90YWxTaXplKTtcblxuICAgICAgICAvLyBzb3J0IGJ5IHBvc2l0aW9uIGluIGRlc2NlbmRpbmcgb3JkZXIsIHRoZSByaWdodCBtb3N0IGNvbHVtbnMgc2hvdWxkIGJlIGNhbGN1bGF0ZWQgZmlyc3RcbiAgICAgICAgb3JkZXJlZEV2ZW50cy5zb3J0KChldmVudEEsIGV2ZW50QikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50Qi5wb3NpdGlvbiAtIGV2ZW50QS5wb3NpdGlvbjtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxTaXplOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNlbGxzW2ldID0ge1xuICAgICAgICAgICAgICAgIGNhbGN1bGF0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGV2ZW50czogW11cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGVuID0gb3JkZXJlZEV2ZW50cy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gb3JkZXJlZEV2ZW50c1tpXTtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IGV2ZW50LnN0YXJ0SW5kZXggKiBob3VyUGFydHMgKyBldmVudC5zdGFydE9mZnNldDtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGV2ZW50LmVuZEluZGV4ICogaG91clBhcnRzIC0gZXZlbnQuZW5kT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgY2VsbHNbaW5kZXhdLmV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGxlbikge1xuICAgICAgICAgICAgbGV0IGV2ZW50OklEaXNwbGF5RXZlbnR8dW5kZWZpbmVkID0gb3JkZXJlZEV2ZW50c1tpXTtcbiAgICAgICAgICAgIGlmICghZXZlbnQub3ZlcmxhcE51bWJlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG92ZXJsYXBOdW1iZXIgPSBldmVudC5wb3NpdGlvbiArIDE7XG4gICAgICAgICAgICAgICAgZXZlbnQub3ZlcmxhcE51bWJlciA9IG92ZXJsYXBOdW1iZXI7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRRdWV1ZSA9IFtldmVudF07XG4gICAgICAgICAgICAgICAgd2hpbGUgKGV2ZW50ID0gZXZlbnRRdWV1ZS5zaGlmdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IGV2ZW50LnN0YXJ0SW5kZXggKiBob3VyUGFydHMgKyBldmVudC5zdGFydE9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgZXZlbnQuZW5kSW5kZXggKiBob3VyUGFydHMgLSBldmVudC5lbmRPZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2VsbHNbaW5kZXhdLmNhbGN1bGF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZWxsc1tpbmRleF0uY2FsY3VsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNlbGxzW2luZGV4XS5ldmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZlbnRDb3VudEluQ2VsbCA9IGNlbGxzW2luZGV4XS5ldmVudHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGV2ZW50Q291bnRJbkNlbGw7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEV2ZW50SW5DZWxsID0gY2VsbHNbaW5kZXhdLmV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudEV2ZW50SW5DZWxsLm92ZXJsYXBOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RXZlbnRJbkNlbGwub3ZlcmxhcE51bWJlciA9IG92ZXJsYXBOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRRdWV1ZS5wdXNoKGN1cnJlbnRFdmVudEluQ2VsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSArPSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIGlmICghdGhpcy5zbGlkZXJPcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnNsaWRlck9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNsaWRlck9wdGlvbnMubG9vcCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5ob3VyUmFuZ2UgPSAodGhpcy5lbmRIb3VyIC0gdGhpcy5zdGFydEhvdXIpICogdGhpcy5ob3VyU2VnbWVudHM7XG4gICAgICAgIGlmICh0aGlzLmRhdGVGb3JtYXR0ZXIgJiYgdGhpcy5kYXRlRm9ybWF0dGVyLmZvcm1hdERheVZpZXdUaXRsZSkge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXRUaXRsZSA9IHRoaXMuZGF0ZUZvcm1hdHRlci5mb3JtYXREYXlWaWV3VGl0bGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkYXRlUGlwZSA9IG5ldyBEYXRlUGlwZSh0aGlzLmxvY2FsZSk7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdFRpdGxlID0gZnVuY3Rpb24oZGF0ZTogRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlUGlwZS50cmFuc2Zvcm0oZGF0ZSwgdGhpcy5mb3JtYXREYXlUaXRsZSl8fCcnO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRhdGVGb3JtYXR0ZXIgJiYgdGhpcy5kYXRlRm9ybWF0dGVyLmZvcm1hdERheVZpZXdIb3VyQ29sdW1uKSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdEhvdXJDb2x1bW5MYWJlbCA9IHRoaXMuZGF0ZUZvcm1hdHRlci5mb3JtYXREYXlWaWV3SG91ckNvbHVtbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGVQaXBlID0gbmV3IERhdGVQaXBlKHRoaXMubG9jYWxlKTtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0SG91ckNvbHVtbkxhYmVsID0gZnVuY3Rpb24oZGF0ZTogRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlUGlwZS50cmFuc2Zvcm0oZGF0ZSwgdGhpcy5mb3JtYXRIb3VyQ29sdW1uKXx8Jyc7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoVmlldygpO1xuICAgICAgICB0aGlzLmhvdXJDb2x1bW5MYWJlbHMgPSB0aGlzLmdldEhvdXJDb2x1bW5MYWJlbHMoKTtcblxuICAgICAgICB0aGlzLmluaXRlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tUGFyZW50U3Vic2NyaXB0aW9uID0gdGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudCQuc3Vic2NyaWJlKGN1cnJlbnREYXRlID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5ldmVudFNvdXJjZUNoYW5nZWRTdWJzY3JpcHRpb24gPSB0aGlzLmNhbGVuZGFyU2VydmljZS5ldmVudFNvdXJjZUNoYW5nZWQkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uRGF0YUxvYWRlZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNsaWRlQ2hhbmdlZCQuc3Vic2NyaWJlKGRpcmVjdGlvbiA9PiB7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnNsaWRlTmV4dCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnNsaWRlUHJldigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNsaWRlVXBkYXRlZCQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi51cGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgICAgICBjb25zdCB0aXRsZSA9IHRoaXMuZ2V0VGl0bGUoKTtcbiAgICAgICAgdGhpcy5vblRpdGxlQ2hhbmdlZC5lbWl0KHRpdGxlKTtcblxuICAgICAgICBpZiAodGhpcy5zY3JvbGxUb0hvdXIgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBob3VyQ29sdW1ucyA9IHRoaXMuZWxtLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcignLmRheXZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lcicpLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYWxlbmRhci1ob3VyLWNvbHVtbicpO1xuICAgICAgICAgICAgY29uc3QgbWUgPSB0aGlzO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbWUuaW5pdFNjcm9sbFBvc2l0aW9uID0gaG91ckNvbHVtbnNbbWUuc2Nyb2xsVG9Ib3VyIC0gbWUuc3RhcnRIb3VyXS5vZmZzZXRUb3A7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgICAgIGlmICghdGhpcy5pbml0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGNoYW5nZXNbJ3N0YXJ0SG91ciddIHx8IGNoYW5nZXNbJ2VuZEhvdXInXSkgJiYgKCFjaGFuZ2VzWydzdGFydEhvdXInXS5pc0ZpcnN0Q2hhbmdlKCkgfHwgIWNoYW5nZXNbJ2VuZEhvdXInXS5pc0ZpcnN0Q2hhbmdlKCkpKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdzID0gW107XG4gICAgICAgICAgICB0aGlzLmhvdXJSYW5nZSA9ICh0aGlzLmVuZEhvdXIgLSB0aGlzLnN0YXJ0SG91cikgKiB0aGlzLmhvdXJTZWdtZW50cztcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgICAgIHRoaXMuaG91ckNvbHVtbkxhYmVscyA9IHRoaXMuZ2V0SG91ckNvbHVtbkxhYmVscygpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXZlbnRTb3VyY2VDaGFuZ2UgPSBjaGFuZ2VzWydldmVudFNvdXJjZSddO1xuICAgICAgICBpZiAoZXZlbnRTb3VyY2VDaGFuZ2UgJiYgZXZlbnRTb3VyY2VDaGFuZ2UuY3VycmVudFZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLm9uRGF0YUxvYWRlZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9ja1N3aXBlVG9QcmV2ID0gY2hhbmdlc1snbG9ja1N3aXBlVG9QcmV2J107XG4gICAgICAgIGlmIChsb2NrU3dpcGVUb1ByZXYpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi5hbGxvd1NsaWRlUHJldiA9ICFsb2NrU3dpcGVUb1ByZXYuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9ja1N3aXBlVG9OZXh0ID0gY2hhbmdlc1snbG9ja1N3aXBlVG9OZXh0J107XG4gICAgICAgIGlmIChsb2NrU3dpcGVUb1ByZXYpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi5hbGxvd1NsaWRlTmV4dCA9ICFsb2NrU3dpcGVUb05leHQuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9ja1N3aXBlcyA9IGNoYW5nZXNbJ2xvY2tTd2lwZXMnXTtcbiAgICAgICAgaWYgKGxvY2tTd2lwZXMpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi5hbGxvd1RvdWNoTW92ZSA9ICFsb2NrU3dpcGVzLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tUGFyZW50U3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnREYXRlQ2hhbmdlZEZyb21QYXJlbnRTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudFN1YnNjcmlwdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmV2ZW50U291cmNlQ2hhbmdlZFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5ldmVudFNvdXJjZUNoYW5nZWRTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRTb3VyY2VDaGFuZ2VkU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2xpZGVDaGFuZ2VkU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5zbGlkZUNoYW5nZWRTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zbGlkZVVwZGF0ZWRTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVVcGRhdGVkU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLnNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uU2xpZGVDaGFuZ2VkKCkge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGxiYWNrT25Jbml0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja09uSW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Vmlld0luZGV4ID0gdGhpcy5jdXJyZW50Vmlld0luZGV4O1xuXG4gICAgICAgICAgICBsZXQgY3VycmVudFNsaWRlSW5kZXggPSB0aGlzLnNsaWRlci5zd2lwZXJSZWYuYWN0aXZlSW5kZXg7XG4gICAgICAgICAgICBjdXJyZW50U2xpZGVJbmRleCA9IChjdXJyZW50U2xpZGVJbmRleCArIDIpICUgMztcbiAgICAgICAgICAgIGlmKGlzTmFOKGN1cnJlbnRTbGlkZUluZGV4KSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRTbGlkZUluZGV4ID0gY3VycmVudFZpZXdJbmRleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4IC0gY3VycmVudFZpZXdJbmRleCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRTbGlkZUluZGV4ID09PSAwICYmIGN1cnJlbnRWaWV3SW5kZXggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi5zbGlkZVRvKDEsIDAsIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFZpZXdJbmRleCAtIGN1cnJlbnRTbGlkZUluZGV4ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gLTE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRTbGlkZUluZGV4ID09PSAyICYmIGN1cnJlbnRWaWV3SW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAtMTtcbiAgICAgICAgICAgICAgICB0aGlzLnNsaWRlci5zd2lwZXJSZWYuc2xpZGVUbygzLCAwLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRWaWV3SW5kZXggPSBjdXJyZW50U2xpZGVJbmRleDtcbiAgICAgICAgICAgIHRoaXMubW92ZShkaXJlY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBtb3ZlKGRpcmVjdGlvbjogbnVtYmVyKSB7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICBjb25zdCBhZGphY2VudERhdGUgPSB0aGlzLmNhbGVuZGFyU2VydmljZS5nZXRBZGphY2VudENhbGVuZGFyRGF0ZSh0aGlzLm1vZGUsIGRpcmVjdGlvbik7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNldEN1cnJlbnREYXRlKGFkamFjZW50RGF0ZSk7XG4gICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSAwO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0SG91ckNvbHVtbkxhYmVscygpOiBzdHJpbmdbXSB7XG4gICAgICAgIGNvbnN0IGhvdXJDb2x1bW5MYWJlbHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAobGV0IGhvdXIgPSAwLCBsZW5ndGggPSB0aGlzLnZpZXdzWzBdLnJvd3MubGVuZ3RoOyBob3VyIDwgbGVuZ3RoOyBob3VyICs9IDEpIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBlZGdlIGNhc2UgZm9yIERTVFxuICAgICAgICAgICAgaWYgKGhvdXIgPT09IDAgJiYgdGhpcy52aWV3c1swXS5yb3dzW2hvdXJdLnRpbWUuZ2V0SG91cnMoKSAhPT0gdGhpcy5zdGFydEhvdXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lID0gbmV3IERhdGUodGhpcy52aWV3c1swXS5yb3dzW2hvdXJdLnRpbWUpO1xuICAgICAgICAgICAgICAgIHRpbWUuc2V0RGF0ZSh0aW1lLmdldERhdGUoKSArIDEpO1xuICAgICAgICAgICAgICAgIHRpbWUuc2V0SG91cnModGhpcy5zdGFydEhvdXIpO1xuICAgICAgICAgICAgICAgIGhvdXJDb2x1bW5MYWJlbHMucHVzaCh0aGlzLmZvcm1hdEhvdXJDb2x1bW5MYWJlbCh0aW1lKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhvdXJDb2x1bW5MYWJlbHMucHVzaCh0aGlzLmZvcm1hdEhvdXJDb2x1bW5MYWJlbCh0aGlzLnZpZXdzWzBdLnJvd3NbaG91cl0udGltZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob3VyQ29sdW1uTGFiZWxzO1xuICAgIH1cblxuICAgIGdldFZpZXdEYXRhKHN0YXJ0VGltZTogRGF0ZSk6IElEYXlWaWV3IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvd3M6IERheVZpZXdDb21wb25lbnQuY3JlYXRlRGF0ZU9iamVjdHMoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0SG91ciwgdGhpcy5lbmRIb3VyLCB0aGlzLmhvdXJTZWdtZW50cyksXG4gICAgICAgICAgICBhbGxEYXlFdmVudHM6IFtdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZ2V0UmFuZ2UoY3VycmVudERhdGU6IERhdGUpOiBJUmFuZ2Uge1xuICAgICAgICBjb25zdCB5ZWFyID0gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICAgICAgIG1vbnRoID0gY3VycmVudERhdGUuZ2V0TW9udGgoKSxcbiAgICAgICAgICAgIGRhdGUgPSBjdXJyZW50RGF0ZS5nZXREYXRlKCksXG4gICAgICAgICAgICBzdGFydFRpbWUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF0ZSwgMTIsIDAsIDApLFxuICAgICAgICAgICAgZW5kVGltZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXRlICsgMSwgMTIsIDAsIDApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgICAgICBlbmRUaW1lXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25EYXRhTG9hZGVkKCkge1xuICAgICAgICBjb25zdCBldmVudFNvdXJjZSA9IHRoaXMuZXZlbnRTb3VyY2UsXG4gICAgICAgICAgICBsZW4gPSBldmVudFNvdXJjZSA/IGV2ZW50U291cmNlLmxlbmd0aCA6IDAsXG4gICAgICAgICAgICBzdGFydFRpbWUgPSB0aGlzLnJhbmdlLnN0YXJ0VGltZSxcbiAgICAgICAgICAgIGVuZFRpbWUgPSB0aGlzLnJhbmdlLmVuZFRpbWUsXG4gICAgICAgICAgICB1dGNTdGFydFRpbWUgPSBEYXRlLlVUQyhzdGFydFRpbWUuZ2V0RnVsbFllYXIoKSwgc3RhcnRUaW1lLmdldE1vbnRoKCksIHN0YXJ0VGltZS5nZXREYXRlKCkpLFxuICAgICAgICAgICAgdXRjRW5kVGltZSA9IERhdGUuVVRDKGVuZFRpbWUuZ2V0RnVsbFllYXIoKSwgZW5kVGltZS5nZXRNb250aCgpLCBlbmRUaW1lLmdldERhdGUoKSksXG4gICAgICAgICAgICBjdXJyZW50Vmlld0luZGV4ID0gdGhpcy5jdXJyZW50Vmlld0luZGV4LFxuICAgICAgICAgICAgcm93cyA9IHRoaXMudmlld3NbY3VycmVudFZpZXdJbmRleF0ucm93cyxcbiAgICAgICAgICAgIGFsbERheUV2ZW50czogSURpc3BsYXlBbGxEYXlFdmVudFtdID0gdGhpcy52aWV3c1tjdXJyZW50Vmlld0luZGV4XS5hbGxEYXlFdmVudHMgPSBbXSxcbiAgICAgICAgICAgIG9uZUhvdXIgPSAzNjAwMDAwLFxuICAgICAgICAgICAgZXBzID0gMC4wMTYsXG4gICAgICAgICAgICByYW5nZVN0YXJ0Um93SW5kZXggPSB0aGlzLnN0YXJ0SG91ciAqIHRoaXMuaG91clNlZ21lbnRzLFxuICAgICAgICAgICAgcmFuZ2VFbmRSb3dJbmRleCA9IHRoaXMuZW5kSG91ciAqIHRoaXMuaG91clNlZ21lbnRzO1xuICAgICAgICBsZXQgbm9ybWFsRXZlbnRJblJhbmdlID0gZmFsc2U7XG5cbiAgICAgICAgZm9yIChsZXQgaG91ciA9IDA7IGhvdXIgPCB0aGlzLmhvdXJSYW5nZTsgaG91ciArPSAxKSB7XG4gICAgICAgICAgICByb3dzW2hvdXJdLmV2ZW50cyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBldmVudFNvdXJjZVtpXTtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50U3RhcnRUaW1lID0gZXZlbnQuc3RhcnRUaW1lO1xuICAgICAgICAgICAgY29uc3QgZXZlbnRFbmRUaW1lID0gZXZlbnQuZW5kVGltZTtcbiAgICAgICAgICAgIGxldCBldmVudFVUQ1N0YXJ0VGltZTogbnVtYmVyLFxuICAgICAgICAgICAgICAgIGV2ZW50VVRDRW5kVGltZTogbnVtYmVyO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQuYWxsRGF5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnRVVENTdGFydFRpbWUgPSBldmVudFN0YXJ0VGltZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgZXZlbnRVVENFbmRUaW1lID0gZXZlbnRFbmRUaW1lLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRVVENTdGFydFRpbWUgPSBEYXRlLlVUQyhldmVudFN0YXJ0VGltZS5nZXRGdWxsWWVhcigpLCBldmVudFN0YXJ0VGltZS5nZXRNb250aCgpLCBldmVudFN0YXJ0VGltZS5nZXREYXRlKCkpO1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDRW5kVGltZSA9IERhdGUuVVRDKGV2ZW50RW5kVGltZS5nZXRGdWxsWWVhcigpLCBldmVudEVuZFRpbWUuZ2V0TW9udGgoKSwgZXZlbnRFbmRUaW1lLmdldERhdGUoKSArIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnRVVENFbmRUaW1lIDw9IHV0Y1N0YXJ0VGltZSB8fCBldmVudFVUQ1N0YXJ0VGltZSA+PSB1dGNFbmRUaW1lIHx8IGV2ZW50U3RhcnRUaW1lID49IGV2ZW50RW5kVGltZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQuYWxsRGF5KSB7XG4gICAgICAgICAgICAgICAgYWxsRGF5RXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub3JtYWxFdmVudEluUmFuZ2UgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgbGV0IHRpbWVEaWZmZXJlbmNlU3RhcnQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRVVENTdGFydFRpbWUgPCB1dGNTdGFydFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VTdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VTdGFydCA9IChldmVudFN0YXJ0VGltZS5nZXRIb3VycygpICsgZXZlbnRTdGFydFRpbWUuZ2V0TWludXRlcygpIC8gNjApICogdGhpcy5ob3VyU2VnbWVudHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHRpbWVEaWZmZXJlbmNlRW5kOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50VVRDRW5kVGltZSA+IHV0Y0VuZFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VFbmQgPSAodXRjRW5kVGltZSAtIHV0Y1N0YXJ0VGltZSkgLyBvbmVIb3VyICogdGhpcy5ob3VyU2VnbWVudHM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VFbmQgPSAoZXZlbnRFbmRUaW1lLmdldEhvdXJzKCkgKyBldmVudEVuZFRpbWUuZ2V0TWludXRlcygpIC8gNjApICogdGhpcy5ob3VyU2VnbWVudHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0SW5kZXggPSBNYXRoLmZsb29yKHRpbWVEaWZmZXJlbmNlU3RhcnQpO1xuICAgICAgICAgICAgICAgIGxldCBlbmRJbmRleCA9IE1hdGguY2VpbCh0aW1lRGlmZmVyZW5jZUVuZCAtIGVwcyk7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0T2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgZW5kT2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ob3VyUGFydHMgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0SW5kZXggPCByYW5nZVN0YXJ0Um93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2Zmc2V0ID0gTWF0aC5mbG9vcigodGltZURpZmZlcmVuY2VTdGFydCAtIHN0YXJ0SW5kZXgpICogdGhpcy5ob3VyUGFydHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRJbmRleCA+IHJhbmdlRW5kUm93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZE9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRPZmZzZXQgPSBNYXRoLmZsb29yKChlbmRJbmRleCAtIHRpbWVEaWZmZXJlbmNlRW5kKSAqIHRoaXMuaG91clBhcnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdGFydEluZGV4IDwgcmFuZ2VTdGFydFJvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXggLT0gcmFuZ2VTdGFydFJvd0luZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZW5kSW5kZXggPiByYW5nZUVuZFJvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZEluZGV4ID0gcmFuZ2VFbmRSb3dJbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZW5kSW5kZXggLT0gcmFuZ2VTdGFydFJvd0luZGV4O1xuXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5RXZlbnQ6SURpc3BsYXlFdmVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjowXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGV2ZW50U2V0ID0gcm93c1tzdGFydEluZGV4XS5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudFNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRTZXQucHVzaChkaXNwbGF5RXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRTZXQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50U2V0LnB1c2goZGlzcGxheUV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd3Nbc3RhcnRJbmRleF0uZXZlbnRzID0gZXZlbnRTZXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsRXZlbnRJblJhbmdlKSB7XG4gICAgICAgICAgICBsZXQgb3JkZXJlZEV2ZW50czogSURpc3BsYXlFdmVudFtdID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBob3VyID0gMDsgaG91ciA8IHRoaXMuaG91clJhbmdlOyBob3VyICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAocm93c1tob3VyXS5ldmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcm93c1tob3VyXS5ldmVudHMuc29ydChEYXlWaWV3Q29tcG9uZW50LmNvbXBhcmVFdmVudEJ5U3RhcnRPZmZzZXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyZWRFdmVudHMgPSBvcmRlcmVkRXZlbnRzLmNvbmNhdChyb3dzW2hvdXJdLmV2ZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9yZGVyZWRFdmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhY2VFdmVudHMob3JkZXJlZEV2ZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZWZyZXNoVmlldygpIHtcbiAgICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuZ2V0UmFuZ2UodGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGUpO1xuICAgICAgICBpZiAodGhpcy5pbml0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gdGhpcy5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgdGhpcy5vblRpdGxlQ2hhbmdlZC5lbWl0KHRpdGxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnBvcHVsYXRlQWRqYWNlbnRWaWV3cyh0aGlzKTtcbiAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2UucmFuZ2VDaGFuZ2VkKHRoaXMpO1xuICAgIH1cblxuICAgIGdldFRpdGxlKCk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHN0YXJ0aW5nRGF0ZSA9IG5ldyBEYXRlKHRoaXMucmFuZ2Uuc3RhcnRUaW1lLmdldFRpbWUoKSk7XG4gICAgICAgIHN0YXJ0aW5nRGF0ZS5zZXRIb3VycygxMiwgMCwgMCwgMCk7XG4gICAgICAgIHJldHVybiB0aGlzLmZvcm1hdFRpdGxlKHN0YXJ0aW5nRGF0ZSk7XG4gICAgfVxuXG4gICAgc2VsZWN0KHNlbGVjdGVkVGltZTogRGF0ZSwgZXZlbnRzOiBJRGlzcGxheUV2ZW50W10pIHtcbiAgICAgICAgbGV0IGRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLm1hcmtEaXNhYmxlZCkge1xuICAgICAgICAgICAgZGlzYWJsZWQgPSB0aGlzLm1hcmtEaXNhYmxlZChzZWxlY3RlZFRpbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vblRpbWVTZWxlY3RlZC5lbWl0KHtcbiAgICAgICAgICAgIHNlbGVjdGVkVGltZSxcbiAgICAgICAgICAgIGV2ZW50czogZXZlbnRzLm1hcChlID0+IGUuZXZlbnQpLFxuICAgICAgICAgICAgZGlzYWJsZWRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcGxhY2VFdmVudHMob3JkZXJlZEV2ZW50czogSURpc3BsYXlFdmVudFtdKSB7XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUG9zaXRpb24ob3JkZXJlZEV2ZW50cyk7XG4gICAgICAgIERheVZpZXdDb21wb25lbnQuY2FsY3VsYXRlV2lkdGgob3JkZXJlZEV2ZW50cywgdGhpcy5ob3VyUmFuZ2UsIHRoaXMuaG91clBhcnRzKTtcbiAgICB9XG5cbiAgICBwbGFjZUFsbERheUV2ZW50cyhvcmRlcmVkRXZlbnRzOiBJRGlzcGxheUV2ZW50W10pIHtcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVQb3NpdGlvbihvcmRlcmVkRXZlbnRzKTtcbiAgICB9XG5cbiAgICBvdmVybGFwKGV2ZW50MTogSURpc3BsYXlFdmVudCwgZXZlbnQyOiBJRGlzcGxheUV2ZW50KTogYm9vbGVhbiB7XG4gICAgICAgIGxldCBlYXJseUV2ZW50ID0gZXZlbnQxLFxuICAgICAgICAgICAgbGF0ZUV2ZW50ID0gZXZlbnQyO1xuICAgICAgICBpZiAoZXZlbnQxLnN0YXJ0SW5kZXggPiBldmVudDIuc3RhcnRJbmRleCB8fCAoZXZlbnQxLnN0YXJ0SW5kZXggPT09IGV2ZW50Mi5zdGFydEluZGV4ICYmIGV2ZW50MS5zdGFydE9mZnNldCA+IGV2ZW50Mi5zdGFydE9mZnNldCkpIHtcbiAgICAgICAgICAgIGVhcmx5RXZlbnQgPSBldmVudDI7XG4gICAgICAgICAgICBsYXRlRXZlbnQgPSBldmVudDE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWFybHlFdmVudC5lbmRJbmRleCA8PSBsYXRlRXZlbnQuc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEoZWFybHlFdmVudC5lbmRJbmRleCAtIGxhdGVFdmVudC5zdGFydEluZGV4ID09PSAxICYmIGVhcmx5RXZlbnQuZW5kT2Zmc2V0ICsgbGF0ZUV2ZW50LnN0YXJ0T2Zmc2V0ID49IHRoaXMuaG91clBhcnRzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhbGN1bGF0ZVBvc2l0aW9uKGV2ZW50czogSURpc3BsYXlFdmVudFtdKSB7XG4gICAgICAgIGNvbnN0IGxlbiA9IGV2ZW50cy5sZW5ndGgsXG4gICAgICAgICAgICBpc0ZvcmJpZGRlbjogYm9vbGVhbltdID0gbmV3IEFycmF5KGxlbik7XG4gICAgICAgIGxldCBtYXhDb2x1bW4gPSAwLFxuICAgICAgICAgICAgY29sOiBudW1iZXI7XG5cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICBmb3IgKGNvbCA9IDA7IGNvbCA8IG1heENvbHVtbjsgY29sICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpc0ZvcmJpZGRlbltjb2xdID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGk7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm92ZXJsYXAoZXZlbnRzW2ldLCBldmVudHNbal0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzRm9yYmlkZGVuW2V2ZW50c1tqXS5wb3NpdGlvbl0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29sID0gMDsgY29sIDwgbWF4Q29sdW1uOyBjb2wgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICghaXNGb3JiaWRkZW5bY29sXSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29sIDwgbWF4Q29sdW1uKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW2ldLnBvc2l0aW9uID0gY29sO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBldmVudHNbaV0ucG9zaXRpb24gPSBtYXhDb2x1bW4rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpciA9PT0gJ3J0bCcpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBldmVudHNbaV0ucG9zaXRpb24gPSBtYXhDb2x1bW4gLSAxIC0gZXZlbnRzW2ldLnBvc2l0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXZlbnRTZWxlY3RlZChldmVudDogSUV2ZW50KSB7XG4gICAgICAgIHRoaXMub25FdmVudFNlbGVjdGVkLmVtaXQoZXZlbnQpO1xuICAgIH1cblxuICAgIHNldFNjcm9sbFBvc2l0aW9uKHNjcm9sbFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5pbml0U2Nyb2xsUG9zaXRpb24gPSBzY3JvbGxQb3NpdGlvbjtcbiAgICB9XG59XG4iXX0=