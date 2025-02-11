import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
})
export class ScheduleComponent implements OnInit {
  calendar: any[] = []; // Array to hold the calendar data for the current month
  currentDayIndex: number = 0; // The index for the current day being displayed
  currentMonthName: string = ''; // Month name
  currentYear: number = 0; // Current year
  currentMonth: number = 0; // Current month (0-indexed)
  selectedDay: any = null; // Selected day object to highlight
  times: string[] = []; // Array to hold time slots for 6 AM - 8 PM
  timesPerRow: number = 6;  // Number of time buttons per row
  selectedTime: string = ''; // Selected time for booking

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    // Initialize with the current month's data
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth(); // Start with the current month
    this.generateCurrentMonthCalendar();
    this.updateMonthName();
    this.generateTimes();
  }

  // Helper function to get the number of days in a month
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate(); // Last day of the month
  }

  // Function to generate calendar for the current month
  generateCurrentMonthCalendar(): void {
    const year = this.currentYear;
    const month = this.currentMonth;
    const daysInMonth = this.getDaysInMonth(year, month);

    this.calendar = [];

    // Populate days for the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayName = date.toLocaleString('default', { weekday: 'short' });
      this.calendar.push({ day, dayName });
    }
  }

  // Function to update the month name
  updateMonthName(): void {
    const monthName = new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' });
    this.currentMonthName = monthName;

    // Explicitly trigger change detection to ensure the view is updated
    this.cdr.detectChanges();
  }

  // Function to go to the next set of 4 days
  goNextDay() {
    if (this.currentDayIndex + 4 < this.calendar.length) {
      this.currentDayIndex += 1; // Move forward 1 day
    } else {
      // If we reached the end of the current month, go to next month
      this.currentDayIndex = 0;
      this.moveToNextMonth();
    }
  }

  // Function to go to the previous set of 4 days
  goPrevDay() {
    if (this.currentDayIndex - 1 >= 0) {
      this.currentDayIndex -= 1; // Move backward 1 day
    } else {
      // If we're at the beginning of the month, go to the previous month
      this.currentDayIndex = Math.max(this.calendar.length - 4, 0);
      this.moveToPrevMonth();
    }
  }

  // Function to cycle to the next month
  moveToNextMonth() {
    this.currentMonth += 1; // Move to next month
    if (this.currentMonth > 11) { // If we go past December, move to January
      this.currentMonth = 0;
      this.currentYear += 1;
    }
    this.generateCurrentMonthCalendar(); // Regenerate the calendar for the new month
    this.updateMonthName(); // Update the current month name for the template
  }

  // Function to cycle to the previous month
  moveToPrevMonth() {
    this.currentMonth -= 1; // Move to previous month
    if (this.currentMonth < 0) { // If we go past January, move to December
      this.currentMonth = 11;
      this.currentYear -= 1;
    }
    this.generateCurrentMonthCalendar(); // Regenerate the calendar for the new month
    this.updateMonthName(); // Update the current month name for the template
  }

  // Function to get 4 visible days for scrolling
  getVisibleDays(): any[] {
    // Return a slice of the calendar data showing 4 days at a time
    return this.calendar.slice(this.currentDayIndex, this.currentDayIndex + 4);
  }

  // Function to generate the time slots for 6 AM to 8 PM in 15-minute increments
  generateTimes(): void {
    const times = [];
    const startHour = 6;
    const endHour = 18;
    const interval = 15; // 15 minutes interval

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour}:${minute < 10 ? '0' + minute : minute}`;
        times.push(time);
      }
    }

    this.times = times;
  }

  getRows(times: string[]): string[][] {
    const rows = [];
    for (let i = 0; i < times.length; i += this.timesPerRow) {
      rows.push(times.slice(i, i + this.timesPerRow));
    }
    return rows;
  }

  // Function to select a day and highlight it
  selectDay(day: any): void {
    this.selectedDay = day;
    this.selectedTime = ''; // Reset selected time when a new day is selected
  }

  // Function to check if the day is selected
  isDaySelected(day: any): boolean {
    return this.selectedDay === day;
  }

  // Function to select a time and store the selected time for booking
  selectTime(time: string): void {
    this.selectedTime = time; // Store the selected time
  }

  // Function to book the appointment
  bookAppointment(): void {
    if (this.selectedTime && this.selectedDay) {
      const appointmentData = {
        time: this.selectedTime,
        day: this.selectedDay.day,
        month: this.currentMonthName,
        year: this.currentYear
      };

      // Call your backend to book the appointment (Assuming backend is running)
      console.log(appointmentData)
      this.http.post('http://localhost:3000/users/book-appointment', appointmentData)
        .subscribe(response => {
          alert('Appointment booked');
        }, error => {
          console.error('Booking error', error);
          alert('There was an error booking your appointment.');
        });
    }
  }
}
