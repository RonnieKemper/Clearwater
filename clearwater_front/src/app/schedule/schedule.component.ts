import { Component, OnInit } from '@angular/core';
import { Calendar } from '@ionic-native/calendar/ngx';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
})
export class ScheduleComponent implements OnInit {

  constructor() { }
  calendar = {
    mode: 'month',
    currentDate: new Date(),
    dateFormatter: {
      formatMonthViewDay: function(date: Date) {
        return date.getDate().toString();
      },
      formatMonthViewDayHeader: function(date: Date) {
        return 'MonMH';
      },
      formatMonthViewTitle: function(date: Date) {
        return 'testMT';
      },
      formatWeekViewDayHeader: function(date: Date) {
        return 'MonWH';
      },
      formatWeekViewTitle: function(date: Date) {
        return 'testWT';
      },
      formatWeekViewHourColumn: function(date: Date) {
        return 'testWH';
      },
      formatDayViewHourColumn: function(date: Date) {
        return 'testDH';
      },
      formatDayViewTitle: function(date: Date) {
        return 'testDT';
      }
    }
  };
  scheduleAppointment() {
    let options = {
      calendarName: 'MyCalendar',
      calendarId: 1,
      url: 'https://myapp.com/appointment',
      title: 'New Appointment',
      location: '123 Main St',
      notes: 'Bring your ID',
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 60 * 60 * 1000),
      firstReminderMinutes: 15
    };
    // this.calendar.createEvent(options.title, options.location, options.notes, options.startDate, options.endDate).then(
    //   (msg) => { console.log(msg); },
    //   (err) => { console.log(err); }
    // );
  }
  
  
  ngOnInit() {}

}
