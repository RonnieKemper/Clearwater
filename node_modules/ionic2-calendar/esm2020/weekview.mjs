import { DatePipe } from '@angular/common';
import { Component, HostBinding, Input, Output, EventEmitter, ViewEncapsulation, ViewChild } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "./calendar.service";
import * as i2 from "@angular/common";
import * as i3 from "swiper/angular";
import * as i4 from "./init-position-scroll";
export class WeekViewComponent {
    constructor(calendarService, elm, zone) {
        this.calendarService = calendarService;
        this.elm = elm;
        this.zone = zone;
        this.class = true;
        this.autoSelect = true;
        this.dir = '';
        this.scrollToHour = 0;
        this.onRangeChanged = new EventEmitter();
        this.onEventSelected = new EventEmitter();
        this.onTimeSelected = new EventEmitter();
        this.onDayHeaderSelected = new EventEmitter();
        this.onTitleChanged = new EventEmitter();
        this.views = [];
        this.currentViewIndex = 0;
        this.direction = 0;
        this.mode = 'week';
        this.inited = false;
        this.callbackOnInit = true;
    }
    static createDateObjects(startTime, startHour, endHour, timeInterval) {
        const times = [], currentHour = 0, currentDate = startTime.getDate();
        let hourStep, minStep;
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
                const row = [];
                for (let day = 0; day < 7; day += 1) {
                    const time = new Date(startTime.getTime());
                    time.setHours(currentHour + hour, interval);
                    time.setDate(currentDate + day);
                    row.push({
                        events: [],
                        time
                    });
                }
                times.push(row);
            }
        }
        return times;
    }
    static getDates(startTime, n) {
        const dates = new Array(n), current = new Date(startTime.getTime());
        let i = 0;
        while (i < n) {
            dates[i++] = {
                date: new Date(current.getTime()),
                events: [],
                dayHeader: ''
            };
            current.setDate(current.getDate() + 1);
        }
        return dates;
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
        if (this.dateFormatter && this.dateFormatter.formatWeekViewDayHeader) {
            this.formatDayHeader = this.dateFormatter.formatWeekViewDayHeader;
        }
        else {
            const datePipe = new DatePipe(this.locale);
            this.formatDayHeader = function (date) {
                return datePipe.transform(date, this.formatWeekViewDayHeader) || '';
            };
        }
        if (this.dateFormatter && this.dateFormatter.formatWeekViewTitle) {
            this.formatTitle = this.dateFormatter.formatWeekViewTitle;
        }
        else {
            const datePipe = new DatePipe(this.locale);
            this.formatTitle = function (date) {
                return datePipe.transform(date, this.formatWeekTitle) || '';
            };
        }
        if (this.dateFormatter && this.dateFormatter.formatWeekViewHourColumn) {
            this.formatHourColumnLabel = this.dateFormatter.formatWeekViewHourColumn;
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
            const hourColumns = this.elm.nativeElement.querySelector('.weekview-normal-event-container').querySelectorAll('.calendar-hour-column');
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
            const currentViewIndex = this.currentViewIndex;
            let direction = 0;
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
        const adjacent = this.calendarService.getAdjacentCalendarDate(this.mode, direction);
        this.calendarService.setCurrentDate(adjacent);
        this.refreshView();
        this.direction = 0;
    }
    getHourColumnLabels() {
        const hourColumnLabels = [];
        for (let hour = 0, length = this.views[0].rows.length; hour < length; hour += 1) {
            // handle edge case for DST
            if (hour === 0 && this.views[0].rows[hour][0].time.getHours() !== this.startHour) {
                const time = new Date(this.views[0].rows[hour][0].time);
                time.setDate(time.getDate() + 1);
                time.setHours(this.startHour);
                hourColumnLabels.push(this.formatHourColumnLabel(time));
            }
            else {
                hourColumnLabels.push(this.formatHourColumnLabel(this.views[0].rows[hour][0].time));
            }
        }
        return hourColumnLabels;
    }
    getViewData(startTime) {
        const dates = WeekViewComponent.getDates(startTime, 7);
        for (let i = 0; i < 7; i++) {
            dates[i].dayHeader = this.formatDayHeader(dates[i].date);
        }
        return {
            rows: WeekViewComponent.createDateObjects(startTime, this.startHour, this.endHour, this.hourSegments),
            dates
        };
    }
    getRange(currentDate) {
        const year = currentDate.getFullYear(), month = currentDate.getMonth(), date = currentDate.getDate(), day = currentDate.getDay();
        let difference = day - this.startingDayWeek;
        if (difference < 0) {
            difference += 7;
        }
        // set hour to 12 to avoid DST problem
        const firstDayOfWeek = new Date(year, month, date - difference, 12, 0, 0), endTime = new Date(year, month, date - difference + 7, 12, 0, 0);
        return {
            startTime: firstDayOfWeek,
            endTime
        };
    }
    onDataLoaded() {
        const eventSource = this.eventSource, len = eventSource ? eventSource.length : 0, startTime = this.range.startTime, endTime = this.range.endTime, utcStartTime = Date.UTC(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()), utcEndTime = Date.UTC(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()), currentViewIndex = this.currentViewIndex, rows = this.views[currentViewIndex].rows, dates = this.views[currentViewIndex].dates, oneHour = 3600000, oneDay = 86400000, 
        // add allday eps
        eps = 0.016, rangeStartRowIndex = this.startHour * this.hourSegments, rangeEndRowIndex = this.endHour * this.hourSegments, allRows = 24 * this.hourSegments;
        let allDayEventInRange = false, normalEventInRange = false;
        for (let i = 0; i < 7; i += 1) {
            dates[i].events = [];
            dates[i].hasEvent = false;
        }
        for (let day = 0; day < 7; day += 1) {
            for (let hour = 0; hour < this.hourRange; hour += 1) {
                rows[hour][day].events = [];
            }
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
                allDayEventInRange = true;
                let allDayStartIndex;
                if (eventUTCStartTime <= utcStartTime) {
                    allDayStartIndex = 0;
                }
                else {
                    allDayStartIndex = Math.round((eventUTCStartTime - utcStartTime) / oneDay);
                }
                let allDayEndIndex;
                if (eventUTCEndTime >= utcEndTime) {
                    allDayEndIndex = Math.round((utcEndTime - utcStartTime) / oneDay);
                }
                else {
                    allDayEndIndex = Math.round((eventUTCEndTime - utcStartTime) / oneDay);
                }
                const displayAllDayEvent = {
                    event,
                    startIndex: allDayStartIndex,
                    endIndex: allDayEndIndex,
                    startOffset: 0,
                    endOffset: 0,
                    position: 0
                };
                let eventSet = dates[allDayStartIndex].events;
                if (eventSet) {
                    eventSet.push(displayAllDayEvent);
                }
                else {
                    eventSet = [];
                    eventSet.push(displayAllDayEvent);
                    dates[allDayStartIndex].events = eventSet;
                }
                dates[allDayStartIndex].hasEvent = true;
            }
            else {
                normalEventInRange = true;
                let timeDifferenceStart;
                if (eventUTCStartTime < utcStartTime) {
                    timeDifferenceStart = 0;
                }
                else {
                    timeDifferenceStart = (eventUTCStartTime - utcStartTime) / oneHour * this.hourSegments + (eventStartTime.getHours() + eventStartTime.getMinutes() / 60) * this.hourSegments;
                }
                let timeDifferenceEnd;
                if (eventUTCEndTime > utcEndTime) {
                    timeDifferenceEnd = (utcEndTime - utcStartTime) / oneHour * this.hourSegments;
                }
                else {
                    timeDifferenceEnd = (eventUTCEndTime - oneDay - utcStartTime) / oneHour * this.hourSegments + (eventEndTime.getHours() + eventEndTime.getMinutes() / 60) * this.hourSegments;
                }
                const startIndex = Math.floor(timeDifferenceStart), endIndex = Math.ceil(timeDifferenceEnd - eps);
                let startRowIndex = startIndex % allRows, dayIndex = Math.floor(startIndex / allRows), endOfDay = dayIndex * allRows, startOffset = 0, endOffset = 0;
                if (this.hourParts !== 1) {
                    if (startRowIndex < rangeStartRowIndex) {
                        startOffset = 0;
                    }
                    else {
                        startOffset = Math.floor((timeDifferenceStart - startIndex) * this.hourParts);
                    }
                }
                do {
                    endOfDay += allRows;
                    let endRowIndex;
                    if (endOfDay < endIndex) {
                        endRowIndex = allRows;
                    }
                    else {
                        if (endOfDay === endIndex) {
                            endRowIndex = allRows;
                        }
                        else {
                            endRowIndex = endIndex % allRows;
                        }
                        if (this.hourParts !== 1) {
                            if (endRowIndex > rangeEndRowIndex) {
                                endOffset = 0;
                            }
                            else {
                                endOffset = Math.floor((endIndex - timeDifferenceEnd) * this.hourParts);
                            }
                        }
                    }
                    if (startRowIndex < rangeStartRowIndex) {
                        startRowIndex = 0;
                    }
                    else {
                        startRowIndex -= rangeStartRowIndex;
                    }
                    if (endRowIndex > rangeEndRowIndex) {
                        endRowIndex = rangeEndRowIndex;
                    }
                    endRowIndex -= rangeStartRowIndex;
                    if (startRowIndex < endRowIndex) {
                        const displayEvent = {
                            event,
                            startIndex: startRowIndex,
                            endIndex: endRowIndex,
                            startOffset,
                            endOffset,
                            position: 0
                        };
                        let eventSet = rows[startRowIndex][dayIndex].events;
                        if (eventSet) {
                            eventSet.push(displayEvent);
                        }
                        else {
                            eventSet = [];
                            eventSet.push(displayEvent);
                            rows[startRowIndex][dayIndex].events = eventSet;
                        }
                        dates[dayIndex].hasEvent = true;
                    }
                    startRowIndex = 0;
                    startOffset = 0;
                    dayIndex += 1;
                } while (endOfDay < endIndex);
            }
        }
        if (normalEventInRange) {
            for (let day = 0; day < 7; day += 1) {
                let orderedEvents = [];
                for (let hour = 0; hour < this.hourRange; hour += 1) {
                    if (rows[hour][day].events) {
                        rows[hour][day].events.sort(WeekViewComponent.compareEventByStartOffset);
                        orderedEvents = orderedEvents.concat(rows[hour][day].events);
                    }
                }
                if (orderedEvents.length > 0) {
                    this.placeEvents(orderedEvents);
                }
            }
        }
        if (allDayEventInRange) {
            let orderedAllDayEvents = [];
            for (let day = 0; day < 7; day += 1) {
                if (dates[day].events) {
                    orderedAllDayEvents = orderedAllDayEvents.concat(dates[day].events);
                }
            }
            if (orderedAllDayEvents.length > 0) {
                this.placeAllDayEvents(orderedAllDayEvents);
            }
        }
        if (this.autoSelect) {
            let selectedDate;
            for (let r = 0; r < 7; r += 1) {
                if (dates[r].selected) {
                    selectedDate = dates[r];
                    break;
                }
            }
            if (selectedDate) {
                let disabled = false;
                if (this.markDisabled) {
                    disabled = this.markDisabled(selectedDate.date);
                }
                this.onTimeSelected.emit({
                    selectedTime: selectedDate.date,
                    events: selectedDate.events.map(e => e.event),
                    disabled
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
        const firstDayOfWeek = new Date(this.range.startTime.getTime());
        firstDayOfWeek.setHours(12, 0, 0, 0);
        return this.formatTitle(firstDayOfWeek);
    }
    getHighlightClass(date) {
        let className = '';
        if (date.hasEvent) {
            if (className) {
                className += ' ';
            }
            className = 'weekview-with-event';
        }
        if (date.selected) {
            if (className) {
                className += ' ';
            }
            className += 'weekview-selected';
        }
        if (date.current) {
            if (className) {
                className += ' ';
            }
            className += 'weekview-current';
        }
        return className;
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
        WeekViewComponent.calculateWidth(orderedEvents, this.hourRange, this.hourParts);
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
        let maxColumn = 0;
        for (let i = 0; i < len; i += 1) {
            let col;
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
    updateCurrentView(currentViewStartDate, view) {
        const currentCalendarDate = this.calendarService.currentDate, today = new Date(), oneDay = 86400000, selectedDayDifference = Math.round((Date.UTC(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), currentCalendarDate.getDate()) - Date.UTC(currentViewStartDate.getFullYear(), currentViewStartDate.getMonth(), currentViewStartDate.getDate())) / oneDay), currentDayDifference = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(currentViewStartDate.getFullYear(), currentViewStartDate.getMonth(), currentViewStartDate.getDate())) / oneDay);
        for (let r = 0; r < 7; r += 1) {
            view.dates[r].selected = false;
        }
        if (selectedDayDifference >= 0 && selectedDayDifference < 7 && this.autoSelect) {
            view.dates[selectedDayDifference].selected = true;
        }
        if (currentDayDifference >= 0 && currentDayDifference < 7) {
            view.dates[currentDayDifference].current = true;
        }
    }
    daySelected(viewDate) {
        const selectedDate = viewDate.date, dates = this.views[this.currentViewIndex].dates, currentViewStartDate = this.range.startTime, oneDay = 86400000, selectedDayDifference = Math.round((Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) - Date.UTC(currentViewStartDate.getFullYear(), currentViewStartDate.getMonth(), currentViewStartDate.getDate())) / oneDay);
        this.calendarService.setCurrentDate(selectedDate);
        for (let r = 0; r < 7; r += 1) {
            dates[r].selected = false;
        }
        if (selectedDayDifference >= 0 && selectedDayDifference < 7) {
            dates[selectedDayDifference].selected = true;
        }
        let disabled = false;
        if (this.markDisabled) {
            disabled = this.markDisabled(selectedDate);
        }
        this.onDayHeaderSelected.emit({ selectedTime: selectedDate, events: viewDate.events.map(e => e.event), disabled });
    }
    setScrollPosition(scrollPosition) {
        this.initScrollPosition = scrollPosition;
    }
}
WeekViewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: WeekViewComponent, deps: [{ token: i1.CalendarService }, { token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
WeekViewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.1.2", type: WeekViewComponent, selector: "weekview", inputs: { weekviewHeaderTemplate: "weekviewHeaderTemplate", weekviewAllDayEventTemplate: "weekviewAllDayEventTemplate", weekviewNormalEventTemplate: "weekviewNormalEventTemplate", weekviewAllDayEventSectionTemplate: "weekviewAllDayEventSectionTemplate", weekviewNormalEventSectionTemplate: "weekviewNormalEventSectionTemplate", weekviewInactiveAllDayEventSectionTemplate: "weekviewInactiveAllDayEventSectionTemplate", weekviewInactiveNormalEventSectionTemplate: "weekviewInactiveNormalEventSectionTemplate", formatWeekTitle: "formatWeekTitle", formatWeekViewDayHeader: "formatWeekViewDayHeader", formatHourColumn: "formatHourColumn", startingDayWeek: "startingDayWeek", allDayLabel: "allDayLabel", hourParts: "hourParts", eventSource: "eventSource", autoSelect: "autoSelect", markDisabled: "markDisabled", locale: "locale", dateFormatter: "dateFormatter", dir: "dir", scrollToHour: "scrollToHour", preserveScrollPosition: "preserveScrollPosition", lockSwipeToPrev: "lockSwipeToPrev", lockSwipeToNext: "lockSwipeToNext", lockSwipes: "lockSwipes", startHour: "startHour", endHour: "endHour", sliderOptions: "sliderOptions", hourSegments: "hourSegments" }, outputs: { onRangeChanged: "onRangeChanged", onEventSelected: "onEventSelected", onTimeSelected: "onTimeSelected", onDayHeaderSelected: "onDayHeaderSelected", onTitleChanged: "onTitleChanged" }, host: { properties: { "class.weekview": "this.class" } }, viewQueries: [{ propertyName: "slider", first: true, predicate: ["swiper"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
        <swiper #swiper [config]="sliderOptions" [dir]="dir" [allowSlidePrev]="!lockSwipeToPrev" [allowSlideNext]="!lockSwipeToNext" [allowTouchMove]="!lockSwipes" (slideChangeTransitionEnd)="onSlideChanged()"
                    class="slides-container">
            <ng-template swiperSlide class="slide-container">
                <table class="table table-bordered table-fixed weekview-header">
                    <thead>
                    <tr>
                        <th class="calendar-hour-column"></th>
                        <th class="weekview-header text-center" *ngFor="let date of views[0].dates"
                            [ngClass]="getHighlightClass(date)"
                            (click)="daySelected(date)">
                            <ng-template [ngTemplateOutlet]="weekviewHeaderTemplate"
                                         [ngTemplateOutletContext]="{viewDate:date}">
                            </ng-template>
                        </th>
                    </tr>
                    </thead>
                </table>
                <div *ngIf="0===currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[0].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day, eventTemplate:weekviewAllDayEventTemplate}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition"
                                          [emitEvent]="preserveScrollPosition" (onScroll)="setScrollPosition($event)">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[0].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell" tappable
                                    (click)="select(tm.time, tm.events)">
                                    <ng-template [ngTemplateOutlet]="weekviewNormalEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:weekviewNormalEventTemplate}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
                <div *ngIf="0!==currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[0].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[0].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell">
                                    <ng-template [ngTemplateOutlet]="weekviewInactiveNormalEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <table class="table table-bordered table-fixed weekview-header">
                    <thead>
                    <tr>
                        <th class="calendar-hour-column"></th>
                        <th class="weekview-header text-center" *ngFor="let date of views[1].dates"
                            [ngClass]="getHighlightClass(date)"
                            (click)="daySelected(date)">
                            <ng-template [ngTemplateOutlet]="weekviewHeaderTemplate"
                                         [ngTemplateOutletContext]="{viewDate:date}">
                            </ng-template>
                        </th>
                    </tr>
                    </thead>
                </table>
                <div *ngIf="1===currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[1].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day, eventTemplate:weekviewAllDayEventTemplate}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition"
                                          [emitEvent]="preserveScrollPosition" (onScroll)="setScrollPosition($event)">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[1].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell" tappable
                                    (click)="select(tm.time, tm.events)">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:weekviewNormalEventTemplate}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
                <div *ngIf="1!==currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[1].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[1].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <table class="table table-bordered table-fixed weekview-header">
                    <thead>
                    <tr>
                        <th class="calendar-hour-column"></th>
                        <th class="weekview-header text-center" *ngFor="let date of views[2].dates"
                            [ngClass]="getHighlightClass(date)"
                            (click)="daySelected(date)">
                            <ng-template [ngTemplateOutlet]="weekviewHeaderTemplate"
                                         [ngTemplateOutletContext]="{viewDate:date}">
                            </ng-template>
                        </th>
                    </tr>
                    </thead>
                </table>
                <div *ngIf="2===currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[2].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day, eventTemplate:weekviewAllDayEventTemplate}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition"
                                          [emitEvent]="preserveScrollPosition" (onScroll)="setScrollPosition($event)">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[2].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell" tappable
                                    (click)="select(tm.time, tm.events)">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:weekviewNormalEventTemplate}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
                <div *ngIf="2!==currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[2].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[2].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
            </ng-template>
        </swiper>
    `, isInline: true, styles: [".table-fixed{table-layout:fixed}.table{width:100%;max-width:100%;background-color:transparent}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:20px;vertical-align:top}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>thead:first-child>tr:first-child>th,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.calendar-hour-column{width:50px;white-space:nowrap}.calendar-event-wrap{position:relative;width:100%;height:100%}.calendar-event{position:absolute;padding:2px;cursor:pointer;z-index:10000}.calendar-cell{padding:0!important;height:37px}.slides-container{height:100%}.slide-container{display:block!important}.weekview-allday-label{float:left;height:100%;line-height:50px;text-align:center;width:50px;border-left:1px solid #ddd}[dir=rtl] .weekview-allday-label{float:right;border-right:1px solid #ddd}.weekview-allday-content-wrapper{margin-left:50px;overflow:hidden;height:51px}[dir=rtl] .weekview-allday-content-wrapper{margin-left:0;margin-right:50px}.weekview-allday-content-table{min-height:50px}.weekview-allday-content-table td{border-left:1px solid #ddd;border-right:1px solid #ddd}.weekview-header th{overflow:hidden;white-space:nowrap;font-size:14px}.weekview-allday-table{height:50px;position:relative;border-bottom:1px solid #ddd;font-size:14px}.weekview-normal-event-container{margin-top:87px;overflow:hidden;inset:0;position:absolute;font-size:14px}.scroll-content{overflow-y:auto;overflow-x:hidden}::-webkit-scrollbar,*::-webkit-scrollbar{display:none}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle}@media (max-width: 750px){.weekview-allday-label,.calendar-hour-column{width:31px;font-size:12px}.weekview-allday-label{padding-top:4px}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle;line-height:12px}.table>thead>tr>th.weekview-header{padding-left:0;padding-right:0;font-size:12px}.weekview-allday-label{line-height:20px}.weekview-allday-content-wrapper{margin-left:31px}[dir=rtl] .weekview-allday-content-wrapper{margin-left:0;margin-right:31px}}\n"], dependencies: [{ kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: i3.SwiperComponent, selector: "swiper, [swiper]", inputs: ["enabled", "on", "direction", "touchEventsTarget", "initialSlide", "speed", "cssMode", "updateOnWindowResize", "resizeObserver", "nested", "focusableElements", "width", "height", "preventInteractionOnTransition", "userAgent", "url", "edgeSwipeDetection", "edgeSwipeThreshold", "freeMode", "autoHeight", "setWrapperSize", "virtualTranslate", "effect", "breakpoints", "spaceBetween", "slidesPerView", "maxBackfaceHiddenSlides", "grid", "slidesPerGroup", "slidesPerGroupSkip", "centeredSlides", "centeredSlidesBounds", "slidesOffsetBefore", "slidesOffsetAfter", "normalizeSlideIndex", "centerInsufficientSlides", "watchOverflow", "roundLengths", "touchRatio", "touchAngle", "simulateTouch", "shortSwipes", "longSwipes", "longSwipesRatio", "longSwipesMs", "followFinger", "allowTouchMove", "threshold", "touchMoveStopPropagation", "touchStartPreventDefault", "touchStartForcePreventDefault", "touchReleaseOnEdges", "uniqueNavElements", "resistance", "resistanceRatio", "watchSlidesProgress", "grabCursor", "preventClicks", "preventClicksPropagation", "slideToClickedSlide", "preloadImages", "updateOnImagesReady", "loop", "loopAdditionalSlides", "loopedSlides", "loopedSlidesLimit", "loopFillGroupWithBlank", "loopPreventsSlide", "rewind", "allowSlidePrev", "allowSlideNext", "swipeHandler", "noSwiping", "noSwipingClass", "noSwipingSelector", "passiveListeners", "containerModifierClass", "slideClass", "slideBlankClass", "slideActiveClass", "slideDuplicateActiveClass", "slideVisibleClass", "slideDuplicateClass", "slideNextClass", "slideDuplicateNextClass", "slidePrevClass", "slideDuplicatePrevClass", "wrapperClass", "runCallbacksOnInit", "observeParents", "observeSlideChildren", "a11y", "autoplay", "controller", "coverflowEffect", "cubeEffect", "fadeEffect", "flipEffect", "creativeEffect", "cardsEffect", "hashNavigation", "history", "keyboard", "lazy", "mousewheel", "parallax", "thumbs", "zoom", "slidesPerGroupAuto", "class", "id", "navigation", "pagination", "scrollbar", "virtual", "config"], outputs: ["_beforeBreakpoint", "_containerClasses", "_slideClass", "_swiper", "activeIndexChange", "afterInit", "autoplay", "autoplayStart", "autoplayStop", "autoplayPause", "autoplayResume", "beforeDestroy", "beforeInit", "beforeLoopFix", "beforeResize", "beforeSlideChangeStart", "beforeTransitionStart", "breakpoint", "changeDirection", "click", "doubleTap", "doubleClick", "destroy", "fromEdge", "hashChange", "hashSet", "imagesReady", "init", "keyPress", "lazyImageLoad", "lazyImageReady", "loopFix", "momentumBounce", "navigationHide", "navigationShow", "navigationPrev", "navigationNext", "observerUpdate", "orientationchange", "paginationHide", "paginationRender", "paginationShow", "paginationUpdate", "progress", "reachBeginning", "reachEnd", "realIndexChange", "resize", "scroll", "scrollbarDragEnd", "scrollbarDragMove", "scrollbarDragStart", "setTransition", "setTranslate", "slideChange", "slideChangeTransitionEnd", "slideChangeTransitionStart", "slideNextTransitionEnd", "slideNextTransitionStart", "slidePrevTransitionEnd", "slidePrevTransitionStart", "slideResetTransitionStart", "slideResetTransitionEnd", "sliderMove", "sliderFirstMove", "slidesLengthChange", "slidesGridLengthChange", "snapGridLengthChange", "snapIndexChange", "tap", "toEdge", "touchEnd", "touchMove", "touchMoveOpposite", "touchStart", "transitionEnd", "transitionStart", "update", "zoomChange", "swiper", "lock", "unlock"] }, { kind: "directive", type: i3.SwiperSlideDirective, selector: "ng-template[swiperSlide]", inputs: ["virtualIndex", "class", "ngClass", "data-swiper-autoplay", "zoom"] }, { kind: "component", type: i4.initPositionScrollComponent, selector: "init-position-scroll", inputs: ["initPosition", "emitEvent"], outputs: ["onScroll"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: WeekViewComponent, decorators: [{
            type: Component,
            args: [{ selector: 'weekview', template: `
        <swiper #swiper [config]="sliderOptions" [dir]="dir" [allowSlidePrev]="!lockSwipeToPrev" [allowSlideNext]="!lockSwipeToNext" [allowTouchMove]="!lockSwipes" (slideChangeTransitionEnd)="onSlideChanged()"
                    class="slides-container">
            <ng-template swiperSlide class="slide-container">
                <table class="table table-bordered table-fixed weekview-header">
                    <thead>
                    <tr>
                        <th class="calendar-hour-column"></th>
                        <th class="weekview-header text-center" *ngFor="let date of views[0].dates"
                            [ngClass]="getHighlightClass(date)"
                            (click)="daySelected(date)">
                            <ng-template [ngTemplateOutlet]="weekviewHeaderTemplate"
                                         [ngTemplateOutletContext]="{viewDate:date}">
                            </ng-template>
                        </th>
                    </tr>
                    </thead>
                </table>
                <div *ngIf="0===currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[0].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day, eventTemplate:weekviewAllDayEventTemplate}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition"
                                          [emitEvent]="preserveScrollPosition" (onScroll)="setScrollPosition($event)">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[0].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell" tappable
                                    (click)="select(tm.time, tm.events)">
                                    <ng-template [ngTemplateOutlet]="weekviewNormalEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:weekviewNormalEventTemplate}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
                <div *ngIf="0!==currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[0].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[0].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell">
                                    <ng-template [ngTemplateOutlet]="weekviewInactiveNormalEventSectionTemplate"
                                                 [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                    </ng-template>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <table class="table table-bordered table-fixed weekview-header">
                    <thead>
                    <tr>
                        <th class="calendar-hour-column"></th>
                        <th class="weekview-header text-center" *ngFor="let date of views[1].dates"
                            [ngClass]="getHighlightClass(date)"
                            (click)="daySelected(date)">
                            <ng-template [ngTemplateOutlet]="weekviewHeaderTemplate"
                                         [ngTemplateOutletContext]="{viewDate:date}">
                            </ng-template>
                        </th>
                    </tr>
                    </thead>
                </table>
                <div *ngIf="1===currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[1].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day, eventTemplate:weekviewAllDayEventTemplate}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition"
                                          [emitEvent]="preserveScrollPosition" (onScroll)="setScrollPosition($event)">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[1].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell" tappable
                                    (click)="select(tm.time, tm.events)">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:weekviewNormalEventTemplate}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
                <div *ngIf="1!==currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[1].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[1].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
            </ng-template>
            <ng-template swiperSlide class="slide-container">
                <table class="table table-bordered table-fixed weekview-header">
                    <thead>
                    <tr>
                        <th class="calendar-hour-column"></th>
                        <th class="weekview-header text-center" *ngFor="let date of views[2].dates"
                            [ngClass]="getHighlightClass(date)"
                            (click)="daySelected(date)">
                            <ng-template [ngTemplateOutlet]="weekviewHeaderTemplate"
                                         [ngTemplateOutletContext]="{viewDate:date}">
                            </ng-template>
                        </th>
                    </tr>
                    </thead>
                </table>
                <div *ngIf="2===currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[2].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day, eventTemplate:weekviewAllDayEventTemplate}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition"
                                          [emitEvent]="preserveScrollPosition" (onScroll)="setScrollPosition($event)">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[2].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell" tappable
                                    (click)="select(tm.time, tm.events)">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts, eventTemplate:weekviewNormalEventTemplate}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
                <div *ngIf="2!==currentViewIndex">
                    <div class="weekview-allday-table">
                        <div class="weekview-allday-label">{{allDayLabel}}</div>
                        <div class="weekview-allday-content-wrapper scroll-content">
                            <table class="table table-fixed weekview-allday-content-table">
                                <tbody>
                                <tr>
                                    <td *ngFor="let day of views[2].dates" class="calendar-cell">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveAllDayEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{day:day}">
                                        </ng-template>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <init-position-scroll class="weekview-normal-event-container" [initPosition]="initScrollPosition">
                        <table class="table table-bordered table-fixed weekview-normal-event-table">
                            <tbody>
                            <tr *ngFor="let row of views[2].rows; let i = index">
                                <td class="calendar-hour-column text-center">
                                    {{hourColumnLabels[i]}}
                                </td>
                                <td *ngFor="let tm of row" class="calendar-cell">
                                    <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                                        <ng-template [ngTemplateOutlet]="weekviewInactiveNormalEventSectionTemplate"
                                                     [ngTemplateOutletContext]="{tm:tm, hourParts: hourParts}">
                                        </ng-template>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </init-position-scroll>
                </div>
            </ng-template>
        </swiper>
    `, encapsulation: ViewEncapsulation.None, styles: [".table-fixed{table-layout:fixed}.table{width:100%;max-width:100%;background-color:transparent}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:20px;vertical-align:top}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>thead:first-child>tr:first-child>th,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.calendar-hour-column{width:50px;white-space:nowrap}.calendar-event-wrap{position:relative;width:100%;height:100%}.calendar-event{position:absolute;padding:2px;cursor:pointer;z-index:10000}.calendar-cell{padding:0!important;height:37px}.slides-container{height:100%}.slide-container{display:block!important}.weekview-allday-label{float:left;height:100%;line-height:50px;text-align:center;width:50px;border-left:1px solid #ddd}[dir=rtl] .weekview-allday-label{float:right;border-right:1px solid #ddd}.weekview-allday-content-wrapper{margin-left:50px;overflow:hidden;height:51px}[dir=rtl] .weekview-allday-content-wrapper{margin-left:0;margin-right:50px}.weekview-allday-content-table{min-height:50px}.weekview-allday-content-table td{border-left:1px solid #ddd;border-right:1px solid #ddd}.weekview-header th{overflow:hidden;white-space:nowrap;font-size:14px}.weekview-allday-table{height:50px;position:relative;border-bottom:1px solid #ddd;font-size:14px}.weekview-normal-event-container{margin-top:87px;overflow:hidden;inset:0;position:absolute;font-size:14px}.scroll-content{overflow-y:auto;overflow-x:hidden}::-webkit-scrollbar,*::-webkit-scrollbar{display:none}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle}@media (max-width: 750px){.weekview-allday-label,.calendar-hour-column{width:31px;font-size:12px}.weekview-allday-label{padding-top:4px}.table>tbody>tr>td.calendar-hour-column{padding-left:0;padding-right:0;vertical-align:middle;line-height:12px}.table>thead>tr>th.weekview-header{padding-left:0;padding-right:0;font-size:12px}.weekview-allday-label{line-height:20px}.weekview-allday-content-wrapper{margin-left:31px}[dir=rtl] .weekview-allday-content-wrapper{margin-left:0;margin-right:31px}}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CalendarService }, { type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { class: [{
                type: HostBinding,
                args: ['class.weekview']
            }], slider: [{
                type: ViewChild,
                args: ['swiper', { static: false }]
            }], weekviewHeaderTemplate: [{
                type: Input
            }], weekviewAllDayEventTemplate: [{
                type: Input
            }], weekviewNormalEventTemplate: [{
                type: Input
            }], weekviewAllDayEventSectionTemplate: [{
                type: Input
            }], weekviewNormalEventSectionTemplate: [{
                type: Input
            }], weekviewInactiveAllDayEventSectionTemplate: [{
                type: Input
            }], weekviewInactiveNormalEventSectionTemplate: [{
                type: Input
            }], formatWeekTitle: [{
                type: Input
            }], formatWeekViewDayHeader: [{
                type: Input
            }], formatHourColumn: [{
                type: Input
            }], startingDayWeek: [{
                type: Input
            }], allDayLabel: [{
                type: Input
            }], hourParts: [{
                type: Input
            }], eventSource: [{
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
            }], onDayHeaderSelected: [{
                type: Output
            }], onTitleChanged: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vla3ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvd2Vla3ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDSCxTQUFTLEVBR1QsV0FBVyxFQUNYLEtBQUssRUFDTCxNQUFNLEVBQ04sWUFBWSxFQUVaLGlCQUFpQixFQUdqQixTQUFTLEVBSVosTUFBTSxlQUFlLENBQUM7Ozs7OztBQXVldkIsTUFBTSxPQUFPLGlCQUFpQjtJQUUxQixZQUFvQixlQUFnQyxFQUFVLEdBQWUsRUFBVSxJQUFZO1FBQS9FLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUFVLFFBQUcsR0FBSCxHQUFHLENBQVk7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBR3BFLFVBQUssR0FBRyxJQUFJLENBQUM7UUFrQm5DLGVBQVUsR0FBRyxJQUFJLENBQUM7UUFJbEIsUUFBRyxHQUFHLEVBQUUsQ0FBQztRQUNULGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1FBVWhCLG1CQUFjLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUM1QyxvQkFBZSxHQUFHLElBQUksWUFBWSxFQUFVLENBQUM7UUFDN0MsbUJBQWMsR0FBRyxJQUFJLFlBQVksRUFBaUIsQ0FBQztRQUNuRCx3QkFBbUIsR0FBRyxJQUFJLFlBQVksRUFBaUIsQ0FBQztRQUN4RCxtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFVLENBQUM7UUFFL0MsVUFBSyxHQUFnQixFQUFFLENBQUM7UUFDeEIscUJBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBRXJCLGNBQVMsR0FBRyxDQUFDLENBQUM7UUFDZCxTQUFJLEdBQWlCLE1BQU0sQ0FBQztRQUUzQixXQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ2YsbUJBQWMsR0FBRyxJQUFJLENBQUM7SUFoRDlCLENBQUM7SUE2REQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFNBQWUsRUFB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QUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csR0FBRztzQkFBWCxLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0csc0JBQXNCO3NCQUE5QixLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFFSSxjQUFjO3NCQUF2QixNQUFNO2dCQUNHLGVBQWU7c0JBQXhCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTTtnQkFDRyxtQkFBbUI7c0JBQTVCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RGF0ZVBpcGV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICAgIENvbXBvbmVudCxcbiAgICBPbkluaXQsXG4gICAgT25DaGFuZ2VzLFxuICAgIEhvc3RCaW5kaW5nLFxuICAgIElucHV0LFxuICAgIE91dHB1dCxcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgU2ltcGxlQ2hhbmdlcyxcbiAgICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICBUZW1wbGF0ZVJlZixcbiAgICBFbGVtZW50UmVmLFxuICAgIFZpZXdDaGlsZCxcbiAgICBPbkRlc3Ryb3ksIFxuICAgIEFmdGVyVmlld0luaXQsXG4gICAgTmdab25lXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgU3dpcGVyQ29tcG9uZW50IH0gZnJvbSAnc3dpcGVyL2FuZ3VsYXInO1xuXG5pbXBvcnQgdHlwZSB7XG4gICAgSUNhbGVuZGFyQ29tcG9uZW50LFxuICAgIElEaXNwbGF5RXZlbnQsXG4gICAgSUV2ZW50LFxuICAgIElUaW1lU2VsZWN0ZWQsXG4gICAgSVJhbmdlLFxuICAgIElXZWVrVmlldyxcbiAgICBJV2Vla1ZpZXdSb3csXG4gICAgSVdlZWtWaWV3RGF0ZVJvdyxcbiAgICBDYWxlbmRhck1vZGUsXG4gICAgSURhdGVGb3JtYXR0ZXIsXG4gICAgSURpc3BsYXlXZWVrVmlld0hlYWRlcixcbiAgICBJRGlzcGxheUFsbERheUV2ZW50LFxuICAgIElXZWVrVmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlQ29udGV4dCxcbiAgICBJV2Vla1ZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHRcbn0gZnJvbSAnLi9jYWxlbmRhci5pbnRlcmZhY2UnO1xuaW1wb3J0IHtDYWxlbmRhclNlcnZpY2V9IGZyb20gJy4vY2FsZW5kYXIuc2VydmljZSc7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnd2Vla3ZpZXcnLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxzd2lwZXIgI3N3aXBlciBbY29uZmlnXT1cInNsaWRlck9wdGlvbnNcIiBbZGlyXT1cImRpclwiIFthbGxvd1NsaWRlUHJldl09XCIhbG9ja1N3aXBlVG9QcmV2XCIgW2FsbG93U2xpZGVOZXh0XT1cIiFsb2NrU3dpcGVUb05leHRcIiBbYWxsb3dUb3VjaE1vdmVdPVwiIWxvY2tTd2lwZXNcIiAoc2xpZGVDaGFuZ2VUcmFuc2l0aW9uRW5kKT1cIm9uU2xpZGVDaGFuZ2VkKClcIlxuICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInNsaWRlcy1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBzd2lwZXJTbGlkZSBjbGFzcz1cInNsaWRlLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIHdlZWt2aWV3LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cImNhbGVuZGFyLWhvdXItY29sdW1uXCI+PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cIndlZWt2aWV3LWhlYWRlciB0ZXh0LWNlbnRlclwiICpuZ0Zvcj1cImxldCBkYXRlIG9mIHZpZXdzWzBdLmRhdGVzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRIaWdobGlnaHRDbGFzcyhkYXRlKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNsaWNrKT1cImRheVNlbGVjdGVkKGRhdGUpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3SGVhZGVyVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3ZpZXdEYXRlOmRhdGV9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiMD09PWN1cnJlbnRWaWV3SW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlZWt2aWV3LWFsbGRheS10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlZWt2aWV3LWFsbGRheS1sYWJlbFwiPnt7YWxsRGF5TGFiZWx9fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlZWt2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIgc2Nyb2xsLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1maXhlZCB3ZWVrdmlldy1hbGxkYXktY29udGVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgZGF5IG9mIHZpZXdzWzBdLmRhdGVzXCIgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie2RheTpkYXksIGV2ZW50VGVtcGxhdGU6d2Vla3ZpZXdBbGxEYXlFdmVudFRlbXBsYXRlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxpbml0LXBvc2l0aW9uLXNjcm9sbCBjbGFzcz1cIndlZWt2aWV3LW5vcm1hbC1ldmVudC1jb250YWluZXJcIiBbaW5pdFBvc2l0aW9uXT1cImluaXRTY3JvbGxQb3NpdGlvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbZW1pdEV2ZW50XT1cInByZXNlcnZlU2Nyb2xsUG9zaXRpb25cIiAob25TY3JvbGwpPVwic2V0U2Nyb2xsUG9zaXRpb24oJGV2ZW50KVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWQgdGFibGUtZml4ZWQgd2Vla3ZpZXctbm9ybWFsLWV2ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciAqbmdGb3I9XCJsZXQgcm93IG9mIHZpZXdzWzBdLnJvd3M7IGxldCBpID0gaW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItaG91ci1jb2x1bW4gdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7aG91ckNvbHVtbkxhYmVsc1tpXX19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgdG0gb2Ygcm93XCIgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCIgdGFwcGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGljayk9XCJzZWxlY3QodG0udGltZSwgdG0uZXZlbnRzKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7dG06dG0sIGhvdXJQYXJ0czogaG91clBhcnRzLCBldmVudFRlbXBsYXRlOndlZWt2aWV3Tm9ybWFsRXZlbnRUZW1wbGF0ZX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPC9pbml0LXBvc2l0aW9uLXNjcm9sbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiMCE9PWN1cnJlbnRWaWV3SW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlZWt2aWV3LWFsbGRheS10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlZWt2aWV3LWFsbGRheS1sYWJlbFwiPnt7YWxsRGF5TGFiZWx9fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlZWt2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIgc2Nyb2xsLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1maXhlZCB3ZWVrdmlldy1hbGxkYXktY29udGVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgZGF5IG9mIHZpZXdzWzBdLmRhdGVzXCIgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3SW5hY3RpdmVBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7ZGF5OmRheX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8aW5pdC1wb3NpdGlvbi1zY3JvbGwgY2xhc3M9XCJ3ZWVrdmlldy1ub3JtYWwtZXZlbnQtY29udGFpbmVyXCIgW2luaXRQb3NpdGlvbl09XCJpbml0U2Nyb2xsUG9zaXRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIHdlZWt2aWV3LW5vcm1hbC1ldmVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgKm5nRm9yPVwibGV0IHJvdyBvZiB2aWV3c1swXS5yb3dzOyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWhvdXItY29sdW1uIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7e2hvdXJDb2x1bW5MYWJlbHNbaV19fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgKm5nRm9yPVwibGV0IHRtIG9mIHJvd1wiIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt0bTp0bSwgaG91clBhcnRzOiBob3VyUGFydHN9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDwvaW5pdC1wb3NpdGlvbi1zY3JvbGw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlIHN3aXBlclNsaWRlIGNsYXNzPVwic2xpZGUtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWQgdGFibGUtZml4ZWQgd2Vla3ZpZXctaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwiY2FsZW5kYXItaG91ci1jb2x1bW5cIj48L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwid2Vla3ZpZXctaGVhZGVyIHRleHQtY2VudGVyXCIgKm5nRm9yPVwibGV0IGRhdGUgb2Ygdmlld3NbMV0uZGF0ZXNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cImdldEhpZ2hsaWdodENsYXNzKGRhdGUpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2xpY2spPVwiZGF5U2VsZWN0ZWQoZGF0ZSlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwid2Vla3ZpZXdIZWFkZXJUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7dmlld0RhdGU6ZGF0ZX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCIxPT09Y3VycmVudFZpZXdJbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Vla3ZpZXctYWxsZGF5LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Vla3ZpZXctYWxsZGF5LWxhYmVsXCI+e3thbGxEYXlMYWJlbH19PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Vla3ZpZXctYWxsZGF5LWNvbnRlbnQtd3JhcHBlciBzY3JvbGwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWZpeGVkIHdlZWt2aWV3LWFsbGRheS1jb250ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkICpuZ0Zvcj1cImxldCBkYXkgb2Ygdmlld3NbMV0uZGF0ZXNcIiBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwid2Vla3ZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7ZGF5OmRheSwgZXZlbnRUZW1wbGF0ZTp3ZWVrdmlld0FsbERheUV2ZW50VGVtcGxhdGV9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGluaXQtcG9zaXRpb24tc2Nyb2xsIGNsYXNzPVwid2Vla3ZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lclwiIFtpbml0UG9zaXRpb25dPVwiaW5pdFNjcm9sbFBvc2l0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtlbWl0RXZlbnRdPVwicHJlc2VydmVTY3JvbGxQb3NpdGlvblwiIChvblNjcm9sbCk9XCJzZXRTY3JvbGxQb3NpdGlvbigkZXZlbnQpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCB3ZWVrdmlldy1ub3JtYWwtZXZlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2Ygdmlld3NbMV0ucm93czsgbGV0IGkgPSBpbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1ob3VyLWNvbHVtbiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3tob3VyQ29sdW1uTGFiZWxzW2ldfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkICpuZ0Zvcj1cImxldCB0bSBvZiByb3dcIiBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIiB0YXBwYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNsaWNrKT1cInNlbGVjdCh0bS50aW1lLCB0bS5ldmVudHMpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cInsnY2FsZW5kYXItZXZlbnQtd3JhcCc6IHRtLmV2ZW50c31cIiAqbmdJZj1cInRtLmV2ZW50c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJ3ZWVrdmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt0bTp0bSwgaG91clBhcnRzOiBob3VyUGFydHMsIGV2ZW50VGVtcGxhdGU6d2Vla3ZpZXdOb3JtYWxFdmVudFRlbXBsYXRlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8L2luaXQtcG9zaXRpb24tc2Nyb2xsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCIxIT09Y3VycmVudFZpZXdJbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Vla3ZpZXctYWxsZGF5LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Vla3ZpZXctYWxsZGF5LWxhYmVsXCI+e3thbGxEYXlMYWJlbH19PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Vla3ZpZXctYWxsZGF5LWNvbnRlbnQtd3JhcHBlciBzY3JvbGwtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWZpeGVkIHdlZWt2aWV3LWFsbGRheS1jb250ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkICpuZ0Zvcj1cImxldCBkYXkgb2Ygdmlld3NbMV0uZGF0ZXNcIiBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwid2Vla3ZpZXdJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cIntkYXk6ZGF5fVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxpbml0LXBvc2l0aW9uLXNjcm9sbCBjbGFzcz1cIndlZWt2aWV3LW5vcm1hbC1ldmVudC1jb250YWluZXJcIiBbaW5pdFBvc2l0aW9uXT1cImluaXRTY3JvbGxQb3NpdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtYm9yZGVyZWQgdGFibGUtZml4ZWQgd2Vla3ZpZXctbm9ybWFsLWV2ZW50LXRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciAqbmdGb3I9XCJsZXQgcm93IG9mIHZpZXdzWzFdLnJvd3M7IGxldCBpID0gaW5kZXhcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsZW5kYXItaG91ci1jb2x1bW4gdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7aG91ckNvbHVtbkxhYmVsc1tpXX19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCAqbmdGb3I9XCJsZXQgdG0gb2Ygcm93XCIgY2xhc3M9XCJjYWxlbmRhci1jZWxsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cInsnY2FsZW5kYXItZXZlbnQtd3JhcCc6IHRtLmV2ZW50c31cIiAqbmdJZj1cInRtLmV2ZW50c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJ3ZWVrdmlld0luYWN0aXZlTm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3RtOnRtLCBob3VyUGFydHM6IGhvdXJQYXJ0c31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPC9pbml0LXBvc2l0aW9uLXNjcm9sbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgc3dpcGVyU2xpZGUgY2xhc3M9XCJzbGlkZS1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCB3ZWVrdmlldy1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3M9XCJjYWxlbmRhci1ob3VyLWNvbHVtblwiPjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3M9XCJ3ZWVrdmlldy1oZWFkZXIgdGV4dC1jZW50ZXJcIiAqbmdGb3I9XCJsZXQgZGF0ZSBvZiB2aWV3c1syXS5kYXRlc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nQ2xhc3NdPVwiZ2V0SGlnaGxpZ2h0Q2xhc3MoZGF0ZSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGljayk9XCJkYXlTZWxlY3RlZChkYXRlKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJ3ZWVrdmlld0hlYWRlclRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInt2aWV3RGF0ZTpkYXRlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPGRpdiAqbmdJZj1cIjI9PT1jdXJyZW50Vmlld0luZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3ZWVrdmlldy1hbGxkYXktdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3ZWVrdmlldy1hbGxkYXktbGFiZWxcIj57e2FsbERheUxhYmVsfX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3ZWVrdmlldy1hbGxkYXktY29udGVudC13cmFwcGVyIHNjcm9sbC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtZml4ZWQgd2Vla3ZpZXctYWxsZGF5LWNvbnRlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgKm5nRm9yPVwibGV0IGRheSBvZiB2aWV3c1syXS5kYXRlc1wiIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJ3ZWVrdmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cIntkYXk6ZGF5LCBldmVudFRlbXBsYXRlOndlZWt2aWV3QWxsRGF5RXZlbnRUZW1wbGF0ZX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8aW5pdC1wb3NpdGlvbi1zY3JvbGwgY2xhc3M9XCJ3ZWVrdmlldy1ub3JtYWwtZXZlbnQtY29udGFpbmVyXCIgW2luaXRQb3NpdGlvbl09XCJpbml0U2Nyb2xsUG9zaXRpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2VtaXRFdmVudF09XCJwcmVzZXJ2ZVNjcm9sbFBvc2l0aW9uXCIgKG9uU2Nyb2xsKT1cInNldFNjcm9sbFBvc2l0aW9uKCRldmVudClcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLWJvcmRlcmVkIHRhYmxlLWZpeGVkIHdlZWt2aWV3LW5vcm1hbC1ldmVudC10YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgKm5nRm9yPVwibGV0IHJvdyBvZiB2aWV3c1syXS5yb3dzOyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGVuZGFyLWhvdXItY29sdW1uIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7e2hvdXJDb2x1bW5MYWJlbHNbaV19fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgKm5nRm9yPVwibGV0IHRtIG9mIHJvd1wiIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiIHRhcHBhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2xpY2spPVwic2VsZWN0KHRtLnRpbWUsIHRtLmV2ZW50cylcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgW25nQ2xhc3NdPVwieydjYWxlbmRhci1ldmVudC13cmFwJzogdG0uZXZlbnRzfVwiICpuZ0lmPVwidG0uZXZlbnRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie3RtOnRtLCBob3VyUGFydHM6IGhvdXJQYXJ0cywgZXZlbnRUZW1wbGF0ZTp3ZWVrdmlld05vcm1hbEV2ZW50VGVtcGxhdGV9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDwvaW5pdC1wb3NpdGlvbi1zY3JvbGw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiAqbmdJZj1cIjIhPT1jdXJyZW50Vmlld0luZGV4XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3ZWVrdmlldy1hbGxkYXktdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3ZWVrdmlldy1hbGxkYXktbGFiZWxcIj57e2FsbERheUxhYmVsfX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3ZWVrdmlldy1hbGxkYXktY29udGVudC13cmFwcGVyIHNjcm9sbC1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtZml4ZWQgd2Vla3ZpZXctYWxsZGF5LWNvbnRlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgKm5nRm9yPVwibGV0IGRheSBvZiB2aWV3c1syXS5kYXRlc1wiIGNsYXNzPVwiY2FsZW5kYXItY2VsbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJ3ZWVrdmlld0luYWN0aXZlQWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwie2RheTpkYXl9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGluaXQtcG9zaXRpb24tc2Nyb2xsIGNsYXNzPVwid2Vla3ZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lclwiIFtpbml0UG9zaXRpb25dPVwiaW5pdFNjcm9sbFBvc2l0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZCB0YWJsZS1maXhlZCB3ZWVrdmlldy1ub3JtYWwtZXZlbnQtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyICpuZ0Zvcj1cImxldCByb3cgb2Ygdmlld3NbMl0ucm93czsgbGV0IGkgPSBpbmRleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxlbmRhci1ob3VyLWNvbHVtbiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3tob3VyQ29sdW1uTGFiZWxzW2ldfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkICpuZ0Zvcj1cImxldCB0bSBvZiByb3dcIiBjbGFzcz1cImNhbGVuZGFyLWNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgW25nQ2xhc3NdPVwieydjYWxlbmRhci1ldmVudC13cmFwJzogdG0uZXZlbnRzfVwiICpuZ0lmPVwidG0uZXZlbnRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWt2aWV3SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7dG06dG0sIGhvdXJQYXJ0czogaG91clBhcnRzfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8L2luaXQtcG9zaXRpb24tc2Nyb2xsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9zd2lwZXI+XG4gICAgYCxcbiAgICBzdHlsZXM6IFtgXG4gICAgICAgIC50YWJsZS1maXhlZCB7XG4gICAgICAgICAgICB0YWJsZS1sYXlvdXQ6IGZpeGVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0aGVhZCA+IHRyID4gdGgsIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0aCwgLnRhYmxlID4gdGZvb3QgPiB0ciA+IHRoLCAudGFibGUgPiB0aGVhZCA+IHRyID4gdGQsXG4gICAgICAgIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0ZCwgLnRhYmxlID4gdGZvb3QgPiB0ciA+IHRkIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDhweDtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAyMHB4O1xuICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IHRvcDtcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZSA+IHRoZWFkID4gdHIgPiB0aCB7XG4gICAgICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogYm90dG9tO1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0aGVhZDpmaXJzdC1jaGlsZCA+IHRyOmZpcnN0LWNoaWxkID4gdGgsIC50YWJsZSA+IHRoZWFkOmZpcnN0LWNoaWxkID4gdHI6Zmlyc3QtY2hpbGQgPiB0ZCB7XG4gICAgICAgICAgICBib3JkZXItdG9wOiAwXG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUgPiB0Ym9keSArIHRib2R5IHtcbiAgICAgICAgICAgIGJvcmRlci10b3A6IDJweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlLWJvcmRlcmVkIHtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGgsIC50YWJsZS1ib3JkZXJlZCA+IHRib2R5ID4gdHIgPiB0aCwgLnRhYmxlLWJvcmRlcmVkID4gdGZvb3QgPiB0ciA+IHRoLFxuICAgICAgICAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGQsIC50YWJsZS1ib3JkZXJlZCA+IHRib2R5ID4gdHIgPiB0ZCwgLnRhYmxlLWJvcmRlcmVkID4gdGZvb3QgPiB0ciA+IHRkIHtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtYm9yZGVyZWQgPiB0aGVhZCA+IHRyID4gdGgsIC50YWJsZS1ib3JkZXJlZCA+IHRoZWFkID4gdHIgPiB0ZCB7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tLXdpZHRoOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtc3RyaXBlZCA+IHRib2R5ID4gdHI6bnRoLWNoaWxkKG9kZCkgPiB0ZCwgLnRhYmxlLXN0cmlwZWQgPiB0Ym9keSA+IHRyOm50aC1jaGlsZChvZGQpID4gdGgge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjlmOVxuICAgICAgICB9XG5cbiAgICAgICAgLmNhbGVuZGFyLWhvdXItY29sdW1uIHtcbiAgICAgICAgICAgIHdpZHRoOiA1MHB4O1xuICAgICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5jYWxlbmRhci1ldmVudC13cmFwIHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNhbGVuZGFyLWV2ZW50IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDJweDtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHotaW5kZXg6IDEwMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNhbGVuZGFyLWNlbGwge1xuICAgICAgICAgICAgcGFkZGluZzogMCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgaGVpZ2h0OiAzN3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnNsaWRlcy1jb250YWluZXIge1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLnNsaWRlLWNvbnRhaW5lciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jayAhaW1wb3J0YW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLndlZWt2aWV3LWFsbGRheS1sYWJlbCB7XG4gICAgICAgICAgICBmbG9hdDogbGVmdDtcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiA1MHB4O1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgd2lkdGg6IDUwcHg7XG4gICAgICAgICAgICBib3JkZXItbGVmdDogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgIH1cblxuICAgICAgICBbZGlyPVwicnRsXCJdIC53ZWVrdmlldy1hbGxkYXktbGFiZWwge1xuICAgICAgICAgICAgZmxvYXQ6IHJpZ2h0O1xuICAgICAgICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgI2RkZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC53ZWVrdmlldy1hbGxkYXktY29udGVudC13cmFwcGVyIHtcbiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiA1MHB4O1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICAgIGhlaWdodDogNTFweDtcbiAgICAgICAgfVxuXG4gICAgICAgIFtkaXI9XCJydGxcIl0gLndlZWt2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIge1xuICAgICAgICAgICAgbWFyZ2luLWxlZnQ6IDA7XG4gICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDUwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAud2Vla3ZpZXctYWxsZGF5LWNvbnRlbnQtdGFibGUge1xuICAgICAgICAgICAgbWluLWhlaWdodDogNTBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC53ZWVrdmlldy1hbGxkYXktY29udGVudC10YWJsZSB0ZCB7XG4gICAgICAgICAgICBib3JkZXItbGVmdDogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICB9XG5cbiAgICAgICAgLndlZWt2aWV3LWhlYWRlciB0aCB7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC53ZWVrdmlldy1hbGxkYXktdGFibGUge1xuICAgICAgICAgICAgaGVpZ2h0OiA1MHB4O1xuICAgICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAud2Vla3ZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lciB7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiA4N3B4O1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgICByaWdodDogMDtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGJvdHRvbTogMDtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zY3JvbGwtY29udGVudCB7XG4gICAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICAgICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgOjotd2Via2l0LXNjcm9sbGJhcixcbiAgICAgICAgKjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICAgICAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0ZC5jYWxlbmRhci1ob3VyLWNvbHVtbiB7XG4gICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IDA7XG4gICAgICAgICAgICBwYWRkaW5nLXJpZ2h0OiAwO1xuICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIEBtZWRpYSAobWF4LXdpZHRoOiA3NTBweCkge1xuICAgICAgICAgICAgLndlZWt2aWV3LWFsbGRheS1sYWJlbCwgLmNhbGVuZGFyLWhvdXItY29sdW1uIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogMzFweDtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC53ZWVrdmlldy1hbGxkYXktbGFiZWwge1xuICAgICAgICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC50YWJsZSA+IHRib2R5ID4gdHIgPiB0ZC5jYWxlbmRhci1ob3VyLWNvbHVtbiB7XG4gICAgICAgICAgICAgICAgcGFkZGluZy1sZWZ0OiAwO1xuICAgICAgICAgICAgICAgIHBhZGRpbmctcmlnaHQ6IDA7XG4gICAgICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMTJweDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLnRhYmxlID4gdGhlYWQgPiB0ciA+IHRoLndlZWt2aWV3LWhlYWRlciB7XG4gICAgICAgICAgICAgICAgcGFkZGluZy1sZWZ0OiAwO1xuICAgICAgICAgICAgICAgIHBhZGRpbmctcmlnaHQ6IDA7XG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAud2Vla3ZpZXctYWxsZGF5LWxhYmVsIHtcbiAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMjBweDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLndlZWt2aWV3LWFsbGRheS1jb250ZW50LXdyYXBwZXIge1xuICAgICAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAzMXB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBbZGlyPVwicnRsXCJdIC53ZWVrdmlldy1hbGxkYXktY29udGVudC13cmFwcGVyIHtcbiAgICAgICAgICAgICAgICBtYXJnaW4tbGVmdDogMDtcbiAgICAgICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDMxcHg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBgXSxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXG59KVxuZXhwb3J0IGNsYXNzIFdlZWtWaWV3Q29tcG9uZW50IGltcGxlbWVudHMgSUNhbGVuZGFyQ29tcG9uZW50LCBPbkluaXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBBZnRlclZpZXdJbml0IHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY2FsZW5kYXJTZXJ2aWNlOiBDYWxlbmRhclNlcnZpY2UsIHByaXZhdGUgZWxtOiBFbGVtZW50UmVmLCBwcml2YXRlIHpvbmU6IE5nWm9uZSkge1xuICAgIH1cblxuICAgIEBIb3N0QmluZGluZygnY2xhc3Mud2Vla3ZpZXcnKSBjbGFzcyA9IHRydWU7XG4gICAgQFZpZXdDaGlsZCgnc3dpcGVyJywgeyBzdGF0aWM6IGZhbHNlIH0pIHNsaWRlciE6IFN3aXBlckNvbXBvbmVudDtcblxuICAgIEBJbnB1dCgpIHdlZWt2aWV3SGVhZGVyVGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJRGlzcGxheVdlZWtWaWV3SGVhZGVyPjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld0FsbERheUV2ZW50VGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJRGlzcGxheUFsbERheUV2ZW50PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld05vcm1hbEV2ZW50VGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJRGlzcGxheUV2ZW50PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlITogVGVtcGxhdGVSZWY8SVdlZWtWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlITogVGVtcGxhdGVSZWY8SVdlZWtWaWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld0luYWN0aXZlQWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGUhOiBUZW1wbGF0ZVJlZjxJV2Vla1ZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIHdlZWt2aWV3SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZSE6IFRlbXBsYXRlUmVmPElXZWVrVmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlQ29udGV4dD47XG5cbiAgICBASW5wdXQoKSBmb3JtYXRXZWVrVGl0bGU/OiBzdHJpbmc7XG4gICAgQElucHV0KCkgZm9ybWF0V2Vla1ZpZXdEYXlIZWFkZXI/OiBzdHJpbmc7XG4gICAgQElucHV0KCkgZm9ybWF0SG91ckNvbHVtbj86IHN0cmluZztcbiAgICBASW5wdXQoKSBzdGFydGluZ0RheVdlZWshOiBudW1iZXI7XG4gICAgQElucHV0KCkgYWxsRGF5TGFiZWw/OiBzdHJpbmc7XG4gICAgQElucHV0KCkgaG91clBhcnRzITogbnVtYmVyO1xuICAgIEBJbnB1dCgpIGV2ZW50U291cmNlITogSUV2ZW50W107XG4gICAgQElucHV0KCkgYXV0b1NlbGVjdCA9IHRydWU7XG4gICAgQElucHV0KCkgbWFya0Rpc2FibGVkPzogKGRhdGU6IERhdGUpID0+IGJvb2xlYW47XG4gICAgQElucHV0KCkgbG9jYWxlITogc3RyaW5nO1xuICAgIEBJbnB1dCgpIGRhdGVGb3JtYXR0ZXI/OiBJRGF0ZUZvcm1hdHRlcjtcbiAgICBASW5wdXQoKSBkaXIgPSAnJztcbiAgICBASW5wdXQoKSBzY3JvbGxUb0hvdXIgPSAwO1xuICAgIEBJbnB1dCgpIHByZXNlcnZlU2Nyb2xsUG9zaXRpb24/OiBib29sZWFuO1xuICAgIEBJbnB1dCgpIGxvY2tTd2lwZVRvUHJldj86IGJvb2xlYW47XG4gICAgQElucHV0KCkgbG9ja1N3aXBlVG9OZXh0PzogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBsb2NrU3dpcGVzPzogYm9vbGVhbjtcbiAgICBASW5wdXQoKSBzdGFydEhvdXIhOiBudW1iZXI7XG4gICAgQElucHV0KCkgZW5kSG91ciE6IG51bWJlcjtcbiAgICBASW5wdXQoKSBzbGlkZXJPcHRpb25zOiBhbnk7XG4gICAgQElucHV0KCkgaG91clNlZ21lbnRzITogbnVtYmVyO1xuXG4gICAgQE91dHB1dCgpIG9uUmFuZ2VDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxJUmFuZ2U+KCk7XG4gICAgQE91dHB1dCgpIG9uRXZlbnRTZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8SUV2ZW50PigpO1xuICAgIEBPdXRwdXQoKSBvblRpbWVTZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8SVRpbWVTZWxlY3RlZD4oKTtcbiAgICBAT3V0cHV0KCkgb25EYXlIZWFkZXJTZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8SVRpbWVTZWxlY3RlZD4oKTtcbiAgICBAT3V0cHV0KCkgb25UaXRsZUNoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHN0cmluZz4oKTtcblxuICAgIHB1YmxpYyB2aWV3czogSVdlZWtWaWV3W10gPSBbXTtcbiAgICBwdWJsaWMgY3VycmVudFZpZXdJbmRleCA9IDA7XG4gICAgcHVibGljIHJhbmdlITogSVJhbmdlO1xuICAgIHB1YmxpYyBkaXJlY3Rpb24gPSAwO1xuICAgIHB1YmxpYyBtb2RlOiBDYWxlbmRhck1vZGUgPSAnd2Vlayc7XG5cbiAgICBwcml2YXRlIGluaXRlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgY2FsbGJhY2tPbkluaXQgPSB0cnVlO1xuICAgIHByaXZhdGUgY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIGV2ZW50U291cmNlQ2hhbmdlZFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIHNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIHNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcblxuICAgIHB1YmxpYyBob3VyQ29sdW1uTGFiZWxzITogc3RyaW5nW107XG4gICAgcHVibGljIGluaXRTY3JvbGxQb3NpdGlvbiE6IG51bWJlcjtcbiAgICBwcml2YXRlIGZvcm1hdERheUhlYWRlciE6IChkYXRlOiBEYXRlKSA9PiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBmb3JtYXRUaXRsZSE6IChkYXRlOiBEYXRlKSA9PiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBmb3JtYXRIb3VyQ29sdW1uTGFiZWwhOiAoZGF0ZTogRGF0ZSkgPT4gc3RyaW5nO1xuICAgIHByaXZhdGUgaG91clJhbmdlITogbnVtYmVyO1xuXG4gICAgc3RhdGljIGNyZWF0ZURhdGVPYmplY3RzKHN0YXJ0VGltZTogRGF0ZSwgc3RhcnRIb3VyOiBudW1iZXIsIGVuZEhvdXI6IG51bWJlciwgdGltZUludGVydmFsOiBudW1iZXIpOiBJV2Vla1ZpZXdSb3dbXVtdIHtcbiAgICAgICAgY29uc3QgdGltZXM6IElXZWVrVmlld1Jvd1tdW10gPSBbXSxcbiAgICAgICAgICAgIGN1cnJlbnRIb3VyID0gMCxcbiAgICAgICAgICAgIGN1cnJlbnREYXRlID0gc3RhcnRUaW1lLmdldERhdGUoKTtcbiAgICAgICAgbGV0IGhvdXJTdGVwLFxuICAgICAgICAgICAgbWluU3RlcDtcblxuICAgICAgICBpZiAodGltZUludGVydmFsIDwgMSkge1xuICAgICAgICAgICAgaG91clN0ZXAgPSBNYXRoLmZsb29yKDEgLyB0aW1lSW50ZXJ2YWwpO1xuICAgICAgICAgICAgbWluU3RlcCA9IDYwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaG91clN0ZXAgPSAxO1xuICAgICAgICAgICAgbWluU3RlcCA9IE1hdGguZmxvb3IoNjAgLyB0aW1lSW50ZXJ2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaG91ciA9IHN0YXJ0SG91cjsgaG91ciA8IGVuZEhvdXI7IGhvdXIgKz0gaG91clN0ZXApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGludGVydmFsID0gMDsgaW50ZXJ2YWwgPCA2MDsgaW50ZXJ2YWwgKz0gbWluU3RlcCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvdzogSVdlZWtWaWV3Um93W10gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkYXkgPSAwOyBkYXkgPCA3OyBkYXkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lID0gbmV3IERhdGUoc3RhcnRUaW1lLmdldFRpbWUoKSk7XG4gICAgICAgICAgICAgICAgICAgIHRpbWUuc2V0SG91cnMoY3VycmVudEhvdXIgKyBob3VyLCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRpbWUuc2V0RGF0ZShjdXJyZW50RGF0ZSArIGRheSk7XG4gICAgICAgICAgICAgICAgICAgIHJvdy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50czogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aW1lcy5wdXNoKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRpbWVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXREYXRlcyhzdGFydFRpbWU6IERhdGUsIG46IG51bWJlcik6IElXZWVrVmlld0RhdGVSb3dbXSB7XG4gICAgICAgIGNvbnN0IGRhdGVzID0gbmV3IEFycmF5KG4pLFxuICAgICAgICAgICAgY3VycmVudCA9IG5ldyBEYXRlKHN0YXJ0VGltZS5nZXRUaW1lKCkpO1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgbikge1xuICAgICAgICAgICAgZGF0ZXNbaSsrXSA9IHtcbiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShjdXJyZW50LmdldFRpbWUoKSksXG4gICAgICAgICAgICAgICAgZXZlbnRzOiBbXSxcbiAgICAgICAgICAgICAgICBkYXlIZWFkZXI6ICcnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIGNvbXBhcmVFdmVudEJ5U3RhcnRPZmZzZXQoZXZlbnRBOiBJRGlzcGxheUV2ZW50LCBldmVudEI6IElEaXNwbGF5RXZlbnQpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gZXZlbnRBLnN0YXJ0T2Zmc2V0IC0gZXZlbnRCLnN0YXJ0T2Zmc2V0O1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIGNhbGN1bGF0ZVdpZHRoKG9yZGVyZWRFdmVudHM6IElEaXNwbGF5RXZlbnRbXSwgc2l6ZTogbnVtYmVyLCBob3VyUGFydHM6IG51bWJlcikge1xuICAgICAgICBjb25zdCB0b3RhbFNpemUgPSBzaXplICogaG91clBhcnRzLFxuICAgICAgICAgICAgY2VsbHMgPSBuZXcgQXJyYXkodG90YWxTaXplKTtcblxuICAgICAgICAvLyBzb3J0IGJ5IHBvc2l0aW9uIGluIGRlc2NlbmRpbmcgb3JkZXIsIHRoZSByaWdodCBtb3N0IGNvbHVtbnMgc2hvdWxkIGJlIGNhbGN1bGF0ZWQgZmlyc3RcbiAgICAgICAgb3JkZXJlZEV2ZW50cy5zb3J0KChldmVudEEsIGV2ZW50QikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGV2ZW50Qi5wb3NpdGlvbiAtIGV2ZW50QS5wb3NpdGlvbjtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxTaXplOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNlbGxzW2ldID0ge1xuICAgICAgICAgICAgICAgIGNhbGN1bGF0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGV2ZW50czogW11cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGVuID0gb3JkZXJlZEV2ZW50cy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gb3JkZXJlZEV2ZW50c1tpXTtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IGV2ZW50LnN0YXJ0SW5kZXggKiBob3VyUGFydHMgKyBldmVudC5zdGFydE9mZnNldDtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGV2ZW50LmVuZEluZGV4ICogaG91clBhcnRzIC0gZXZlbnQuZW5kT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgY2VsbHNbaW5kZXhdLmV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGxlbikge1xuICAgICAgICAgICAgbGV0IGV2ZW50OklEaXNwbGF5RXZlbnR8dW5kZWZpbmVkID0gb3JkZXJlZEV2ZW50c1tpXTtcbiAgICAgICAgICAgIGlmICghZXZlbnQub3ZlcmxhcE51bWJlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG92ZXJsYXBOdW1iZXIgPSBldmVudC5wb3NpdGlvbiArIDE7XG4gICAgICAgICAgICAgICAgZXZlbnQub3ZlcmxhcE51bWJlciA9IG92ZXJsYXBOdW1iZXI7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRRdWV1ZSA9IFtldmVudF07XG4gICAgICAgICAgICAgICAgd2hpbGUgKGV2ZW50ID0gZXZlbnRRdWV1ZS5zaGlmdCgpKSB7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gZXZlbnQuc3RhcnRJbmRleCAqIGhvdXJQYXJ0cyArIGV2ZW50LnN0YXJ0T2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBldmVudC5lbmRJbmRleCAqIGhvdXJQYXJ0cyAtIGV2ZW50LmVuZE9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjZWxsc1tpbmRleF0uY2FsY3VsYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbGxzW2luZGV4XS5jYWxjdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2VsbHNbaW5kZXhdLmV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBldmVudENvdW50SW5DZWxsID0gY2VsbHNbaW5kZXhdLmV2ZW50cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZXZlbnRDb3VudEluQ2VsbDsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RXZlbnRJbkNlbGwgPSBjZWxsc1tpbmRleF0uZXZlbnRzW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50RXZlbnRJbkNlbGwub3ZlcmxhcE51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRFdmVudEluQ2VsbC5vdmVybGFwTnVtYmVyID0gb3ZlcmxhcE51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFF1ZXVlLnB1c2goY3VycmVudEV2ZW50SW5DZWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpICs9IDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNsaWRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVyT3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2xpZGVyT3B0aW9ucy5sb29wID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmhvdXJSYW5nZSA9ICh0aGlzLmVuZEhvdXIgLSB0aGlzLnN0YXJ0SG91cikgKiB0aGlzLmhvdXJTZWdtZW50cztcbiAgICAgICAgaWYgKHRoaXMuZGF0ZUZvcm1hdHRlciAmJiB0aGlzLmRhdGVGb3JtYXR0ZXIuZm9ybWF0V2Vla1ZpZXdEYXlIZWFkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0RGF5SGVhZGVyID0gdGhpcy5kYXRlRm9ybWF0dGVyLmZvcm1hdFdlZWtWaWV3RGF5SGVhZGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGF0ZVBpcGUgPSBuZXcgRGF0ZVBpcGUodGhpcy5sb2NhbGUpO1xuICAgICAgICAgICAgdGhpcy5mb3JtYXREYXlIZWFkZXIgPSBmdW5jdGlvbiAoZGF0ZTogRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlUGlwZS50cmFuc2Zvcm0oZGF0ZSwgdGhpcy5mb3JtYXRXZWVrVmlld0RheUhlYWRlcil8fCcnO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRhdGVGb3JtYXR0ZXIgJiYgdGhpcy5kYXRlRm9ybWF0dGVyLmZvcm1hdFdlZWtWaWV3VGl0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0VGl0bGUgPSB0aGlzLmRhdGVGb3JtYXR0ZXIuZm9ybWF0V2Vla1ZpZXdUaXRsZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGVQaXBlID0gbmV3IERhdGVQaXBlKHRoaXMubG9jYWxlKTtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0VGl0bGUgPSBmdW5jdGlvbiAoZGF0ZTogRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlUGlwZS50cmFuc2Zvcm0oZGF0ZSwgdGhpcy5mb3JtYXRXZWVrVGl0bGUpfHwnJztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kYXRlRm9ybWF0dGVyICYmIHRoaXMuZGF0ZUZvcm1hdHRlci5mb3JtYXRXZWVrVmlld0hvdXJDb2x1bW4pIHtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0SG91ckNvbHVtbkxhYmVsID0gdGhpcy5kYXRlRm9ybWF0dGVyLmZvcm1hdFdlZWtWaWV3SG91ckNvbHVtbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGVQaXBlID0gbmV3IERhdGVQaXBlKHRoaXMubG9jYWxlKTtcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0SG91ckNvbHVtbkxhYmVsID0gZnVuY3Rpb24gKGRhdGU6IERhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZVBpcGUudHJhbnNmb3JtKGRhdGUsIHRoaXMuZm9ybWF0SG91ckNvbHVtbil8fCcnO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgdGhpcy5ob3VyQ29sdW1uTGFiZWxzID0gdGhpcy5nZXRIb3VyQ29sdW1uTGFiZWxzKCk7XG4gICAgICAgIHRoaXMuaW5pdGVkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmN1cnJlbnREYXRlQ2hhbmdlZEZyb21QYXJlbnRTdWJzY3JpcHRpb24gPSB0aGlzLmNhbGVuZGFyU2VydmljZS5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tUGFyZW50JC5zdWJzY3JpYmUoY3VycmVudERhdGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoVmlldygpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmV2ZW50U291cmNlQ2hhbmdlZFN1YnNjcmlwdGlvbiA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLmV2ZW50U291cmNlQ2hhbmdlZCQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25EYXRhTG9hZGVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2xpZGVDaGFuZ2VkU3Vic2NyaXB0aW9uID0gdGhpcy5jYWxlbmRhclNlcnZpY2Uuc2xpZGVDaGFuZ2VkJC5zdWJzY3JpYmUoZGlyZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNsaWRlci5zd2lwZXJSZWYuc2xpZGVOZXh0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNsaWRlci5zd2lwZXJSZWYuc2xpZGVQcmV2KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2xpZGVVcGRhdGVkU3Vic2NyaXB0aW9uID0gdGhpcy5jYWxlbmRhclNlcnZpY2Uuc2xpZGVVcGRhdGVkJC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnVwZGF0ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gdGhpcy5nZXRUaXRsZSgpO1xuICAgICAgICB0aGlzLm9uVGl0bGVDaGFuZ2VkLmVtaXQodGl0bGUpO1xuXG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFRvSG91ciA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGhvdXJDb2x1bW5zID0gdGhpcy5lbG0ubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCcud2Vla3ZpZXctbm9ybWFsLWV2ZW50LWNvbnRhaW5lcicpLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYWxlbmRhci1ob3VyLWNvbHVtbicpO1xuICAgICAgICAgICAgY29uc3QgbWUgPSB0aGlzO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbWUuaW5pdFNjcm9sbFBvc2l0aW9uID0gaG91ckNvbHVtbnNbbWUuc2Nyb2xsVG9Ib3VyIC0gbWUuc3RhcnRIb3VyXS5vZmZzZXRUb3A7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgICAgIGlmICghdGhpcy5pbml0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoY2hhbmdlc1snc3RhcnRIb3VyJ10gfHwgY2hhbmdlc1snZW5kSG91ciddKSAmJiAoIWNoYW5nZXNbJ3N0YXJ0SG91ciddLmlzRmlyc3RDaGFuZ2UoKSB8fCAhY2hhbmdlc1snZW5kSG91ciddLmlzRmlyc3RDaGFuZ2UoKSkpIHtcbiAgICAgICAgICAgIHRoaXMudmlld3MgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuaG91clJhbmdlID0gKHRoaXMuZW5kSG91ciAtIHRoaXMuc3RhcnRIb3VyKSAqIHRoaXMuaG91clNlZ21lbnRzO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSAwO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoVmlldygpO1xuICAgICAgICAgICAgdGhpcy5ob3VyQ29sdW1uTGFiZWxzID0gdGhpcy5nZXRIb3VyQ29sdW1uTGFiZWxzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBldmVudFNvdXJjZUNoYW5nZSA9IGNoYW5nZXNbJ2V2ZW50U291cmNlJ107XG4gICAgICAgIGlmIChldmVudFNvdXJjZUNoYW5nZSAmJiBldmVudFNvdXJjZUNoYW5nZS5jdXJyZW50VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMub25EYXRhTG9hZGVkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NrU3dpcGVUb1ByZXYgPSBjaGFuZ2VzWydsb2NrU3dpcGVUb1ByZXYnXTtcbiAgICAgICAgaWYgKGxvY2tTd2lwZVRvUHJldikge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFsbG93U2xpZGVQcmV2ID0gIWxvY2tTd2lwZVRvUHJldi5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NrU3dpcGVUb05leHQgPSBjaGFuZ2VzWydsb2NrU3dpcGVUb05leHQnXTtcbiAgICAgICAgaWYgKGxvY2tTd2lwZVRvUHJldikge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFsbG93U2xpZGVOZXh0ID0gIWxvY2tTd2lwZVRvTmV4dC5jdXJyZW50VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NrU3dpcGVzID0gY2hhbmdlc1snbG9ja1N3aXBlcyddO1xuICAgICAgICBpZiAobG9ja1N3aXBlcykge1xuICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLmFsbG93VG91Y2hNb3ZlID0gIWxvY2tTd2lwZXMuY3VycmVudFZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnREYXRlQ2hhbmdlZEZyb21QYXJlbnRTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERhdGVDaGFuZ2VkRnJvbVBhcmVudFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tUGFyZW50U3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZXZlbnRTb3VyY2VDaGFuZ2VkU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50U291cmNlQ2hhbmdlZFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5ldmVudFNvdXJjZUNoYW5nZWRTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zbGlkZUNoYW5nZWRTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVDaGFuZ2VkU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLnNsaWRlQ2hhbmdlZFN1YnNjcmlwdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNsaWRlVXBkYXRlZFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5zbGlkZVVwZGF0ZWRTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuc2xpZGVVcGRhdGVkU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25TbGlkZUNoYW5nZWQoKSB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2tPbkluaXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrT25Jbml0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Vmlld0luZGV4ID0gdGhpcy5jdXJyZW50Vmlld0luZGV4O1xuICAgICAgICAgICAgbGV0IGRpcmVjdGlvbiA9IDA7XG5cbiAgICAgICAgICAgIGxldCBjdXJyZW50U2xpZGVJbmRleCA9IHRoaXMuc2xpZGVyLnN3aXBlclJlZi5hY3RpdmVJbmRleDtcbiAgICAgICAgICAgIGN1cnJlbnRTbGlkZUluZGV4ID0gKGN1cnJlbnRTbGlkZUluZGV4ICsgMikgJSAzO1xuICAgICAgICAgICAgaWYoaXNOYU4oY3VycmVudFNsaWRlSW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFNsaWRlSW5kZXggPSBjdXJyZW50Vmlld0luZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggLSBjdXJyZW50Vmlld0luZGV4ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFNsaWRlSW5kZXggPT09IDAgJiYgY3VycmVudFZpZXdJbmRleCA9PT0gMikge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICAgICAgdGhpcy5zbGlkZXIuc3dpcGVyUmVmLnNsaWRlVG8oMSwgMCwgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50Vmlld0luZGV4IC0gY3VycmVudFNsaWRlSW5kZXggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAtMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFNsaWRlSW5kZXggPT09IDIgJiYgY3VycmVudFZpZXdJbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IC0xO1xuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGVyLnN3aXBlclJlZi5zbGlkZVRvKDMsIDAsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFZpZXdJbmRleCA9IGN1cnJlbnRTbGlkZUluZGV4O1xuICAgICAgICAgICAgdGhpcy5tb3ZlKGRpcmVjdGlvbik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG1vdmUoZGlyZWN0aW9uOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICBjb25zdCBhZGphY2VudCA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLmdldEFkamFjZW50Q2FsZW5kYXJEYXRlKHRoaXMubW9kZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2Uuc2V0Q3VycmVudERhdGUoYWRqYWNlbnQpO1xuICAgICAgICB0aGlzLnJlZnJlc2hWaWV3KCk7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gMDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEhvdXJDb2x1bW5MYWJlbHMoKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBob3VyQ29sdW1uTGFiZWxzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBob3VyID0gMCwgbGVuZ3RoID0gdGhpcy52aWV3c1swXS5yb3dzLmxlbmd0aDsgaG91ciA8IGxlbmd0aDsgaG91ciArPSAxKSB7XG4gICAgICAgICAgICAvLyBoYW5kbGUgZWRnZSBjYXNlIGZvciBEU1RcbiAgICAgICAgICAgIGlmIChob3VyID09PSAwICYmIHRoaXMudmlld3NbMF0ucm93c1tob3VyXVswXS50aW1lLmdldEhvdXJzKCkgIT09IHRoaXMuc3RhcnRIb3VyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGltZSA9IG5ldyBEYXRlKHRoaXMudmlld3NbMF0ucm93c1tob3VyXVswXS50aW1lKTtcbiAgICAgICAgICAgICAgICB0aW1lLnNldERhdGUodGltZS5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICAgICAgICB0aW1lLnNldEhvdXJzKHRoaXMuc3RhcnRIb3VyKTtcbiAgICAgICAgICAgICAgICBob3VyQ29sdW1uTGFiZWxzLnB1c2godGhpcy5mb3JtYXRIb3VyQ29sdW1uTGFiZWwodGltZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBob3VyQ29sdW1uTGFiZWxzLnB1c2godGhpcy5mb3JtYXRIb3VyQ29sdW1uTGFiZWwodGhpcy52aWV3c1swXS5yb3dzW2hvdXJdWzBdLnRpbWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG91ckNvbHVtbkxhYmVscztcbiAgICB9XG5cbiAgICBnZXRWaWV3RGF0YShzdGFydFRpbWU6IERhdGUpOiBJV2Vla1ZpZXcge1xuICAgICAgICBjb25zdCBkYXRlcyA9IFdlZWtWaWV3Q29tcG9uZW50LmdldERhdGVzKHN0YXJ0VGltZSwgNyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICBkYXRlc1tpXS5kYXlIZWFkZXIgPSB0aGlzLmZvcm1hdERheUhlYWRlcihkYXRlc1tpXS5kYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb3dzOiBXZWVrVmlld0NvbXBvbmVudC5jcmVhdGVEYXRlT2JqZWN0cyhzdGFydFRpbWUsIHRoaXMuc3RhcnRIb3VyLCB0aGlzLmVuZEhvdXIsIHRoaXMuaG91clNlZ21lbnRzKSxcbiAgICAgICAgICAgIGRhdGVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZ2V0UmFuZ2UoY3VycmVudERhdGU6IERhdGUpOiBJUmFuZ2Uge1xuICAgICAgICBjb25zdCB5ZWFyID0gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICAgICAgIG1vbnRoID0gY3VycmVudERhdGUuZ2V0TW9udGgoKSxcbiAgICAgICAgICAgIGRhdGUgPSBjdXJyZW50RGF0ZS5nZXREYXRlKCksXG4gICAgICAgICAgICBkYXkgPSBjdXJyZW50RGF0ZS5nZXREYXkoKTtcbiAgICAgICAgbGV0IGRpZmZlcmVuY2UgPSBkYXkgLSB0aGlzLnN0YXJ0aW5nRGF5V2VlaztcblxuICAgICAgICBpZiAoZGlmZmVyZW5jZSA8IDApIHtcbiAgICAgICAgICAgIGRpZmZlcmVuY2UgKz0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCBob3VyIHRvIDEyIHRvIGF2b2lkIERTVCBwcm9ibGVtXG4gICAgICAgIGNvbnN0IGZpcnN0RGF5T2ZXZWVrID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRhdGUgLSBkaWZmZXJlbmNlLCAxMiwgMCwgMCksXG4gICAgICAgICAgICBlbmRUaW1lID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRhdGUgLSBkaWZmZXJlbmNlICsgNywgMTIsIDAsIDApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydFRpbWU6IGZpcnN0RGF5T2ZXZWVrLFxuICAgICAgICAgICAgZW5kVGltZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIG9uRGF0YUxvYWRlZCgpIHtcbiAgICAgICAgY29uc3QgZXZlbnRTb3VyY2UgPSB0aGlzLmV2ZW50U291cmNlLFxuICAgICAgICAgICAgbGVuID0gZXZlbnRTb3VyY2UgPyBldmVudFNvdXJjZS5sZW5ndGggOiAwLFxuICAgICAgICAgICAgc3RhcnRUaW1lID0gdGhpcy5yYW5nZS5zdGFydFRpbWUsXG4gICAgICAgICAgICBlbmRUaW1lID0gdGhpcy5yYW5nZS5lbmRUaW1lLFxuICAgICAgICAgICAgdXRjU3RhcnRUaW1lID0gRGF0ZS5VVEMoc3RhcnRUaW1lLmdldEZ1bGxZZWFyKCksIHN0YXJ0VGltZS5nZXRNb250aCgpLCBzdGFydFRpbWUuZ2V0RGF0ZSgpKSxcbiAgICAgICAgICAgIHV0Y0VuZFRpbWUgPSBEYXRlLlVUQyhlbmRUaW1lLmdldEZ1bGxZZWFyKCksIGVuZFRpbWUuZ2V0TW9udGgoKSwgZW5kVGltZS5nZXREYXRlKCkpLFxuICAgICAgICAgICAgY3VycmVudFZpZXdJbmRleCA9IHRoaXMuY3VycmVudFZpZXdJbmRleCxcbiAgICAgICAgICAgIHJvd3MgPSB0aGlzLnZpZXdzW2N1cnJlbnRWaWV3SW5kZXhdLnJvd3MsXG4gICAgICAgICAgICBkYXRlcyA9IHRoaXMudmlld3NbY3VycmVudFZpZXdJbmRleF0uZGF0ZXMsXG4gICAgICAgICAgICBvbmVIb3VyID0gMzYwMDAwMCxcbiAgICAgICAgICAgIG9uZURheSA9IDg2NDAwMDAwLFxuICAgICAgICAgICAgLy8gYWRkIGFsbGRheSBlcHNcbiAgICAgICAgICAgIGVwcyA9IDAuMDE2LFxuICAgICAgICAgICAgcmFuZ2VTdGFydFJvd0luZGV4ID0gdGhpcy5zdGFydEhvdXIgKiB0aGlzLmhvdXJTZWdtZW50cyxcbiAgICAgICAgICAgIHJhbmdlRW5kUm93SW5kZXggPSB0aGlzLmVuZEhvdXIgKiB0aGlzLmhvdXJTZWdtZW50cyxcbiAgICAgICAgICAgIGFsbFJvd3MgPSAyNCAqIHRoaXMuaG91clNlZ21lbnRzO1xuICAgICAgICBsZXQgYWxsRGF5RXZlbnRJblJhbmdlID0gZmFsc2UsXG4gICAgICAgICAgICBub3JtYWxFdmVudEluUmFuZ2UgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkgKz0gMSkge1xuICAgICAgICAgICAgZGF0ZXNbaV0uZXZlbnRzID0gW107XG4gICAgICAgICAgICBkYXRlc1tpXS5oYXNFdmVudCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgZGF5ID0gMDsgZGF5IDwgNzsgZGF5ICs9IDEpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGhvdXIgPSAwOyBob3VyIDwgdGhpcy5ob3VyUmFuZ2U7IGhvdXIgKz0gMSkge1xuICAgICAgICAgICAgICAgIHJvd3NbaG91cl1bZGF5XS5ldmVudHMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBldmVudCA9IGV2ZW50U291cmNlW2ldO1xuICAgICAgICAgICAgY29uc3QgZXZlbnRTdGFydFRpbWUgPSBldmVudC5zdGFydFRpbWU7XG4gICAgICAgICAgICBjb25zdCBldmVudEVuZFRpbWUgPSBldmVudC5lbmRUaW1lO1xuXG4gICAgICAgICAgICBsZXQgZXZlbnRVVENTdGFydFRpbWU6IG51bWJlcixcbiAgICAgICAgICAgICAgICBldmVudFVUQ0VuZFRpbWU6IG51bWJlcjtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LmFsbERheSkge1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDU3RhcnRUaW1lID0gZXZlbnRTdGFydFRpbWUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDRW5kVGltZSA9IGV2ZW50RW5kVGltZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50VVRDU3RhcnRUaW1lID0gRGF0ZS5VVEMoZXZlbnRTdGFydFRpbWUuZ2V0RnVsbFllYXIoKSwgZXZlbnRTdGFydFRpbWUuZ2V0TW9udGgoKSwgZXZlbnRTdGFydFRpbWUuZ2V0RGF0ZSgpKTtcbiAgICAgICAgICAgICAgICBldmVudFVUQ0VuZFRpbWUgPSBEYXRlLlVUQyhldmVudEVuZFRpbWUuZ2V0RnVsbFllYXIoKSwgZXZlbnRFbmRUaW1lLmdldE1vbnRoKCksIGV2ZW50RW5kVGltZS5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50VVRDRW5kVGltZSA8PSB1dGNTdGFydFRpbWUgfHwgZXZlbnRVVENTdGFydFRpbWUgPj0gdXRjRW5kVGltZSB8fCBldmVudFN0YXJ0VGltZSA+PSBldmVudEVuZFRpbWUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LmFsbERheSkge1xuICAgICAgICAgICAgICAgIGFsbERheUV2ZW50SW5SYW5nZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBsZXQgYWxsRGF5U3RhcnRJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgICAgIGlmIChldmVudFVUQ1N0YXJ0VGltZSA8PSB1dGNTdGFydFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsRGF5U3RhcnRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsRGF5U3RhcnRJbmRleCA9IE1hdGgucm91bmQoKGV2ZW50VVRDU3RhcnRUaW1lIC0gdXRjU3RhcnRUaW1lKSAvIG9uZURheSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGFsbERheUVuZEluZGV4OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50VVRDRW5kVGltZSA+PSB1dGNFbmRUaW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbERheUVuZEluZGV4ID0gTWF0aC5yb3VuZCgodXRjRW5kVGltZSAtIHV0Y1N0YXJ0VGltZSkgLyBvbmVEYXkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbERheUVuZEluZGV4ID0gTWF0aC5yb3VuZCgoZXZlbnRVVENFbmRUaW1lIC0gdXRjU3RhcnRUaW1lKSAvIG9uZURheSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheUFsbERheUV2ZW50OiBJRGlzcGxheUV2ZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleDogYWxsRGF5U3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXg6IGFsbERheUVuZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBzdGFydE9mZnNldDogMCxcbiAgICAgICAgICAgICAgICAgICAgZW5kT2Zmc2V0OiAwLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogMFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBsZXQgZXZlbnRTZXQgPSBkYXRlc1thbGxEYXlTdGFydEluZGV4XS5ldmVudHM7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50U2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50U2V0LnB1c2goZGlzcGxheUFsbERheUV2ZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBldmVudFNldCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBldmVudFNldC5wdXNoKGRpc3BsYXlBbGxEYXlFdmVudCk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVzW2FsbERheVN0YXJ0SW5kZXhdLmV2ZW50cyA9IGV2ZW50U2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkYXRlc1thbGxEYXlTdGFydEluZGV4XS5oYXNFdmVudCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vcm1hbEV2ZW50SW5SYW5nZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBsZXQgdGltZURpZmZlcmVuY2VTdGFydDogbnVtYmVyO1xuICAgICAgICAgICAgICAgIGlmIChldmVudFVUQ1N0YXJ0VGltZSA8IHV0Y1N0YXJ0VGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aW1lRGlmZmVyZW5jZVN0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aW1lRGlmZmVyZW5jZVN0YXJ0ID0gKGV2ZW50VVRDU3RhcnRUaW1lIC0gdXRjU3RhcnRUaW1lKSAvIG9uZUhvdXIgKiB0aGlzLmhvdXJTZWdtZW50cyArIChldmVudFN0YXJ0VGltZS5nZXRIb3VycygpICsgZXZlbnRTdGFydFRpbWUuZ2V0TWludXRlcygpIC8gNjApICogdGhpcy5ob3VyU2VnbWVudHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHRpbWVEaWZmZXJlbmNlRW5kOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50VVRDRW5kVGltZSA+IHV0Y0VuZFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VFbmQgPSAodXRjRW5kVGltZSAtIHV0Y1N0YXJ0VGltZSkgLyBvbmVIb3VyICogdGhpcy5ob3VyU2VnbWVudHM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZURpZmZlcmVuY2VFbmQgPSAoZXZlbnRVVENFbmRUaW1lIC0gb25lRGF5IC0gdXRjU3RhcnRUaW1lKSAvIG9uZUhvdXIgKiB0aGlzLmhvdXJTZWdtZW50cyArIChldmVudEVuZFRpbWUuZ2V0SG91cnMoKSArIGV2ZW50RW5kVGltZS5nZXRNaW51dGVzKCkgLyA2MCkgKiB0aGlzLmhvdXJTZWdtZW50cztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydEluZGV4ID0gTWF0aC5mbG9vcih0aW1lRGlmZmVyZW5jZVN0YXJ0KSxcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXggPSBNYXRoLmNlaWwodGltZURpZmZlcmVuY2VFbmQgLSBlcHMpO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydFJvd0luZGV4ID0gc3RhcnRJbmRleCAlIGFsbFJvd3MsXG4gICAgICAgICAgICAgICAgICAgIGRheUluZGV4ID0gTWF0aC5mbG9vcihzdGFydEluZGV4IC8gYWxsUm93cyksXG4gICAgICAgICAgICAgICAgICAgIGVuZE9mRGF5ID0gZGF5SW5kZXggKiBhbGxSb3dzLFxuICAgICAgICAgICAgICAgICAgICBzdGFydE9mZnNldCA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGVuZE9mZnNldCA9IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ob3VyUGFydHMgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0Um93SW5kZXggPCByYW5nZVN0YXJ0Um93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2Zmc2V0ID0gTWF0aC5mbG9vcigodGltZURpZmZlcmVuY2VTdGFydCAtIHN0YXJ0SW5kZXgpICogdGhpcy5ob3VyUGFydHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBlbmRPZkRheSArPSBhbGxSb3dzO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZW5kUm93SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuZE9mRGF5IDwgZW5kSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFJvd0luZGV4ID0gYWxsUm93cztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRPZkRheSA9PT0gZW5kSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRSb3dJbmRleCA9IGFsbFJvd3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFJvd0luZGV4ID0gZW5kSW5kZXggJSBhbGxSb3dzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaG91clBhcnRzICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuZFJvd0luZGV4ID4gcmFuZ2VFbmRSb3dJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRPZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZE9mZnNldCA9IE1hdGguZmxvb3IoKGVuZEluZGV4IC0gdGltZURpZmZlcmVuY2VFbmQpICogdGhpcy5ob3VyUGFydHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRSb3dJbmRleCA8IHJhbmdlU3RhcnRSb3dJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRSb3dJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFJvd0luZGV4IC09IHJhbmdlU3RhcnRSb3dJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5kUm93SW5kZXggPiByYW5nZUVuZFJvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRSb3dJbmRleCA9IHJhbmdlRW5kUm93SW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5kUm93SW5kZXggLT0gcmFuZ2VTdGFydFJvd0luZGV4O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFJvd0luZGV4IDwgZW5kUm93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlFdmVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydEluZGV4OiBzdGFydFJvd0luZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZEluZGV4OiBlbmRSb3dJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydE9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZXZlbnRTZXQgPSByb3dzW3N0YXJ0Um93SW5kZXhdW2RheUluZGV4XS5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRTZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudFNldC5wdXNoKGRpc3BsYXlFdmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50U2V0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRTZXQucHVzaChkaXNwbGF5RXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3Nbc3RhcnRSb3dJbmRleF1bZGF5SW5kZXhdLmV2ZW50cyA9IGV2ZW50U2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZXNbZGF5SW5kZXhdLmhhc0V2ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdGFydFJvd0luZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBkYXlJbmRleCArPSAxO1xuICAgICAgICAgICAgICAgIH0gd2hpbGUgKGVuZE9mRGF5IDwgZW5kSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbEV2ZW50SW5SYW5nZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgZGF5ID0gMDsgZGF5IDwgNzsgZGF5ICs9IDEpIHtcbiAgICAgICAgICAgICAgICBsZXQgb3JkZXJlZEV2ZW50czogSURpc3BsYXlFdmVudFtdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaG91ciA9IDA7IGhvdXIgPCB0aGlzLmhvdXJSYW5nZTsgaG91ciArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyb3dzW2hvdXJdW2RheV0uZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByb3dzW2hvdXJdW2RheV0uZXZlbnRzLnNvcnQoV2Vla1ZpZXdDb21wb25lbnQuY29tcGFyZUV2ZW50QnlTdGFydE9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmRlcmVkRXZlbnRzID0gb3JkZXJlZEV2ZW50cy5jb25jYXQocm93c1tob3VyXVtkYXldLmV2ZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9yZGVyZWRFdmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYWNlRXZlbnRzKG9yZGVyZWRFdmVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbGxEYXlFdmVudEluUmFuZ2UpIHtcbiAgICAgICAgICAgIGxldCBvcmRlcmVkQWxsRGF5RXZlbnRzOiBJRGlzcGxheUV2ZW50W10gPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGRheSA9IDA7IGRheSA8IDc7IGRheSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGVzW2RheV0uZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyZWRBbGxEYXlFdmVudHMgPSBvcmRlcmVkQWxsRGF5RXZlbnRzLmNvbmNhdChkYXRlc1tkYXldLmV2ZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9yZGVyZWRBbGxEYXlFdmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhY2VBbGxEYXlFdmVudHMob3JkZXJlZEFsbERheUV2ZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5hdXRvU2VsZWN0KSB7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWREYXRlO1xuICAgICAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCA3OyByICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZXNbcl0uc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWREYXRlID0gZGF0ZXNbcl07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkRGF0ZSkge1xuICAgICAgICAgICAgICAgIGxldCBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hcmtEaXNhYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9IHRoaXMubWFya0Rpc2FibGVkKHNlbGVjdGVkRGF0ZS5kYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLm9uVGltZVNlbGVjdGVkLmVtaXQoe1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFRpbWU6IHNlbGVjdGVkRGF0ZS5kYXRlLFxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHNlbGVjdGVkRGF0ZS5ldmVudHMubWFwKGUgPT4gZS5ldmVudCksXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZWZyZXNoVmlldygpIHtcbiAgICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuZ2V0UmFuZ2UodGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGUpO1xuXG4gICAgICAgIGlmICh0aGlzLmluaXRlZCkge1xuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSB0aGlzLmdldFRpdGxlKCk7XG4gICAgICAgICAgICB0aGlzLm9uVGl0bGVDaGFuZ2VkLmVtaXQodGl0bGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnBvcHVsYXRlQWRqYWNlbnRWaWV3cyh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50Vmlldyh0aGlzLnJhbmdlLnN0YXJ0VGltZSwgdGhpcy52aWV3c1t0aGlzLmN1cnJlbnRWaWV3SW5kZXhdKTtcbiAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2UucmFuZ2VDaGFuZ2VkKHRoaXMpO1xuICAgIH1cblxuICAgIGdldFRpdGxlKCk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGZpcnN0RGF5T2ZXZWVrID0gbmV3IERhdGUodGhpcy5yYW5nZS5zdGFydFRpbWUuZ2V0VGltZSgpKTtcbiAgICAgICAgZmlyc3REYXlPZldlZWsuc2V0SG91cnMoMTIsIDAsIDAsIDApO1xuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXRUaXRsZShmaXJzdERheU9mV2Vlayk7XG4gICAgfVxuXG4gICAgZ2V0SGlnaGxpZ2h0Q2xhc3MoZGF0ZTogSVdlZWtWaWV3RGF0ZVJvdyk6IHN0cmluZyB7XG4gICAgICAgIGxldCBjbGFzc05hbWUgPSAnJztcblxuICAgICAgICBpZiAoZGF0ZS5oYXNFdmVudCkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSAnICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGFzc05hbWUgPSAnd2Vla3ZpZXctd2l0aC1ldmVudCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0ZS5zZWxlY3RlZCkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSArPSAnICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGFzc05hbWUgKz0gJ3dlZWt2aWV3LXNlbGVjdGVkJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRlLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgKz0gJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xhc3NOYW1lICs9ICd3ZWVrdmlldy1jdXJyZW50JztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgc2VsZWN0KHNlbGVjdGVkVGltZTogRGF0ZSwgZXZlbnRzOiBJRGlzcGxheUV2ZW50W10pIHtcbiAgICAgICAgbGV0IGRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLm1hcmtEaXNhYmxlZCkge1xuICAgICAgICAgICAgZGlzYWJsZWQgPSB0aGlzLm1hcmtEaXNhYmxlZChzZWxlY3RlZFRpbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vblRpbWVTZWxlY3RlZC5lbWl0KHtcbiAgICAgICAgICAgIHNlbGVjdGVkVGltZSxcbiAgICAgICAgICAgIGV2ZW50czogZXZlbnRzLm1hcChlID0+IGUuZXZlbnQpLFxuICAgICAgICAgICAgZGlzYWJsZWRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcGxhY2VFdmVudHMob3JkZXJlZEV2ZW50czogSURpc3BsYXlFdmVudFtdKSB7XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUG9zaXRpb24ob3JkZXJlZEV2ZW50cyk7XG4gICAgICAgIFdlZWtWaWV3Q29tcG9uZW50LmNhbGN1bGF0ZVdpZHRoKG9yZGVyZWRFdmVudHMsIHRoaXMuaG91clJhbmdlLCB0aGlzLmhvdXJQYXJ0cyk7XG4gICAgfVxuXG4gICAgcGxhY2VBbGxEYXlFdmVudHMob3JkZXJlZEV2ZW50czogSURpc3BsYXlFdmVudFtdKSB7XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUG9zaXRpb24ob3JkZXJlZEV2ZW50cyk7XG4gICAgfVxuXG4gICAgb3ZlcmxhcChldmVudDE6IElEaXNwbGF5RXZlbnQsIGV2ZW50MjogSURpc3BsYXlFdmVudCk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgZWFybHlFdmVudCA9IGV2ZW50MSxcbiAgICAgICAgICAgIGxhdGVFdmVudCA9IGV2ZW50MjtcbiAgICAgICAgaWYgKGV2ZW50MS5zdGFydEluZGV4ID4gZXZlbnQyLnN0YXJ0SW5kZXggfHwgKGV2ZW50MS5zdGFydEluZGV4ID09PSBldmVudDIuc3RhcnRJbmRleCAmJiBldmVudDEuc3RhcnRPZmZzZXQgPiBldmVudDIuc3RhcnRPZmZzZXQpKSB7XG4gICAgICAgICAgICBlYXJseUV2ZW50ID0gZXZlbnQyO1xuICAgICAgICAgICAgbGF0ZUV2ZW50ID0gZXZlbnQxO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVhcmx5RXZlbnQuZW5kSW5kZXggPD0gbGF0ZUV2ZW50LnN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAhKGVhcmx5RXZlbnQuZW5kSW5kZXggLSBsYXRlRXZlbnQuc3RhcnRJbmRleCA9PT0gMSAmJiBlYXJseUV2ZW50LmVuZE9mZnNldCArIGxhdGVFdmVudC5zdGFydE9mZnNldCA+PSB0aGlzLmhvdXJQYXJ0cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYWxjdWxhdGVQb3NpdGlvbihldmVudHM6IElEaXNwbGF5RXZlbnRbXSkge1xuICAgICAgICBjb25zdCBsZW4gPSBldmVudHMubGVuZ3RoLFxuICAgICAgICAgICAgaXNGb3JiaWRkZW4gPSBuZXcgQXJyYXkobGVuKTtcbiAgICAgICAgbGV0IG1heENvbHVtbiA9IDA7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgbGV0IGNvbDogbnVtYmVyO1xuICAgICAgICAgICAgZm9yIChjb2wgPSAwOyBjb2wgPCBtYXhDb2x1bW47IGNvbCArPSAxKSB7XG4gICAgICAgICAgICAgICAgaXNGb3JiaWRkZW5bY29sXSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vdmVybGFwKGV2ZW50c1tpXSwgZXZlbnRzW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICBpc0ZvcmJpZGRlbltldmVudHNbal0ucG9zaXRpb25dID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbCA9IDA7IGNvbCA8IG1heENvbHVtbjsgY29sICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRm9yYmlkZGVuW2NvbF0pIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbCA8IG1heENvbHVtbikge1xuICAgICAgICAgICAgICAgIGV2ZW50c1tpXS5wb3NpdGlvbiA9IGNvbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW2ldLnBvc2l0aW9uID0gbWF4Q29sdW1uKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kaXIgPT09ICdydGwnKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW2ldLnBvc2l0aW9uID0gbWF4Q29sdW1uIC0gMSAtIGV2ZW50c1tpXS5wb3NpdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUN1cnJlbnRWaWV3KGN1cnJlbnRWaWV3U3RhcnREYXRlOiBEYXRlLCB2aWV3OiBJV2Vla1ZpZXcpIHtcbiAgICAgICAgY29uc3QgY3VycmVudENhbGVuZGFyRGF0ZSA9IHRoaXMuY2FsZW5kYXJTZXJ2aWNlLmN1cnJlbnREYXRlLFxuICAgICAgICAgICAgdG9kYXkgPSBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgb25lRGF5ID0gODY0MDAwMDAsXG4gICAgICAgICAgICBzZWxlY3RlZERheURpZmZlcmVuY2UgPSBNYXRoLnJvdW5kKChEYXRlLlVUQyhjdXJyZW50Q2FsZW5kYXJEYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnRDYWxlbmRhckRhdGUuZ2V0TW9udGgoKSwgY3VycmVudENhbGVuZGFyRGF0ZS5nZXREYXRlKCkpIC0gRGF0ZS5VVEMoY3VycmVudFZpZXdTdGFydERhdGUuZ2V0RnVsbFllYXIoKSwgY3VycmVudFZpZXdTdGFydERhdGUuZ2V0TW9udGgoKSwgY3VycmVudFZpZXdTdGFydERhdGUuZ2V0RGF0ZSgpKSkgLyBvbmVEYXkpLFxuICAgICAgICAgICAgY3VycmVudERheURpZmZlcmVuY2UgPSBNYXRoLmZsb29yKChEYXRlLlVUQyh0b2RheS5nZXRGdWxsWWVhcigpLCB0b2RheS5nZXRNb250aCgpLCB0b2RheS5nZXREYXRlKCkpIC0gRGF0ZS5VVEMoY3VycmVudFZpZXdTdGFydERhdGUuZ2V0RnVsbFllYXIoKSwgY3VycmVudFZpZXdTdGFydERhdGUuZ2V0TW9udGgoKSwgY3VycmVudFZpZXdTdGFydERhdGUuZ2V0RGF0ZSgpKSkgLyBvbmVEYXkpO1xuXG4gICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgNzsgciArPSAxKSB7XG4gICAgICAgICAgICB2aWV3LmRhdGVzW3JdLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZWN0ZWREYXlEaWZmZXJlbmNlID49IDAgJiYgc2VsZWN0ZWREYXlEaWZmZXJlbmNlIDwgNyAmJiB0aGlzLmF1dG9TZWxlY3QpIHtcbiAgICAgICAgICAgIHZpZXcuZGF0ZXNbc2VsZWN0ZWREYXlEaWZmZXJlbmNlXS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3VycmVudERheURpZmZlcmVuY2UgPj0gMCAmJiBjdXJyZW50RGF5RGlmZmVyZW5jZSA8IDcpIHtcbiAgICAgICAgICAgIHZpZXcuZGF0ZXNbY3VycmVudERheURpZmZlcmVuY2VdLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGF5U2VsZWN0ZWQodmlld0RhdGU6IElXZWVrVmlld0RhdGVSb3cpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWREYXRlID0gdmlld0RhdGUuZGF0ZSxcbiAgICAgICAgICAgIGRhdGVzID0gdGhpcy52aWV3c1t0aGlzLmN1cnJlbnRWaWV3SW5kZXhdLmRhdGVzLFxuICAgICAgICAgICAgY3VycmVudFZpZXdTdGFydERhdGUgPSB0aGlzLnJhbmdlLnN0YXJ0VGltZSxcbiAgICAgICAgICAgIG9uZURheSA9IDg2NDAwMDAwLFxuICAgICAgICAgICAgc2VsZWN0ZWREYXlEaWZmZXJlbmNlID0gTWF0aC5yb3VuZCgoRGF0ZS5VVEMoc2VsZWN0ZWREYXRlLmdldEZ1bGxZZWFyKCksIHNlbGVjdGVkRGF0ZS5nZXRNb250aCgpLCBzZWxlY3RlZERhdGUuZ2V0RGF0ZSgpKSAtIERhdGUuVVRDKGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldEZ1bGxZZWFyKCksIGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldE1vbnRoKCksIGN1cnJlbnRWaWV3U3RhcnREYXRlLmdldERhdGUoKSkpIC8gb25lRGF5KTtcblxuICAgICAgICB0aGlzLmNhbGVuZGFyU2VydmljZS5zZXRDdXJyZW50RGF0ZShzZWxlY3RlZERhdGUpO1xuXG4gICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgNzsgciArPSAxKSB7XG4gICAgICAgICAgICBkYXRlc1tyXS5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGVjdGVkRGF5RGlmZmVyZW5jZSA+PSAwICYmIHNlbGVjdGVkRGF5RGlmZmVyZW5jZSA8IDcpIHtcbiAgICAgICAgICAgIGRhdGVzW3NlbGVjdGVkRGF5RGlmZmVyZW5jZV0uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLm1hcmtEaXNhYmxlZCkge1xuICAgICAgICAgICAgZGlzYWJsZWQgPSB0aGlzLm1hcmtEaXNhYmxlZChzZWxlY3RlZERhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vbkRheUhlYWRlclNlbGVjdGVkLmVtaXQoe3NlbGVjdGVkVGltZTogc2VsZWN0ZWREYXRlLCBldmVudHM6IHZpZXdEYXRlLmV2ZW50cy5tYXAoZSA9PiBlLmV2ZW50KSwgZGlzYWJsZWR9KTtcbiAgICB9XG5cbiAgICBzZXRTY3JvbGxQb3NpdGlvbihzY3JvbGxQb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdFNjcm9sbFBvc2l0aW9uID0gc2Nyb2xsUG9zaXRpb247XG4gICAgfVxufVxuIl19