import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MonthViewComponent } from './monthview';
import { WeekViewComponent } from './weekview';
import { DayViewComponent } from './dayview';
import { CalendarComponent } from './calendar';
import { initPositionScrollComponent } from './init-position-scroll';
import { SwiperModule } from 'swiper/angular';
import * as i0 from "@angular/core";
export class NgCalendarModule {
}
NgCalendarModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: NgCalendarModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
NgCalendarModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.1.2", ngImport: i0, type: NgCalendarModule, declarations: [MonthViewComponent, WeekViewComponent, DayViewComponent, CalendarComponent, initPositionScrollComponent], imports: [IonicModule, CommonModule, SwiperModule], exports: [CalendarComponent] });
NgCalendarModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: NgCalendarModule, imports: [IonicModule, CommonModule, SwiperModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: NgCalendarModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        MonthViewComponent, WeekViewComponent, DayViewComponent, CalendarComponent, initPositionScrollComponent
                    ],
                    imports: [IonicModule, CommonModule, SwiperModule],
                    exports: [CalendarComponent]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsZW5kYXIubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NhbGVuZGFyLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ2pELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUMvQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDN0MsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQy9DLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7QUFTOUMsTUFBTSxPQUFPLGdCQUFnQjs7NkdBQWhCLGdCQUFnQjs4R0FBaEIsZ0JBQWdCLGlCQUxyQixrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSwyQkFBMkIsYUFFakcsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLGFBQ3ZDLGlCQUFpQjs4R0FFbEIsZ0JBQWdCLFlBSGYsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZOzJGQUd4QyxnQkFBZ0I7a0JBUDVCLFFBQVE7bUJBQUM7b0JBQ04sWUFBWSxFQUFFO3dCQUNWLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLDJCQUEyQjtxQkFDMUc7b0JBQ0QsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUM7b0JBQ2xELE9BQU8sRUFBRSxDQUFDLGlCQUFpQixDQUFDO2lCQUMvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgSW9uaWNNb2R1bGUgfSBmcm9tICdAaW9uaWMvYW5ndWxhcic7XG5pbXBvcnQgeyBNb250aFZpZXdDb21wb25lbnQgfSBmcm9tICcuL21vbnRodmlldyc7XG5pbXBvcnQgeyBXZWVrVmlld0NvbXBvbmVudCB9IGZyb20gJy4vd2Vla3ZpZXcnO1xuaW1wb3J0IHsgRGF5Vmlld0NvbXBvbmVudCB9IGZyb20gJy4vZGF5dmlldyc7XG5pbXBvcnQgeyBDYWxlbmRhckNvbXBvbmVudCB9IGZyb20gJy4vY2FsZW5kYXInO1xuaW1wb3J0IHsgaW5pdFBvc2l0aW9uU2Nyb2xsQ29tcG9uZW50IH0gZnJvbSAnLi9pbml0LXBvc2l0aW9uLXNjcm9sbCc7XG5pbXBvcnQgeyBTd2lwZXJNb2R1bGUgfSBmcm9tICdzd2lwZXIvYW5ndWxhcic7XG5cbkBOZ01vZHVsZSh7XG4gICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgIE1vbnRoVmlld0NvbXBvbmVudCwgV2Vla1ZpZXdDb21wb25lbnQsIERheVZpZXdDb21wb25lbnQsIENhbGVuZGFyQ29tcG9uZW50LCBpbml0UG9zaXRpb25TY3JvbGxDb21wb25lbnRcbiAgICBdLFxuICAgIGltcG9ydHM6IFtJb25pY01vZHVsZSwgQ29tbW9uTW9kdWxlLCBTd2lwZXJNb2R1bGVdLFxuICAgIGV4cG9ydHM6IFtDYWxlbmRhckNvbXBvbmVudF1cbn0pXG5leHBvcnQgY2xhc3MgTmdDYWxlbmRhck1vZHVsZSB7fVxuIl19