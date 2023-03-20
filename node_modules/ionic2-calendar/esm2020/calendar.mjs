import { Component, EventEmitter, Input, Output, Inject, LOCALE_ID } from '@angular/core';
import { CalendarService } from './calendar.service';
import SwiperCore from 'swiper';
import { IonicSlides } from '@ionic/angular';
import { Step } from './calendar.interface';
import * as i0 from "@angular/core";
import * as i1 from "./calendar.service";
import * as i2 from "@ionic/angular";
import * as i3 from "@angular/common";
import * as i4 from "./monthview";
import * as i5 from "./weekview";
import * as i6 from "./dayview";
SwiperCore.use([IonicSlides]);
export class CalendarComponent {
    get currentDate() {
        return this._currentDate;
    }
    set currentDate(val) {
        if (!val) {
            val = new Date();
        }
        this._currentDate = val;
        this.calendarService.setCurrentDate(val, true);
        this.onCurrentDateChanged.emit(this._currentDate);
    }
    constructor(calendarService, appLocale, ngZone) {
        this.calendarService = calendarService;
        this.appLocale = appLocale;
        this.ngZone = ngZone;
        this.eventSource = [];
        this.calendarMode = 'month';
        this.formatDay = 'd';
        this.formatDayHeader = 'EEE';
        this.formatDayTitle = 'MMMM dd, yyyy';
        this.formatWeekTitle = 'MMMM yyyy, \'Week\' w';
        this.formatMonthTitle = 'MMMM yyyy';
        this.formatWeekViewDayHeader = 'EEE d';
        this.formatHourColumn = 'ha';
        this.showEventDetail = true;
        this.startingDayMonth = 0;
        this.startingDayWeek = 0;
        this.allDayLabel = 'all day';
        this.noEventsLabel = 'No Events';
        this.queryMode = 'local';
        this.step = Step.Hour;
        this.timeInterval = 60;
        this.autoSelect = true;
        this.dir = "";
        this.scrollToHour = 0;
        this.preserveScrollPosition = false;
        this.lockSwipeToPrev = false;
        this.lockSwipeToNext = false;
        this.lockSwipes = false;
        this.locale = "";
        this.startHour = 0;
        this.endHour = 24;
        this.onCurrentDateChanged = new EventEmitter();
        this.onRangeChanged = new EventEmitter();
        this.onEventSelected = new EventEmitter();
        this.onTimeSelected = new EventEmitter();
        this.onDayHeaderSelected = new EventEmitter();
        this.onTitleChanged = new EventEmitter(true);
        this._currentDate = new Date();
        this.hourParts = 1;
        this.hourSegments = 1;
        this.locale = appLocale;
    }
    ngOnInit() {
        if (this.autoSelect) {
            if (this.autoSelect.toString() === 'false') {
                this.autoSelect = false;
            }
            else {
                this.autoSelect = true;
            }
        }
        this.hourSegments = 60 / this.timeInterval;
        this.hourParts = 60 / this.step;
        if (this.hourParts <= this.hourSegments) {
            this.hourParts = 1;
        }
        else {
            this.hourParts = this.hourParts / this.hourSegments;
        }
        this.startHour = parseInt(this.startHour.toString());
        this.endHour = parseInt(this.endHour.toString());
        this.calendarService.queryMode = this.queryMode;
        this.currentDateChangedFromChildrenSubscription = this.calendarService.currentDateChangedFromChildren$.subscribe(currentDate => {
            this._currentDate = currentDate;
            this.onCurrentDateChanged.emit(currentDate);
        });
    }
    ngOnDestroy() {
        if (this.currentDateChangedFromChildrenSubscription) {
            this.currentDateChangedFromChildrenSubscription.unsubscribe();
            this.currentDateChangedFromChildrenSubscription = undefined;
        }
    }
    rangeChanged(range) {
        this.onRangeChanged.emit(range);
    }
    eventSelected(event) {
        this.onEventSelected.emit(event);
    }
    timeSelected(timeSelected) {
        this.onTimeSelected.emit(timeSelected);
    }
    daySelected(daySelected) {
        this.onDayHeaderSelected.emit(daySelected);
    }
    titleChanged(title) {
        this.onTitleChanged.emit(title);
    }
    loadEvents() {
        this.calendarService.loadEvents();
    }
    slideNext() {
        this.calendarService.slide(1);
    }
    slidePrev() {
        this.calendarService.slide(-1);
    }
    update() {
        this.calendarService.update();
    }
}
CalendarComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: CalendarComponent, deps: [{ token: i1.CalendarService }, { token: LOCALE_ID }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
CalendarComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.1.2", type: CalendarComponent, selector: "calendar", inputs: { currentDate: "currentDate", eventSource: "eventSource", calendarMode: "calendarMode", formatDay: "formatDay", formatDayHeader: "formatDayHeader", formatDayTitle: "formatDayTitle", formatWeekTitle: "formatWeekTitle", formatMonthTitle: "formatMonthTitle", formatWeekViewDayHeader: "formatWeekViewDayHeader", formatHourColumn: "formatHourColumn", showEventDetail: "showEventDetail", startingDayMonth: "startingDayMonth", startingDayWeek: "startingDayWeek", allDayLabel: "allDayLabel", noEventsLabel: "noEventsLabel", queryMode: "queryMode", step: "step", timeInterval: "timeInterval", autoSelect: "autoSelect", markDisabled: "markDisabled", monthviewDisplayEventTemplate: "monthviewDisplayEventTemplate", monthviewInactiveDisplayEventTemplate: "monthviewInactiveDisplayEventTemplate", monthviewEventDetailTemplate: "monthviewEventDetailTemplate", weekviewHeaderTemplate: "weekviewHeaderTemplate", weekviewAllDayEventTemplate: "weekviewAllDayEventTemplate", weekviewNormalEventTemplate: "weekviewNormalEventTemplate", dayviewAllDayEventTemplate: "dayviewAllDayEventTemplate", dayviewNormalEventTemplate: "dayviewNormalEventTemplate", weekviewAllDayEventSectionTemplate: "weekviewAllDayEventSectionTemplate", weekviewNormalEventSectionTemplate: "weekviewNormalEventSectionTemplate", dayviewAllDayEventSectionTemplate: "dayviewAllDayEventSectionTemplate", dayviewNormalEventSectionTemplate: "dayviewNormalEventSectionTemplate", weekviewInactiveAllDayEventSectionTemplate: "weekviewInactiveAllDayEventSectionTemplate", weekviewInactiveNormalEventSectionTemplate: "weekviewInactiveNormalEventSectionTemplate", dayviewInactiveAllDayEventSectionTemplate: "dayviewInactiveAllDayEventSectionTemplate", dayviewInactiveNormalEventSectionTemplate: "dayviewInactiveNormalEventSectionTemplate", dateFormatter: "dateFormatter", dir: "dir", scrollToHour: "scrollToHour", preserveScrollPosition: "preserveScrollPosition", lockSwipeToPrev: "lockSwipeToPrev", lockSwipeToNext: "lockSwipeToNext", lockSwipes: "lockSwipes", locale: "locale", startHour: "startHour", endHour: "endHour", sliderOptions: "sliderOptions" }, outputs: { onCurrentDateChanged: "onCurrentDateChanged", onRangeChanged: "onRangeChanged", onEventSelected: "onEventSelected", onTimeSelected: "onTimeSelected", onDayHeaderSelected: "onDayHeaderSelected", onTitleChanged: "onTitleChanged" }, providers: [CalendarService], ngImport: i0, template: `
        <ng-template #monthviewDefaultDisplayEventTemplate let-view="view" let-row="row" let-col="col">
            {{view.dates[row*7+col].label}}
        </ng-template>
        <ng-template #monthviewDefaultEventDetailTemplate let-showEventDetail="showEventDetail" let-selectedDate="selectedDate" let-noEventsLabel="noEventsLabel">
            <ion-list class="event-detail-container" has-bouncing="false" *ngIf="showEventDetail" overflow-scroll="false">
                <ion-item *ngFor="let event of selectedDate?.events" (click)="eventSelected(event)">
                        <span *ngIf="!event.allDay" class="monthview-eventdetail-timecolumn">{{event.startTime|date: 'HH:mm'}}
                            -
                            {{event.endTime|date: 'HH:mm'}}
                        </span>
                    <span *ngIf="event.allDay" class="monthview-eventdetail-timecolumn">{{allDayLabel}}</span>
                    <span class="event-detail">  |  {{event.title}}</span>
                </ion-item>
                <ion-item *ngIf="selectedDate?.events.length==0">
                    <div class="no-events-label">{{noEventsLabel}}</div>
                </ion-item>
            </ion-list>
        </ng-template>
        <ng-template #defaultWeekviewHeaderTemplate let-viewDate="viewDate">
            {{ viewDate.dayHeader }}
        </ng-template>
        <ng-template #defaultAllDayEventTemplate let-displayEvent="displayEvent">
            <div class="calendar-event-inner">{{displayEvent.event.title}}</div>
        </ng-template>
        <ng-template #defaultNormalEventTemplate let-displayEvent="displayEvent">
            <div class="calendar-event-inner">{{displayEvent.event.title}}</div>
        </ng-template>
        <ng-template #defaultWeekViewAllDayEventSectionTemplate let-day="day" let-eventTemplate="eventTemplate">
            <div [ngClass]="{'calendar-event-wrap': day.events}" *ngIf="day.events"
                 [ngStyle]="{height: 25*day.events.length+'px'}">
                <div *ngFor="let displayEvent of day.events" class="calendar-event" tappable
                     (click)="eventSelected(displayEvent.event)"
                     [ngStyle]="{top: 25*displayEvent.position+'px', width: 100*(displayEvent.endIndex-displayEvent.startIndex)+'%', height: '25px'}">
                    <ng-template [ngTemplateOutlet]="eventTemplate"
                                 [ngTemplateOutletContext]="{displayEvent:displayEvent}">
                    </ng-template>
                </div>
            </div>
        </ng-template>
        <ng-template #defaultDayViewAllDayEventSectionTemplate let-allDayEvents="allDayEvents" let-eventTemplate="eventTemplate">
            <div *ngFor="let displayEvent of allDayEvents; let eventIndex=index"
                 class="calendar-event" tappable
                 (click)="eventSelected(displayEvent.event)"
                 [ngStyle]="{top: 25*eventIndex+'px',width: '100%',height:'25px'}">
                <ng-template [ngTemplateOutlet]="eventTemplate"
                             [ngTemplateOutletContext]="{displayEvent:displayEvent}">
                </ng-template>
            </div>
        </ng-template>
        <ng-template #defaultNormalEventSectionTemplate let-tm="tm" let-hourParts="hourParts" let-eventTemplate="eventTemplate">
            <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                <div *ngFor="let displayEvent of tm.events" class="calendar-event" tappable
                     (click)="eventSelected(displayEvent.event)"
                     [ngStyle]="{top: (37*displayEvent.startOffset/hourParts)+'px',left: 100/displayEvent.overlapNumber*displayEvent.position+'%', width: 100/displayEvent.overlapNumber+'%', height: 37*(displayEvent.endIndex -displayEvent.startIndex - (displayEvent.endOffset + displayEvent.startOffset)/hourParts)+'px'}">
                    <ng-template [ngTemplateOutlet]="eventTemplate"
                                 [ngTemplateOutletContext]="{displayEvent:displayEvent}">
                    </ng-template>
                </div>
            </div>
        </ng-template>
        <ng-template #defaultInactiveAllDayEventSectionTemplate>
        </ng-template>
        <ng-template #defaultInactiveNormalEventSectionTemplate>
        </ng-template>

        <div [ngSwitch]="calendarMode" class="{{calendarMode}}view-container">
            <monthview *ngSwitchCase="'month'"
                [formatDay]="formatDay"
                [formatDayHeader]="formatDayHeader"
                [formatMonthTitle]="formatMonthTitle"
                [startingDayMonth]="startingDayMonth"
                [showEventDetail]="showEventDetail"
                [noEventsLabel]="noEventsLabel"
                [autoSelect]="autoSelect"
                [eventSource]="eventSource"
                [markDisabled]="markDisabled"
                [monthviewDisplayEventTemplate]="monthviewDisplayEventTemplate||monthviewDefaultDisplayEventTemplate"
                [monthviewInactiveDisplayEventTemplate]="monthviewInactiveDisplayEventTemplate||monthviewDefaultDisplayEventTemplate"
                [monthviewEventDetailTemplate]="monthviewEventDetailTemplate||monthviewDefaultEventDetailTemplate"
                [locale]="locale"
                [dateFormatter]="dateFormatter"
                [dir]="dir"
                [lockSwipeToPrev]="lockSwipeToPrev"
                [lockSwipeToNext]="lockSwipeToNext"
                [lockSwipes]="lockSwipes"
                [sliderOptions]="sliderOptions"
                (onRangeChanged)="rangeChanged($event)"
                (onEventSelected)="eventSelected($event)"
                (onTimeSelected)="timeSelected($event)"
                (onTitleChanged)="titleChanged($event)">
            </monthview>
            <weekview *ngSwitchCase="'week'"
                [formatWeekTitle]="formatWeekTitle"
                [formatWeekViewDayHeader]="formatWeekViewDayHeader"
                [formatHourColumn]="formatHourColumn"
                [startingDayWeek]="startingDayWeek"
                [allDayLabel]="allDayLabel"
                [hourParts]="hourParts"
                [autoSelect]="autoSelect"
                [hourSegments]="hourSegments"
                [eventSource]="eventSource"
                [markDisabled]="markDisabled"
                [weekviewHeaderTemplate]="weekviewHeaderTemplate||defaultWeekviewHeaderTemplate"
                [weekviewAllDayEventTemplate]="weekviewAllDayEventTemplate||defaultAllDayEventTemplate"
                [weekviewNormalEventTemplate]="weekviewNormalEventTemplate||defaultNormalEventTemplate"
                [weekviewAllDayEventSectionTemplate]="weekviewAllDayEventSectionTemplate||defaultWeekViewAllDayEventSectionTemplate"
                [weekviewNormalEventSectionTemplate]="weekviewNormalEventSectionTemplate||defaultNormalEventSectionTemplate"
                [weekviewInactiveAllDayEventSectionTemplate]="weekviewInactiveAllDayEventSectionTemplate||defaultInactiveAllDayEventSectionTemplate"
                [weekviewInactiveNormalEventSectionTemplate]="weekviewInactiveNormalEventSectionTemplate||defaultInactiveNormalEventSectionTemplate"
                [locale]="locale"
                [dateFormatter]="dateFormatter"
                [dir]="dir"
                [scrollToHour]="scrollToHour"
                [preserveScrollPosition]="preserveScrollPosition"
                [lockSwipeToPrev]="lockSwipeToPrev"
                [lockSwipeToNext]="lockSwipeToNext"
                [lockSwipes]="lockSwipes"
                [startHour]="startHour"
                [endHour]="endHour"
                [sliderOptions]="sliderOptions"
                (onRangeChanged)="rangeChanged($event)"
                (onEventSelected)="eventSelected($event)"
                (onDayHeaderSelected)="daySelected($event)"
                (onTimeSelected)="timeSelected($event)"
                (onTitleChanged)="titleChanged($event)">
            </weekview>
            <dayview *ngSwitchCase="'day'"
                [formatDayTitle]="formatDayTitle"
                [formatHourColumn]="formatHourColumn"
                [allDayLabel]="allDayLabel"
                [hourParts]="hourParts"
                [hourSegments]="hourSegments"
                [eventSource]="eventSource"
                [markDisabled]="markDisabled"
                [dayviewAllDayEventTemplate]="dayviewAllDayEventTemplate||defaultAllDayEventTemplate"
                [dayviewNormalEventTemplate]="dayviewNormalEventTemplate||defaultNormalEventTemplate"
                [dayviewAllDayEventSectionTemplate]="dayviewAllDayEventSectionTemplate||defaultDayViewAllDayEventSectionTemplate"
                [dayviewNormalEventSectionTemplate]="dayviewNormalEventSectionTemplate||defaultNormalEventSectionTemplate"
                [dayviewInactiveAllDayEventSectionTemplate]="dayviewInactiveAllDayEventSectionTemplate||defaultInactiveAllDayEventSectionTemplate"
                [dayviewInactiveNormalEventSectionTemplate]="dayviewInactiveNormalEventSectionTemplate||defaultInactiveNormalEventSectionTemplate"
                [locale]="locale"
                [dateFormatter]="dateFormatter"
                [dir]="dir"
                [scrollToHour]="scrollToHour"
                [preserveScrollPosition]="preserveScrollPosition"
                [lockSwipeToPrev]="lockSwipeToPrev"
                [lockSwipeToNext]="lockSwipeToNext"
                [lockSwipes]="lockSwipes"
                [startHour]="startHour"
                [endHour]="endHour"
                [sliderOptions]="sliderOptions"
                (onRangeChanged)="rangeChanged($event)"
                (onEventSelected)="eventSelected($event)"
                (onTimeSelected)="timeSelected($event)"
                (onTitleChanged)="titleChanged($event)">
            </dayview>
        </div>
    `, isInline: true, styles: [":host>div{height:100%}.event-detail-container{border-top:2px darkgrey solid}.no-events-label{font-weight:700;color:#a9a9a9;text-align:center}.event-detail{cursor:pointer;white-space:nowrap;text-overflow:ellipsis}.monthview-eventdetail-timecolumn{width:110px;overflow:hidden}.calendar-event-inner{overflow:hidden;background-color:#3a87ad;color:#fff;height:100%;width:100%;padding:2px;line-height:15px;text-align:initial}@media (max-width: 750px){.calendar-event-inner{font-size:12px}}\n"], dependencies: [{ kind: "component", type: i2.IonItem, selector: "ion-item", inputs: ["button", "color", "counter", "counterFormatter", "detail", "detailIcon", "disabled", "download", "fill", "href", "lines", "mode", "rel", "routerAnimation", "routerDirection", "shape", "target", "type"] }, { kind: "component", type: i2.IonList, selector: "ion-list", inputs: ["inset", "lines", "mode"] }, { kind: "directive", type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i3.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "directive", type: i3.NgSwitch, selector: "[ngSwitch]", inputs: ["ngSwitch"] }, { kind: "directive", type: i3.NgSwitchCase, selector: "[ngSwitchCase]", inputs: ["ngSwitchCase"] }, { kind: "component", type: i4.MonthViewComponent, selector: "monthview", inputs: ["monthviewDisplayEventTemplate", "monthviewInactiveDisplayEventTemplate", "monthviewEventDetailTemplate", "formatDay", "formatDayHeader", "formatMonthTitle", "eventSource", "startingDayMonth", "showEventDetail", "noEventsLabel", "autoSelect", "markDisabled", "locale", "dateFormatter", "dir", "lockSwipeToPrev", "lockSwipeToNext", "lockSwipes", "sliderOptions"], outputs: ["onRangeChanged", "onEventSelected", "onTimeSelected", "onTitleChanged"] }, { kind: "component", type: i5.WeekViewComponent, selector: "weekview", inputs: ["weekviewHeaderTemplate", "weekviewAllDayEventTemplate", "weekviewNormalEventTemplate", "weekviewAllDayEventSectionTemplate", "weekviewNormalEventSectionTemplate", "weekviewInactiveAllDayEventSectionTemplate", "weekviewInactiveNormalEventSectionTemplate", "formatWeekTitle", "formatWeekViewDayHeader", "formatHourColumn", "startingDayWeek", "allDayLabel", "hourParts", "eventSource", "autoSelect", "markDisabled", "locale", "dateFormatter", "dir", "scrollToHour", "preserveScrollPosition", "lockSwipeToPrev", "lockSwipeToNext", "lockSwipes", "startHour", "endHour", "sliderOptions", "hourSegments"], outputs: ["onRangeChanged", "onEventSelected", "onTimeSelected", "onDayHeaderSelected", "onTitleChanged"] }, { kind: "component", type: i6.DayViewComponent, selector: "dayview", inputs: ["dayviewAllDayEventTemplate", "dayviewNormalEventTemplate", "dayviewAllDayEventSectionTemplate", "dayviewNormalEventSectionTemplate", "dayviewInactiveAllDayEventSectionTemplate", "dayviewInactiveNormalEventSectionTemplate", "formatHourColumn", "formatDayTitle", "allDayLabel", "hourParts", "eventSource", "markDisabled", "locale", "dateFormatter", "dir", "scrollToHour", "preserveScrollPosition", "lockSwipeToPrev", "lockSwipeToNext", "lockSwipes", "startHour", "endHour", "sliderOptions", "hourSegments"], outputs: ["onRangeChanged", "onEventSelected", "onTimeSelected", "onTitleChanged"] }, { kind: "pipe", type: i3.DatePipe, name: "date" }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: CalendarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'calendar', template: `
        <ng-template #monthviewDefaultDisplayEventTemplate let-view="view" let-row="row" let-col="col">
            {{view.dates[row*7+col].label}}
        </ng-template>
        <ng-template #monthviewDefaultEventDetailTemplate let-showEventDetail="showEventDetail" let-selectedDate="selectedDate" let-noEventsLabel="noEventsLabel">
            <ion-list class="event-detail-container" has-bouncing="false" *ngIf="showEventDetail" overflow-scroll="false">
                <ion-item *ngFor="let event of selectedDate?.events" (click)="eventSelected(event)">
                        <span *ngIf="!event.allDay" class="monthview-eventdetail-timecolumn">{{event.startTime|date: 'HH:mm'}}
                            -
                            {{event.endTime|date: 'HH:mm'}}
                        </span>
                    <span *ngIf="event.allDay" class="monthview-eventdetail-timecolumn">{{allDayLabel}}</span>
                    <span class="event-detail">  |  {{event.title}}</span>
                </ion-item>
                <ion-item *ngIf="selectedDate?.events.length==0">
                    <div class="no-events-label">{{noEventsLabel}}</div>
                </ion-item>
            </ion-list>
        </ng-template>
        <ng-template #defaultWeekviewHeaderTemplate let-viewDate="viewDate">
            {{ viewDate.dayHeader }}
        </ng-template>
        <ng-template #defaultAllDayEventTemplate let-displayEvent="displayEvent">
            <div class="calendar-event-inner">{{displayEvent.event.title}}</div>
        </ng-template>
        <ng-template #defaultNormalEventTemplate let-displayEvent="displayEvent">
            <div class="calendar-event-inner">{{displayEvent.event.title}}</div>
        </ng-template>
        <ng-template #defaultWeekViewAllDayEventSectionTemplate let-day="day" let-eventTemplate="eventTemplate">
            <div [ngClass]="{'calendar-event-wrap': day.events}" *ngIf="day.events"
                 [ngStyle]="{height: 25*day.events.length+'px'}">
                <div *ngFor="let displayEvent of day.events" class="calendar-event" tappable
                     (click)="eventSelected(displayEvent.event)"
                     [ngStyle]="{top: 25*displayEvent.position+'px', width: 100*(displayEvent.endIndex-displayEvent.startIndex)+'%', height: '25px'}">
                    <ng-template [ngTemplateOutlet]="eventTemplate"
                                 [ngTemplateOutletContext]="{displayEvent:displayEvent}">
                    </ng-template>
                </div>
            </div>
        </ng-template>
        <ng-template #defaultDayViewAllDayEventSectionTemplate let-allDayEvents="allDayEvents" let-eventTemplate="eventTemplate">
            <div *ngFor="let displayEvent of allDayEvents; let eventIndex=index"
                 class="calendar-event" tappable
                 (click)="eventSelected(displayEvent.event)"
                 [ngStyle]="{top: 25*eventIndex+'px',width: '100%',height:'25px'}">
                <ng-template [ngTemplateOutlet]="eventTemplate"
                             [ngTemplateOutletContext]="{displayEvent:displayEvent}">
                </ng-template>
            </div>
        </ng-template>
        <ng-template #defaultNormalEventSectionTemplate let-tm="tm" let-hourParts="hourParts" let-eventTemplate="eventTemplate">
            <div [ngClass]="{'calendar-event-wrap': tm.events}" *ngIf="tm.events">
                <div *ngFor="let displayEvent of tm.events" class="calendar-event" tappable
                     (click)="eventSelected(displayEvent.event)"
                     [ngStyle]="{top: (37*displayEvent.startOffset/hourParts)+'px',left: 100/displayEvent.overlapNumber*displayEvent.position+'%', width: 100/displayEvent.overlapNumber+'%', height: 37*(displayEvent.endIndex -displayEvent.startIndex - (displayEvent.endOffset + displayEvent.startOffset)/hourParts)+'px'}">
                    <ng-template [ngTemplateOutlet]="eventTemplate"
                                 [ngTemplateOutletContext]="{displayEvent:displayEvent}">
                    </ng-template>
                </div>
            </div>
        </ng-template>
        <ng-template #defaultInactiveAllDayEventSectionTemplate>
        </ng-template>
        <ng-template #defaultInactiveNormalEventSectionTemplate>
        </ng-template>

        <div [ngSwitch]="calendarMode" class="{{calendarMode}}view-container">
            <monthview *ngSwitchCase="'month'"
                [formatDay]="formatDay"
                [formatDayHeader]="formatDayHeader"
                [formatMonthTitle]="formatMonthTitle"
                [startingDayMonth]="startingDayMonth"
                [showEventDetail]="showEventDetail"
                [noEventsLabel]="noEventsLabel"
                [autoSelect]="autoSelect"
                [eventSource]="eventSource"
                [markDisabled]="markDisabled"
                [monthviewDisplayEventTemplate]="monthviewDisplayEventTemplate||monthviewDefaultDisplayEventTemplate"
                [monthviewInactiveDisplayEventTemplate]="monthviewInactiveDisplayEventTemplate||monthviewDefaultDisplayEventTemplate"
                [monthviewEventDetailTemplate]="monthviewEventDetailTemplate||monthviewDefaultEventDetailTemplate"
                [locale]="locale"
                [dateFormatter]="dateFormatter"
                [dir]="dir"
                [lockSwipeToPrev]="lockSwipeToPrev"
                [lockSwipeToNext]="lockSwipeToNext"
                [lockSwipes]="lockSwipes"
                [sliderOptions]="sliderOptions"
                (onRangeChanged)="rangeChanged($event)"
                (onEventSelected)="eventSelected($event)"
                (onTimeSelected)="timeSelected($event)"
                (onTitleChanged)="titleChanged($event)">
            </monthview>
            <weekview *ngSwitchCase="'week'"
                [formatWeekTitle]="formatWeekTitle"
                [formatWeekViewDayHeader]="formatWeekViewDayHeader"
                [formatHourColumn]="formatHourColumn"
                [startingDayWeek]="startingDayWeek"
                [allDayLabel]="allDayLabel"
                [hourParts]="hourParts"
                [autoSelect]="autoSelect"
                [hourSegments]="hourSegments"
                [eventSource]="eventSource"
                [markDisabled]="markDisabled"
                [weekviewHeaderTemplate]="weekviewHeaderTemplate||defaultWeekviewHeaderTemplate"
                [weekviewAllDayEventTemplate]="weekviewAllDayEventTemplate||defaultAllDayEventTemplate"
                [weekviewNormalEventTemplate]="weekviewNormalEventTemplate||defaultNormalEventTemplate"
                [weekviewAllDayEventSectionTemplate]="weekviewAllDayEventSectionTemplate||defaultWeekViewAllDayEventSectionTemplate"
                [weekviewNormalEventSectionTemplate]="weekviewNormalEventSectionTemplate||defaultNormalEventSectionTemplate"
                [weekviewInactiveAllDayEventSectionTemplate]="weekviewInactiveAllDayEventSectionTemplate||defaultInactiveAllDayEventSectionTemplate"
                [weekviewInactiveNormalEventSectionTemplate]="weekviewInactiveNormalEventSectionTemplate||defaultInactiveNormalEventSectionTemplate"
                [locale]="locale"
                [dateFormatter]="dateFormatter"
                [dir]="dir"
                [scrollToHour]="scrollToHour"
                [preserveScrollPosition]="preserveScrollPosition"
                [lockSwipeToPrev]="lockSwipeToPrev"
                [lockSwipeToNext]="lockSwipeToNext"
                [lockSwipes]="lockSwipes"
                [startHour]="startHour"
                [endHour]="endHour"
                [sliderOptions]="sliderOptions"
                (onRangeChanged)="rangeChanged($event)"
                (onEventSelected)="eventSelected($event)"
                (onDayHeaderSelected)="daySelected($event)"
                (onTimeSelected)="timeSelected($event)"
                (onTitleChanged)="titleChanged($event)">
            </weekview>
            <dayview *ngSwitchCase="'day'"
                [formatDayTitle]="formatDayTitle"
                [formatHourColumn]="formatHourColumn"
                [allDayLabel]="allDayLabel"
                [hourParts]="hourParts"
                [hourSegments]="hourSegments"
                [eventSource]="eventSource"
                [markDisabled]="markDisabled"
                [dayviewAllDayEventTemplate]="dayviewAllDayEventTemplate||defaultAllDayEventTemplate"
                [dayviewNormalEventTemplate]="dayviewNormalEventTemplate||defaultNormalEventTemplate"
                [dayviewAllDayEventSectionTemplate]="dayviewAllDayEventSectionTemplate||defaultDayViewAllDayEventSectionTemplate"
                [dayviewNormalEventSectionTemplate]="dayviewNormalEventSectionTemplate||defaultNormalEventSectionTemplate"
                [dayviewInactiveAllDayEventSectionTemplate]="dayviewInactiveAllDayEventSectionTemplate||defaultInactiveAllDayEventSectionTemplate"
                [dayviewInactiveNormalEventSectionTemplate]="dayviewInactiveNormalEventSectionTemplate||defaultInactiveNormalEventSectionTemplate"
                [locale]="locale"
                [dateFormatter]="dateFormatter"
                [dir]="dir"
                [scrollToHour]="scrollToHour"
                [preserveScrollPosition]="preserveScrollPosition"
                [lockSwipeToPrev]="lockSwipeToPrev"
                [lockSwipeToNext]="lockSwipeToNext"
                [lockSwipes]="lockSwipes"
                [startHour]="startHour"
                [endHour]="endHour"
                [sliderOptions]="sliderOptions"
                (onRangeChanged)="rangeChanged($event)"
                (onEventSelected)="eventSelected($event)"
                (onTimeSelected)="timeSelected($event)"
                (onTitleChanged)="titleChanged($event)">
            </dayview>
        </div>
    `, providers: [CalendarService], styles: [":host>div{height:100%}.event-detail-container{border-top:2px darkgrey solid}.no-events-label{font-weight:700;color:#a9a9a9;text-align:center}.event-detail{cursor:pointer;white-space:nowrap;text-overflow:ellipsis}.monthview-eventdetail-timecolumn{width:110px;overflow:hidden}.calendar-event-inner{overflow:hidden;background-color:#3a87ad;color:#fff;height:100%;width:100%;padding:2px;line-height:15px;text-align:initial}@media (max-width: 750px){.calendar-event-inner{font-size:12px}}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CalendarService }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [LOCALE_ID]
                }] }, { type: i0.NgZone }]; }, propDecorators: { currentDate: [{
                type: Input
            }], eventSource: [{
                type: Input
            }], calendarMode: [{
                type: Input
            }], formatDay: [{
                type: Input
            }], formatDayHeader: [{
                type: Input
            }], formatDayTitle: [{
                type: Input
            }], formatWeekTitle: [{
                type: Input
            }], formatMonthTitle: [{
                type: Input
            }], formatWeekViewDayHeader: [{
                type: Input
            }], formatHourColumn: [{
                type: Input
            }], showEventDetail: [{
                type: Input
            }], startingDayMonth: [{
                type: Input
            }], startingDayWeek: [{
                type: Input
            }], allDayLabel: [{
                type: Input
            }], noEventsLabel: [{
                type: Input
            }], queryMode: [{
                type: Input
            }], step: [{
                type: Input
            }], timeInterval: [{
                type: Input
            }], autoSelect: [{
                type: Input
            }], markDisabled: [{
                type: Input
            }], monthviewDisplayEventTemplate: [{
                type: Input
            }], monthviewInactiveDisplayEventTemplate: [{
                type: Input
            }], monthviewEventDetailTemplate: [{
                type: Input
            }], weekviewHeaderTemplate: [{
                type: Input
            }], weekviewAllDayEventTemplate: [{
                type: Input
            }], weekviewNormalEventTemplate: [{
                type: Input
            }], dayviewAllDayEventTemplate: [{
                type: Input
            }], dayviewNormalEventTemplate: [{
                type: Input
            }], weekviewAllDayEventSectionTemplate: [{
                type: Input
            }], weekviewNormalEventSectionTemplate: [{
                type: Input
            }], dayviewAllDayEventSectionTemplate: [{
                type: Input
            }], dayviewNormalEventSectionTemplate: [{
                type: Input
            }], weekviewInactiveAllDayEventSectionTemplate: [{
                type: Input
            }], weekviewInactiveNormalEventSectionTemplate: [{
                type: Input
            }], dayviewInactiveAllDayEventSectionTemplate: [{
                type: Input
            }], dayviewInactiveNormalEventSectionTemplate: [{
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
            }], locale: [{
                type: Input
            }], startHour: [{
                type: Input
            }], endHour: [{
                type: Input
            }], sliderOptions: [{
                type: Input
            }], onCurrentDateChanged: [{
                type: Output
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsZW5kYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2FsZW5kYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFVLE1BQU0sRUFBZSxNQUFNLEVBQUUsU0FBUyxFQUFVLE1BQU0sZUFBZSxDQUFDO0FBRXZILE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRCxPQUFPLFVBQVUsTUFBTSxRQUFRLENBQUM7QUFDaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdDLE9BQU8sRUFBbUMsSUFBSSxFQUFnVyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7OztBQUUzYSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztBQStNOUIsTUFBTSxPQUFPLGlCQUFpQjtJQUMxQixJQUNJLFdBQVc7UUFDWCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDN0IsQ0FBQztJQUVELElBQUksV0FBVyxDQUFDLEdBQVE7UUFDcEIsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNOLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1NBQ3BCO1FBRUQsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7UUFDeEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUE2REQsWUFBb0IsZUFBK0IsRUFBNkIsU0FBZ0IsRUFBVSxNQUFjO1FBQXBHLG9CQUFlLEdBQWYsZUFBZSxDQUFnQjtRQUE2QixjQUFTLEdBQVQsU0FBUyxDQUFPO1FBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQTNEL0csZ0JBQVcsR0FBWSxF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O2dCQUNHLG1CQUFtQjtzQkFBNUIsTUFBTTtnQkFDRyxjQUFjO3NCQUF2QixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkluaXQsIE91dHB1dCwgVGVtcGxhdGVSZWYsIEluamVjdCwgTE9DQUxFX0lELCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgQ2FsZW5kYXJTZXJ2aWNlIH0gZnJvbSAnLi9jYWxlbmRhci5zZXJ2aWNlJztcbmltcG9ydCBTd2lwZXJDb3JlIGZyb20gJ3N3aXBlcic7XG5pbXBvcnQgeyBJb25pY1NsaWRlcyB9IGZyb20gJ0Bpb25pYy9hbmd1bGFyJztcbmltcG9ydCB7IElFdmVudCwgQ2FsZW5kYXJNb2RlLCBRdWVyeU1vZGUsIFN0ZXAsIElNb250aFZpZXdEaXNwbGF5RXZlbnRUZW1wbGF0ZUNvbnRleHQsIElNb250aFZpZXdFdmVudERldGFpbFRlbXBsYXRlQ29udGV4dCwgSURpc3BsYXlXZWVrVmlld0hlYWRlciwgSURpc3BsYXlBbGxEYXlFdmVudCwgSURpc3BsYXlFdmVudCwgSVdlZWtWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0LCBJRGF5Vmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlQ29udGV4dCwgSVdlZWtWaWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0LCBJRGF5Vmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlQ29udGV4dCwgSURhdGVGb3JtYXR0ZXIsIElSYW5nZSwgSVRpbWVTZWxlY3RlZCB9IGZyb20gJy4vY2FsZW5kYXIuaW50ZXJmYWNlJztcblxuU3dpcGVyQ29yZS51c2UoW0lvbmljU2xpZGVzXSk7XG5cblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdjYWxlbmRhcicsXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPG5nLXRlbXBsYXRlICNtb250aHZpZXdEZWZhdWx0RGlzcGxheUV2ZW50VGVtcGxhdGUgbGV0LXZpZXc9XCJ2aWV3XCIgbGV0LXJvdz1cInJvd1wiIGxldC1jb2w9XCJjb2xcIj5cbiAgICAgICAgICAgIHt7dmlldy5kYXRlc1tyb3cqNytjb2xdLmxhYmVsfX1cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNtb250aHZpZXdEZWZhdWx0RXZlbnREZXRhaWxUZW1wbGF0ZSBsZXQtc2hvd0V2ZW50RGV0YWlsPVwic2hvd0V2ZW50RGV0YWlsXCIgbGV0LXNlbGVjdGVkRGF0ZT1cInNlbGVjdGVkRGF0ZVwiIGxldC1ub0V2ZW50c0xhYmVsPVwibm9FdmVudHNMYWJlbFwiPlxuICAgICAgICAgICAgPGlvbi1saXN0IGNsYXNzPVwiZXZlbnQtZGV0YWlsLWNvbnRhaW5lclwiIGhhcy1ib3VuY2luZz1cImZhbHNlXCIgKm5nSWY9XCJzaG93RXZlbnREZXRhaWxcIiBvdmVyZmxvdy1zY3JvbGw9XCJmYWxzZVwiPlxuICAgICAgICAgICAgICAgIDxpb24taXRlbSAqbmdGb3I9XCJsZXQgZXZlbnQgb2Ygc2VsZWN0ZWREYXRlPy5ldmVudHNcIiAoY2xpY2spPVwiZXZlbnRTZWxlY3RlZChldmVudClcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuICpuZ0lmPVwiIWV2ZW50LmFsbERheVwiIGNsYXNzPVwibW9udGh2aWV3LWV2ZW50ZGV0YWlsLXRpbWVjb2x1bW5cIj57e2V2ZW50LnN0YXJ0VGltZXxkYXRlOiAnSEg6bW0nfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3tldmVudC5lbmRUaW1lfGRhdGU6ICdISDptbSd9fVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiAqbmdJZj1cImV2ZW50LmFsbERheVwiIGNsYXNzPVwibW9udGh2aWV3LWV2ZW50ZGV0YWlsLXRpbWVjb2x1bW5cIj57e2FsbERheUxhYmVsfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZXZlbnQtZGV0YWlsXCI+ICB8ICB7e2V2ZW50LnRpdGxlfX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9pb24taXRlbT5cbiAgICAgICAgICAgICAgICA8aW9uLWl0ZW0gKm5nSWY9XCJzZWxlY3RlZERhdGU/LmV2ZW50cy5sZW5ndGg9PTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5vLWV2ZW50cy1sYWJlbFwiPnt7bm9FdmVudHNMYWJlbH19PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9pb24taXRlbT5cbiAgICAgICAgICAgIDwvaW9uLWxpc3Q+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdFdlZWt2aWV3SGVhZGVyVGVtcGxhdGUgbGV0LXZpZXdEYXRlPVwidmlld0RhdGVcIj5cbiAgICAgICAgICAgIHt7IHZpZXdEYXRlLmRheUhlYWRlciB9fVxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRBbGxEYXlFdmVudFRlbXBsYXRlIGxldC1kaXNwbGF5RXZlbnQ9XCJkaXNwbGF5RXZlbnRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYWxlbmRhci1ldmVudC1pbm5lclwiPnt7ZGlzcGxheUV2ZW50LmV2ZW50LnRpdGxlfX08L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0Tm9ybWFsRXZlbnRUZW1wbGF0ZSBsZXQtZGlzcGxheUV2ZW50PVwiZGlzcGxheUV2ZW50XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FsZW5kYXItZXZlbnQtaW5uZXJcIj57e2Rpc3BsYXlFdmVudC5ldmVudC50aXRsZX19PC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdFdlZWtWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGUgbGV0LWRheT1cImRheVwiIGxldC1ldmVudFRlbXBsYXRlPVwiZXZlbnRUZW1wbGF0ZVwiPlxuICAgICAgICAgICAgPGRpdiBbbmdDbGFzc109XCJ7J2NhbGVuZGFyLWV2ZW50LXdyYXAnOiBkYXkuZXZlbnRzfVwiICpuZ0lmPVwiZGF5LmV2ZW50c1wiXG4gICAgICAgICAgICAgICAgIFtuZ1N0eWxlXT1cIntoZWlnaHQ6IDI1KmRheS5ldmVudHMubGVuZ3RoKydweCd9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiAqbmdGb3I9XCJsZXQgZGlzcGxheUV2ZW50IG9mIGRheS5ldmVudHNcIiBjbGFzcz1cImNhbGVuZGFyLWV2ZW50XCIgdGFwcGFibGVcbiAgICAgICAgICAgICAgICAgICAgIChjbGljayk9XCJldmVudFNlbGVjdGVkKGRpc3BsYXlFdmVudC5ldmVudClcIlxuICAgICAgICAgICAgICAgICAgICAgW25nU3R5bGVdPVwie3RvcDogMjUqZGlzcGxheUV2ZW50LnBvc2l0aW9uKydweCcsIHdpZHRoOiAxMDAqKGRpc3BsYXlFdmVudC5lbmRJbmRleC1kaXNwbGF5RXZlbnQuc3RhcnRJbmRleCkrJyUnLCBoZWlnaHQ6ICcyNXB4J31cIj5cbiAgICAgICAgICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ1RlbXBsYXRlT3V0bGV0XT1cImV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cIntkaXNwbGF5RXZlbnQ6ZGlzcGxheUV2ZW50fVwiPlxuICAgICAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdERheVZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZSBsZXQtYWxsRGF5RXZlbnRzPVwiYWxsRGF5RXZlbnRzXCIgbGV0LWV2ZW50VGVtcGxhdGU9XCJldmVudFRlbXBsYXRlXCI+XG4gICAgICAgICAgICA8ZGl2ICpuZ0Zvcj1cImxldCBkaXNwbGF5RXZlbnQgb2YgYWxsRGF5RXZlbnRzOyBsZXQgZXZlbnRJbmRleD1pbmRleFwiXG4gICAgICAgICAgICAgICAgIGNsYXNzPVwiY2FsZW5kYXItZXZlbnRcIiB0YXBwYWJsZVxuICAgICAgICAgICAgICAgICAoY2xpY2spPVwiZXZlbnRTZWxlY3RlZChkaXNwbGF5RXZlbnQuZXZlbnQpXCJcbiAgICAgICAgICAgICAgICAgW25nU3R5bGVdPVwie3RvcDogMjUqZXZlbnRJbmRleCsncHgnLHdpZHRoOiAnMTAwJScsaGVpZ2h0OicyNXB4J31cIj5cbiAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwiZXZlbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7ZGlzcGxheUV2ZW50OmRpc3BsYXlFdmVudH1cIj5cbiAgICAgICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdE5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlIGxldC10bT1cInRtXCIgbGV0LWhvdXJQYXJ0cz1cImhvdXJQYXJ0c1wiIGxldC1ldmVudFRlbXBsYXRlPVwiZXZlbnRUZW1wbGF0ZVwiPlxuICAgICAgICAgICAgPGRpdiBbbmdDbGFzc109XCJ7J2NhbGVuZGFyLWV2ZW50LXdyYXAnOiB0bS5ldmVudHN9XCIgKm5nSWY9XCJ0bS5ldmVudHNcIj5cbiAgICAgICAgICAgICAgICA8ZGl2ICpuZ0Zvcj1cImxldCBkaXNwbGF5RXZlbnQgb2YgdG0uZXZlbnRzXCIgY2xhc3M9XCJjYWxlbmRhci1ldmVudFwiIHRhcHBhYmxlXG4gICAgICAgICAgICAgICAgICAgICAoY2xpY2spPVwiZXZlbnRTZWxlY3RlZChkaXNwbGF5RXZlbnQuZXZlbnQpXCJcbiAgICAgICAgICAgICAgICAgICAgIFtuZ1N0eWxlXT1cInt0b3A6ICgzNypkaXNwbGF5RXZlbnQuc3RhcnRPZmZzZXQvaG91clBhcnRzKSsncHgnLGxlZnQ6IDEwMC9kaXNwbGF5RXZlbnQub3ZlcmxhcE51bWJlcipkaXNwbGF5RXZlbnQucG9zaXRpb24rJyUnLCB3aWR0aDogMTAwL2Rpc3BsYXlFdmVudC5vdmVybGFwTnVtYmVyKyclJywgaGVpZ2h0OiAzNyooZGlzcGxheUV2ZW50LmVuZEluZGV4IC1kaXNwbGF5RXZlbnQuc3RhcnRJbmRleCAtIChkaXNwbGF5RXZlbnQuZW5kT2Zmc2V0ICsgZGlzcGxheUV2ZW50LnN0YXJ0T2Zmc2V0KS9ob3VyUGFydHMpKydweCd9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbbmdUZW1wbGF0ZU91dGxldF09XCJldmVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7ZGlzcGxheUV2ZW50OmRpc3BsYXlFdmVudH1cIj5cbiAgICAgICAgICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlPlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRJbmFjdGl2ZU5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlPlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgIDxkaXYgW25nU3dpdGNoXT1cImNhbGVuZGFyTW9kZVwiIGNsYXNzPVwie3tjYWxlbmRhck1vZGV9fXZpZXctY29udGFpbmVyXCI+XG4gICAgICAgICAgICA8bW9udGh2aWV3ICpuZ1N3aXRjaENhc2U9XCInbW9udGgnXCJcbiAgICAgICAgICAgICAgICBbZm9ybWF0RGF5XT1cImZvcm1hdERheVwiXG4gICAgICAgICAgICAgICAgW2Zvcm1hdERheUhlYWRlcl09XCJmb3JtYXREYXlIZWFkZXJcIlxuICAgICAgICAgICAgICAgIFtmb3JtYXRNb250aFRpdGxlXT1cImZvcm1hdE1vbnRoVGl0bGVcIlxuICAgICAgICAgICAgICAgIFtzdGFydGluZ0RheU1vbnRoXT1cInN0YXJ0aW5nRGF5TW9udGhcIlxuICAgICAgICAgICAgICAgIFtzaG93RXZlbnREZXRhaWxdPVwic2hvd0V2ZW50RGV0YWlsXCJcbiAgICAgICAgICAgICAgICBbbm9FdmVudHNMYWJlbF09XCJub0V2ZW50c0xhYmVsXCJcbiAgICAgICAgICAgICAgICBbYXV0b1NlbGVjdF09XCJhdXRvU2VsZWN0XCJcbiAgICAgICAgICAgICAgICBbZXZlbnRTb3VyY2VdPVwiZXZlbnRTb3VyY2VcIlxuICAgICAgICAgICAgICAgIFttYXJrRGlzYWJsZWRdPVwibWFya0Rpc2FibGVkXCJcbiAgICAgICAgICAgICAgICBbbW9udGh2aWV3RGlzcGxheUV2ZW50VGVtcGxhdGVdPVwibW9udGh2aWV3RGlzcGxheUV2ZW50VGVtcGxhdGV8fG1vbnRodmlld0RlZmF1bHREaXNwbGF5RXZlbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW21vbnRodmlld0luYWN0aXZlRGlzcGxheUV2ZW50VGVtcGxhdGVdPVwibW9udGh2aWV3SW5hY3RpdmVEaXNwbGF5RXZlbnRUZW1wbGF0ZXx8bW9udGh2aWV3RGVmYXVsdERpc3BsYXlFdmVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbbW9udGh2aWV3RXZlbnREZXRhaWxUZW1wbGF0ZV09XCJtb250aHZpZXdFdmVudERldGFpbFRlbXBsYXRlfHxtb250aHZpZXdEZWZhdWx0RXZlbnREZXRhaWxUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICAgICAgICAgIFtkYXRlRm9ybWF0dGVyXT1cImRhdGVGb3JtYXR0ZXJcIlxuICAgICAgICAgICAgICAgIFtkaXJdPVwiZGlyXCJcbiAgICAgICAgICAgICAgICBbbG9ja1N3aXBlVG9QcmV2XT1cImxvY2tTd2lwZVRvUHJldlwiXG4gICAgICAgICAgICAgICAgW2xvY2tTd2lwZVRvTmV4dF09XCJsb2NrU3dpcGVUb05leHRcIlxuICAgICAgICAgICAgICAgIFtsb2NrU3dpcGVzXT1cImxvY2tTd2lwZXNcIlxuICAgICAgICAgICAgICAgIFtzbGlkZXJPcHRpb25zXT1cInNsaWRlck9wdGlvbnNcIlxuICAgICAgICAgICAgICAgIChvblJhbmdlQ2hhbmdlZCk9XCJyYW5nZUNoYW5nZWQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKG9uRXZlbnRTZWxlY3RlZCk9XCJldmVudFNlbGVjdGVkKCRldmVudClcIlxuICAgICAgICAgICAgICAgIChvblRpbWVTZWxlY3RlZCk9XCJ0aW1lU2VsZWN0ZWQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKG9uVGl0bGVDaGFuZ2VkKT1cInRpdGxlQ2hhbmdlZCgkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L21vbnRodmlldz5cbiAgICAgICAgICAgIDx3ZWVrdmlldyAqbmdTd2l0Y2hDYXNlPVwiJ3dlZWsnXCJcbiAgICAgICAgICAgICAgICBbZm9ybWF0V2Vla1RpdGxlXT1cImZvcm1hdFdlZWtUaXRsZVwiXG4gICAgICAgICAgICAgICAgW2Zvcm1hdFdlZWtWaWV3RGF5SGVhZGVyXT1cImZvcm1hdFdlZWtWaWV3RGF5SGVhZGVyXCJcbiAgICAgICAgICAgICAgICBbZm9ybWF0SG91ckNvbHVtbl09XCJmb3JtYXRIb3VyQ29sdW1uXCJcbiAgICAgICAgICAgICAgICBbc3RhcnRpbmdEYXlXZWVrXT1cInN0YXJ0aW5nRGF5V2Vla1wiXG4gICAgICAgICAgICAgICAgW2FsbERheUxhYmVsXT1cImFsbERheUxhYmVsXCJcbiAgICAgICAgICAgICAgICBbaG91clBhcnRzXT1cImhvdXJQYXJ0c1wiXG4gICAgICAgICAgICAgICAgW2F1dG9TZWxlY3RdPVwiYXV0b1NlbGVjdFwiXG4gICAgICAgICAgICAgICAgW2hvdXJTZWdtZW50c109XCJob3VyU2VnbWVudHNcIlxuICAgICAgICAgICAgICAgIFtldmVudFNvdXJjZV09XCJldmVudFNvdXJjZVwiXG4gICAgICAgICAgICAgICAgW21hcmtEaXNhYmxlZF09XCJtYXJrRGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgIFt3ZWVrdmlld0hlYWRlclRlbXBsYXRlXT1cIndlZWt2aWV3SGVhZGVyVGVtcGxhdGV8fGRlZmF1bHRXZWVrdmlld0hlYWRlclRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbd2Vla3ZpZXdBbGxEYXlFdmVudFRlbXBsYXRlXT1cIndlZWt2aWV3QWxsRGF5RXZlbnRUZW1wbGF0ZXx8ZGVmYXVsdEFsbERheUV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgIFt3ZWVrdmlld05vcm1hbEV2ZW50VGVtcGxhdGVdPVwid2Vla3ZpZXdOb3JtYWxFdmVudFRlbXBsYXRlfHxkZWZhdWx0Tm9ybWFsRXZlbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW3dlZWt2aWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVdPVwid2Vla3ZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZXx8ZGVmYXVsdFdlZWtWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgIFt3ZWVrdmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlXT1cIndlZWt2aWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGV8fGRlZmF1bHROb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW3dlZWt2aWV3SW5hY3RpdmVBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZV09XCJ3ZWVrdmlld0luYWN0aXZlQWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGV8fGRlZmF1bHRJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbd2Vla3ZpZXdJbmFjdGl2ZU5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlXT1cIndlZWt2aWV3SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZXx8ZGVmYXVsdEluYWN0aXZlTm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgIFtsb2NhbGVdPVwibG9jYWxlXCJcbiAgICAgICAgICAgICAgICBbZGF0ZUZvcm1hdHRlcl09XCJkYXRlRm9ybWF0dGVyXCJcbiAgICAgICAgICAgICAgICBbZGlyXT1cImRpclwiXG4gICAgICAgICAgICAgICAgW3Njcm9sbFRvSG91cl09XCJzY3JvbGxUb0hvdXJcIlxuICAgICAgICAgICAgICAgIFtwcmVzZXJ2ZVNjcm9sbFBvc2l0aW9uXT1cInByZXNlcnZlU2Nyb2xsUG9zaXRpb25cIlxuICAgICAgICAgICAgICAgIFtsb2NrU3dpcGVUb1ByZXZdPVwibG9ja1N3aXBlVG9QcmV2XCJcbiAgICAgICAgICAgICAgICBbbG9ja1N3aXBlVG9OZXh0XT1cImxvY2tTd2lwZVRvTmV4dFwiXG4gICAgICAgICAgICAgICAgW2xvY2tTd2lwZXNdPVwibG9ja1N3aXBlc1wiXG4gICAgICAgICAgICAgICAgW3N0YXJ0SG91cl09XCJzdGFydEhvdXJcIlxuICAgICAgICAgICAgICAgIFtlbmRIb3VyXT1cImVuZEhvdXJcIlxuICAgICAgICAgICAgICAgIFtzbGlkZXJPcHRpb25zXT1cInNsaWRlck9wdGlvbnNcIlxuICAgICAgICAgICAgICAgIChvblJhbmdlQ2hhbmdlZCk9XCJyYW5nZUNoYW5nZWQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKG9uRXZlbnRTZWxlY3RlZCk9XCJldmVudFNlbGVjdGVkKCRldmVudClcIlxuICAgICAgICAgICAgICAgIChvbkRheUhlYWRlclNlbGVjdGVkKT1cImRheVNlbGVjdGVkKCRldmVudClcIlxuICAgICAgICAgICAgICAgIChvblRpbWVTZWxlY3RlZCk9XCJ0aW1lU2VsZWN0ZWQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKG9uVGl0bGVDaGFuZ2VkKT1cInRpdGxlQ2hhbmdlZCgkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L3dlZWt2aWV3PlxuICAgICAgICAgICAgPGRheXZpZXcgKm5nU3dpdGNoQ2FzZT1cIidkYXknXCJcbiAgICAgICAgICAgICAgICBbZm9ybWF0RGF5VGl0bGVdPVwiZm9ybWF0RGF5VGl0bGVcIlxuICAgICAgICAgICAgICAgIFtmb3JtYXRIb3VyQ29sdW1uXT1cImZvcm1hdEhvdXJDb2x1bW5cIlxuICAgICAgICAgICAgICAgIFthbGxEYXlMYWJlbF09XCJhbGxEYXlMYWJlbFwiXG4gICAgICAgICAgICAgICAgW2hvdXJQYXJ0c109XCJob3VyUGFydHNcIlxuICAgICAgICAgICAgICAgIFtob3VyU2VnbWVudHNdPVwiaG91clNlZ21lbnRzXCJcbiAgICAgICAgICAgICAgICBbZXZlbnRTb3VyY2VdPVwiZXZlbnRTb3VyY2VcIlxuICAgICAgICAgICAgICAgIFttYXJrRGlzYWJsZWRdPVwibWFya0Rpc2FibGVkXCJcbiAgICAgICAgICAgICAgICBbZGF5dmlld0FsbERheUV2ZW50VGVtcGxhdGVdPVwiZGF5dmlld0FsbERheUV2ZW50VGVtcGxhdGV8fGRlZmF1bHRBbGxEYXlFdmVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbZGF5dmlld05vcm1hbEV2ZW50VGVtcGxhdGVdPVwiZGF5dmlld05vcm1hbEV2ZW50VGVtcGxhdGV8fGRlZmF1bHROb3JtYWxFdmVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbZGF5dmlld0FsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXT1cImRheXZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZXx8ZGVmYXVsdERheVZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW2RheXZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZV09XCJkYXl2aWV3Tm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGV8fGRlZmF1bHROb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW2RheXZpZXdJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlXT1cImRheXZpZXdJbmFjdGl2ZUFsbERheUV2ZW50U2VjdGlvblRlbXBsYXRlfHxkZWZhdWx0SW5hY3RpdmVBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW2RheXZpZXdJbmFjdGl2ZU5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlXT1cImRheXZpZXdJbmFjdGl2ZU5vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlfHxkZWZhdWx0SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICAgICAgICAgIFtkYXRlRm9ybWF0dGVyXT1cImRhdGVGb3JtYXR0ZXJcIlxuICAgICAgICAgICAgICAgIFtkaXJdPVwiZGlyXCJcbiAgICAgICAgICAgICAgICBbc2Nyb2xsVG9Ib3VyXT1cInNjcm9sbFRvSG91clwiXG4gICAgICAgICAgICAgICAgW3ByZXNlcnZlU2Nyb2xsUG9zaXRpb25dPVwicHJlc2VydmVTY3JvbGxQb3NpdGlvblwiXG4gICAgICAgICAgICAgICAgW2xvY2tTd2lwZVRvUHJldl09XCJsb2NrU3dpcGVUb1ByZXZcIlxuICAgICAgICAgICAgICAgIFtsb2NrU3dpcGVUb05leHRdPVwibG9ja1N3aXBlVG9OZXh0XCJcbiAgICAgICAgICAgICAgICBbbG9ja1N3aXBlc109XCJsb2NrU3dpcGVzXCJcbiAgICAgICAgICAgICAgICBbc3RhcnRIb3VyXT1cInN0YXJ0SG91clwiXG4gICAgICAgICAgICAgICAgW2VuZEhvdXJdPVwiZW5kSG91clwiXG4gICAgICAgICAgICAgICAgW3NsaWRlck9wdGlvbnNdPVwic2xpZGVyT3B0aW9uc1wiXG4gICAgICAgICAgICAgICAgKG9uUmFuZ2VDaGFuZ2VkKT1cInJhbmdlQ2hhbmdlZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICAob25FdmVudFNlbGVjdGVkKT1cImV2ZW50U2VsZWN0ZWQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKG9uVGltZVNlbGVjdGVkKT1cInRpbWVTZWxlY3RlZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICAob25UaXRsZUNoYW5nZWQpPVwidGl0bGVDaGFuZ2VkKCRldmVudClcIj5cbiAgICAgICAgICAgIDwvZGF5dmlldz5cbiAgICAgICAgPC9kaXY+XG4gICAgYCxcbiAgICBzdHlsZXM6IFtgXG4gICAgICAgIDpob3N0ID4gZGl2IHsgaGVpZ2h0OiAxMDAlOyB9XG5cbiAgICAgICAgLmV2ZW50LWRldGFpbC1jb250YWluZXIge1xuICAgICAgICAgIGJvcmRlci10b3A6IDJweCBkYXJrZ3JleSBzb2xpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5uby1ldmVudHMtbGFiZWwge1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgICAgIGNvbG9yOiBkYXJrZ3JleTtcbiAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIH1cblxuICAgICAgICAuZXZlbnQtZGV0YWlsIHtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC5tb250aHZpZXctZXZlbnRkZXRhaWwtdGltZWNvbHVtbiB7XG4gICAgICAgICAgd2lkdGg6IDExMHB4O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAuY2FsZW5kYXItZXZlbnQtaW5uZXIge1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzNhODdhZDtcbiAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIHBhZGRpbmc6IDJweDtcbiAgICAgICAgICBsaW5lLWhlaWdodDogMTVweDtcbiAgICAgICAgICB0ZXh0LWFsaWduOiBpbml0aWFsO1xuICAgICAgICB9XG5cbiAgICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDc1MHB4KSB7XG4gICAgICAgICAgLmNhbGVuZGFyLWV2ZW50LWlubmVyIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBgXSxcbiAgICBwcm92aWRlcnM6IFtDYWxlbmRhclNlcnZpY2VdXG59KVxuZXhwb3J0IGNsYXNzIENhbGVuZGFyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgICBASW5wdXQoKVxuICAgIGdldCBjdXJyZW50RGF0ZSgpOkRhdGUge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudERhdGU7XG4gICAgfVxuXG4gICAgc2V0IGN1cnJlbnREYXRlKHZhbDpEYXRlKSB7XG4gICAgICAgIGlmICghdmFsKSB7XG4gICAgICAgICAgICB2YWwgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY3VycmVudERhdGUgPSB2YWw7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNldEN1cnJlbnREYXRlKHZhbCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMub25DdXJyZW50RGF0ZUNoYW5nZWQuZW1pdCh0aGlzLl9jdXJyZW50RGF0ZSk7XG4gICAgfVxuXG4gICAgQElucHV0KCkgZXZlbnRTb3VyY2U6SUV2ZW50W10gPSBbXTtcbiAgICBASW5wdXQoKSBjYWxlbmRhck1vZGU6Q2FsZW5kYXJNb2RlID0gJ21vbnRoJztcbiAgICBASW5wdXQoKSBmb3JtYXREYXk6c3RyaW5nID0gJ2QnO1xuICAgIEBJbnB1dCgpIGZvcm1hdERheUhlYWRlcjpzdHJpbmcgPSAnRUVFJztcbiAgICBASW5wdXQoKSBmb3JtYXREYXlUaXRsZTpzdHJpbmcgPSAnTU1NTSBkZCwgeXl5eSc7XG4gICAgQElucHV0KCkgZm9ybWF0V2Vla1RpdGxlOnN0cmluZyA9ICdNTU1NIHl5eXksIFxcJ1dlZWtcXCcgdyc7XG4gICAgQElucHV0KCkgZm9ybWF0TW9udGhUaXRsZTpzdHJpbmcgPSAnTU1NTSB5eXl5JztcbiAgICBASW5wdXQoKSBmb3JtYXRXZWVrVmlld0RheUhlYWRlcjpzdHJpbmcgPSAnRUVFIGQnO1xuICAgIEBJbnB1dCgpIGZvcm1hdEhvdXJDb2x1bW46c3RyaW5nID0gJ2hhJztcbiAgICBASW5wdXQoKSBzaG93RXZlbnREZXRhaWw6Ym9vbGVhbiA9IHRydWU7XG4gICAgQElucHV0KCkgc3RhcnRpbmdEYXlNb250aDpudW1iZXIgPSAwO1xuICAgIEBJbnB1dCgpIHN0YXJ0aW5nRGF5V2VlazpudW1iZXIgPSAwO1xuICAgIEBJbnB1dCgpIGFsbERheUxhYmVsOnN0cmluZyA9ICdhbGwgZGF5JztcbiAgICBASW5wdXQoKSBub0V2ZW50c0xhYmVsOnN0cmluZyA9ICdObyBFdmVudHMnO1xuICAgIEBJbnB1dCgpIHF1ZXJ5TW9kZTpRdWVyeU1vZGUgPSAnbG9jYWwnO1xuICAgIEBJbnB1dCgpIHN0ZXA6U3RlcCA9IFN0ZXAuSG91cjtcbiAgICBASW5wdXQoKSB0aW1lSW50ZXJ2YWw6bnVtYmVyID0gNjA7XG4gICAgQElucHV0KCkgYXV0b1NlbGVjdDpib29sZWFuID0gdHJ1ZTtcbiAgICBASW5wdXQoKSBtYXJrRGlzYWJsZWQ/OihkYXRlOkRhdGUpID0+IGJvb2xlYW47XG4gICAgQElucHV0KCkgbW9udGh2aWV3RGlzcGxheUV2ZW50VGVtcGxhdGU/OlRlbXBsYXRlUmVmPElNb250aFZpZXdEaXNwbGF5RXZlbnRUZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIG1vbnRodmlld0luYWN0aXZlRGlzcGxheUV2ZW50VGVtcGxhdGU/OlRlbXBsYXRlUmVmPElNb250aFZpZXdEaXNwbGF5RXZlbnRUZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIG1vbnRodmlld0V2ZW50RGV0YWlsVGVtcGxhdGU/OlRlbXBsYXRlUmVmPElNb250aFZpZXdFdmVudERldGFpbFRlbXBsYXRlQ29udGV4dD47XG4gICAgQElucHV0KCkgd2Vla3ZpZXdIZWFkZXJUZW1wbGF0ZT86VGVtcGxhdGVSZWY8SURpc3BsYXlXZWVrVmlld0hlYWRlcj47XG4gICAgQElucHV0KCkgd2Vla3ZpZXdBbGxEYXlFdmVudFRlbXBsYXRlPzpUZW1wbGF0ZVJlZjxJRGlzcGxheUFsbERheUV2ZW50PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld05vcm1hbEV2ZW50VGVtcGxhdGU/OlRlbXBsYXRlUmVmPElEaXNwbGF5RXZlbnQ+O1xuICAgIEBJbnB1dCgpIGRheXZpZXdBbGxEYXlFdmVudFRlbXBsYXRlPzpUZW1wbGF0ZVJlZjxJRGlzcGxheUFsbERheUV2ZW50PjtcbiAgICBASW5wdXQoKSBkYXl2aWV3Tm9ybWFsRXZlbnRUZW1wbGF0ZT86VGVtcGxhdGVSZWY8SURpc3BsYXlFdmVudD47XG4gICAgQElucHV0KCkgd2Vla3ZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZT86VGVtcGxhdGVSZWY8SVdlZWtWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlPzpUZW1wbGF0ZVJlZjxJV2Vla1ZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIGRheXZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZT86VGVtcGxhdGVSZWY8SURheVZpZXdBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIGRheXZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZT86VGVtcGxhdGVSZWY8SURheVZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIHdlZWt2aWV3SW5hY3RpdmVBbGxEYXlFdmVudFNlY3Rpb25UZW1wbGF0ZT86VGVtcGxhdGVSZWY8SVdlZWtWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0PjtcbiAgICBASW5wdXQoKSB3ZWVrdmlld0luYWN0aXZlTm9ybWFsRXZlbnRTZWN0aW9uVGVtcGxhdGU/OlRlbXBsYXRlUmVmPElXZWVrVmlld05vcm1hbEV2ZW50U2VjdGlvblRlbXBsYXRlQ29udGV4dD47XG4gICAgQElucHV0KCkgZGF5dmlld0luYWN0aXZlQWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGU/OlRlbXBsYXRlUmVmPElEYXlWaWV3QWxsRGF5RXZlbnRTZWN0aW9uVGVtcGxhdGVDb250ZXh0PjtcbiAgICBASW5wdXQoKSBkYXl2aWV3SW5hY3RpdmVOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZT86VGVtcGxhdGVSZWY8SURheVZpZXdOb3JtYWxFdmVudFNlY3Rpb25UZW1wbGF0ZUNvbnRleHQ+O1xuICAgIEBJbnB1dCgpIGRhdGVGb3JtYXR0ZXI/OklEYXRlRm9ybWF0dGVyO1xuICAgIEBJbnB1dCgpIGRpcjpzdHJpbmcgPSBcIlwiO1xuICAgIEBJbnB1dCgpIHNjcm9sbFRvSG91cjpudW1iZXIgPSAwO1xuICAgIEBJbnB1dCgpIHByZXNlcnZlU2Nyb2xsUG9zaXRpb246Ym9vbGVhbiA9IGZhbHNlO1xuICAgIEBJbnB1dCgpIGxvY2tTd2lwZVRvUHJldjpib29sZWFuID0gZmFsc2U7XG4gICAgQElucHV0KCkgbG9ja1N3aXBlVG9OZXh0OmJvb2xlYW4gPSBmYWxzZTtcbiAgICBASW5wdXQoKSBsb2NrU3dpcGVzOmJvb2xlYW4gPSBmYWxzZTtcbiAgICBASW5wdXQoKSBsb2NhbGU6c3RyaW5nID0gXCJcIjtcbiAgICBASW5wdXQoKSBzdGFydEhvdXI6bnVtYmVyID0gMDtcbiAgICBASW5wdXQoKSBlbmRIb3VyOm51bWJlciA9IDI0O1xuICAgIEBJbnB1dCgpIHNsaWRlck9wdGlvbnM6YW55O1xuXG4gICAgQE91dHB1dCgpIG9uQ3VycmVudERhdGVDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxEYXRlPigpO1xuICAgIEBPdXRwdXQoKSBvblJhbmdlQ2hhbmdlZCA9IG5ldyBFdmVudEVtaXR0ZXI8SVJhbmdlPigpO1xuICAgIEBPdXRwdXQoKSBvbkV2ZW50U2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPElFdmVudD4oKTtcbiAgICBAT3V0cHV0KCkgb25UaW1lU2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPElUaW1lU2VsZWN0ZWQ+KCk7XG4gICAgQE91dHB1dCgpIG9uRGF5SGVhZGVyU2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPElUaW1lU2VsZWN0ZWQ+KCk7XG4gICAgQE91dHB1dCgpIG9uVGl0bGVDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxzdHJpbmc+KHRydWUpO1xuXG4gICAgcHJpdmF0ZSBfY3VycmVudERhdGU6RGF0ZSA9ICBuZXcgRGF0ZSgpO1xuICAgIHB1YmxpYyBob3VyUGFydHMgPSAxO1xuICAgIHB1YmxpYyBob3VyU2VnbWVudHMgPSAxO1xuICAgIHByaXZhdGUgY3VycmVudERhdGVDaGFuZ2VkRnJvbUNoaWxkcmVuU3Vic2NyaXB0aW9uPzpTdWJzY3JpcHRpb247XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNhbGVuZGFyU2VydmljZTpDYWxlbmRhclNlcnZpY2UsIEBJbmplY3QoTE9DQUxFX0lEKSBwcml2YXRlIGFwcExvY2FsZTpzdHJpbmcsIHByaXZhdGUgbmdab25lOiBOZ1pvbmUpIHtcbiAgICAgICAgdGhpcy5sb2NhbGUgPSBhcHBMb2NhbGU7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmF1dG9TZWxlY3QpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmF1dG9TZWxlY3QudG9TdHJpbmcoKSA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXV0b1NlbGVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF1dG9TZWxlY3QgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuaG91clNlZ21lbnRzID0gNjAgLyB0aGlzLnRpbWVJbnRlcnZhbDtcbiAgICAgICAgdGhpcy5ob3VyUGFydHMgPSA2MCAvIHRoaXMuc3RlcDtcbiAgICAgICAgaWYodGhpcy5ob3VyUGFydHMgPD0gdGhpcy5ob3VyU2VnbWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuaG91clBhcnRzID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaG91clBhcnRzID0gdGhpcy5ob3VyUGFydHMgLyB0aGlzLmhvdXJTZWdtZW50cztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXJ0SG91ciA9IHBhcnNlSW50KHRoaXMuc3RhcnRIb3VyLnRvU3RyaW5nKCkpO1xuICAgICAgICB0aGlzLmVuZEhvdXIgPSBwYXJzZUludCh0aGlzLmVuZEhvdXIudG9TdHJpbmcoKSk7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnF1ZXJ5TW9kZSA9IHRoaXMucXVlcnlNb2RlO1xuXG4gICAgICAgIHRoaXMuY3VycmVudERhdGVDaGFuZ2VkRnJvbUNoaWxkcmVuU3Vic2NyaXB0aW9uID0gdGhpcy5jYWxlbmRhclNlcnZpY2UuY3VycmVudERhdGVDaGFuZ2VkRnJvbUNoaWxkcmVuJC5zdWJzY3JpYmUoY3VycmVudERhdGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudERhdGUgPSBjdXJyZW50RGF0ZTtcbiAgICAgICAgICAgIHRoaXMub25DdXJyZW50RGF0ZUNoYW5nZWQuZW1pdChjdXJyZW50RGF0ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50RGF0ZUNoYW5nZWRGcm9tQ2hpbGRyZW5TdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERhdGVDaGFuZ2VkRnJvbUNoaWxkcmVuU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnREYXRlQ2hhbmdlZEZyb21DaGlsZHJlblN1YnNjcmlwdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJhbmdlQ2hhbmdlZChyYW5nZTpJUmFuZ2UpIHtcbiAgICAgICAgdGhpcy5vblJhbmdlQ2hhbmdlZC5lbWl0KHJhbmdlKTtcbiAgICB9XG5cbiAgICBldmVudFNlbGVjdGVkKGV2ZW50OklFdmVudCkge1xuICAgICAgICB0aGlzLm9uRXZlbnRTZWxlY3RlZC5lbWl0KGV2ZW50KTtcbiAgICB9XG5cbiAgICB0aW1lU2VsZWN0ZWQodGltZVNlbGVjdGVkOklUaW1lU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5vblRpbWVTZWxlY3RlZC5lbWl0KHRpbWVTZWxlY3RlZCk7XG4gICAgfVxuXG4gICAgZGF5U2VsZWN0ZWQoZGF5U2VsZWN0ZWQ6SVRpbWVTZWxlY3RlZCkge1xuICAgICAgICB0aGlzLm9uRGF5SGVhZGVyU2VsZWN0ZWQuZW1pdChkYXlTZWxlY3RlZCk7XG4gICAgfVxuXG4gICAgdGl0bGVDaGFuZ2VkKHRpdGxlOnN0cmluZykge1xuICAgICAgICB0aGlzLm9uVGl0bGVDaGFuZ2VkLmVtaXQodGl0bGUpO1xuICAgIH1cblxuICAgIGxvYWRFdmVudHMoKSB7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLmxvYWRFdmVudHMoKTtcbiAgICB9XG5cbiAgICBzbGlkZU5leHQoKSB7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJTZXJ2aWNlLnNsaWRlKDEpO1xuICAgIH1cblxuICAgIHNsaWRlUHJldigpIHtcbiAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2Uuc2xpZGUoLTEpO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5jYWxlbmRhclNlcnZpY2UudXBkYXRlKCk7XG4gICAgfVxufVxuIl19