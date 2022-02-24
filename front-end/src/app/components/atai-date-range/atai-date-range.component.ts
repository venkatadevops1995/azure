import { FocusMonitor } from '@angular/cdk/a11y';
import { ConnectionPositionPair, Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, Component, ElementRef, forwardRef, HostBinding, HostListener, Input, OnInit, Optional, Renderer2, Self, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, FormGroupDirective, NgControl, NgForm, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CanUpdateErrorState, ErrorStateMatcher, mixinErrorState, NativeDateAdapter } from '@angular/material/core';
import { DateRange, MatCalendar, MatCalendarCell, MatCalendarCellCssClasses, MatCalendarUserEvent, MatDateSelectionModel, MatRangeDateSelectionModel, MatSingleDateSelectionModel } from '@angular/material/datepicker';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject, Subscription, take } from 'rxjs';

/** Checks whether a node is a table cell element. */
function isTableCell(node: Node): node is HTMLTableCellElement {
  return node.nodeName === 'TD';
}
// to make the component show errors on submit of a form
class MatDateRangeCompBase {
  constructor(public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    /** @docs-private */
    public ngControl: NgControl) { }
}
const _MatDateRangeMixinBase = mixinErrorState(MatDateRangeCompBase);

@Component({
  selector: 'app-atai-date-range',
  templateUrl: './atai-date-range.component.html',
  styleUrls: ['./atai-date-range.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: MatFormFieldControl, useExisting: forwardRef(() => AtaiDateRangeComponent) }
    //   {
    //     provide: NG_VALUE_ACCESSOR,
    //     multi: true,
    //     useExisting: AtaiDateRangeComponent
    //   }
  ],

})
export class AtaiDateRangeComponent extends _MatDateRangeMixinBase implements OnInit, ControlValueAccessor, MatFormFieldControl<any>, CanUpdateErrorState {

  // used to unsubscribe subscriptions
  destroy$: Subject<any> = new Subject();

  @Input() override errorStateMatcher: ErrorStateMatcher;

  @Input() label: string = 'Date Range';

  get empty() {
    let selection = this._model.selection;
    return !selection.start && !selection.end;
  }

  // ID attribute for the field and for attribute for the label
  @Input() idd = "daterange-picker-" + Math.floor((Math.random() * 100) + 1);

  // for mat
  @HostBinding() id = `${this.idd}`

  @ViewChild('input') inputElRef: ElementRef;

  // for compatibility for angular material
  override stateChanges = new Subject<void>();

  // selection presets 
  selectionPresets: Array<{ str: string, id: string }> = [
    { str: 'Last 7 Days', id: 'last7Days' },
    { str: 'Last 30 Days', id: 'last30Days' },
    { str: 'This Month', id: 'thisMonth' },
    { str: 'Last Month', id: 'lastMonth' },
  ]

  // boolean to track the status of the calendar is it open or closed
  isCalendarOpen: boolean = false;

  // date meta to keep track of the user selected dates
  dateMeta: { dateString?: string, selectedRange?: DateRange<any>, selectionType?: any } = { dateString: "", selectedRange: null, selectionType: null }

  // get reference to the template of the calendar for date range picker
  @ViewChild('calendarTemplate') calendarTemplateRef;

  @ViewChild('dateField') dateFieldRef: ElementRef;

  // the overlay reference of the overlay module
  overlayRef: OverlayRef;

  // backDrop click Subscription
  subscribeBackDropClick: Subscription;

  // To store selected year 
  year = new Date().getFullYear();

  // list of months
  listOfMonths = [" JAN ", " FEB ", " MAR ", " APR ", " MAY ", " JUN ", " JUL ", " AUG ", " SEP ", " OCT ", " NOV ", " DEC "]

  // To store selected month
  month = this.listOfMonths[new Date().getMonth()];

  // Default selected date
  // selectedDate: any;

  //  date selection model to hold between range and single date selection
  _model: MatDateSelectionModel<any, any>

  // minimum date calendar should start
  minDate = new Date().getDate() - 90;

  // count for how many next days should be displayed in calendar
  daysLimit = 59;

  // maximum data calendar should start
  maxDate = new Date(new Date().setDate(new Date().getDate() + this.daysLimit));

  // To store date selected
  selectedDates: Array<Date | any> = [];

  // range in between dates
  rangeInBetweenDates: Array<any> = [];

  // selected Preset reference
  selectedPresetRef: HTMLElement = null;

  // mat calendar 
  @ViewChild(MatCalendar) calendar: MatCalendar<any>;


  // for mat
  get value(): any {
    return this._model.selection;
  }
  // for mat
  set value(date: any) {
    if (date && date.start && date.start instanceof Date && date.end && date.end instanceof Date) {
      this._model.updateSelection({ start: date.start, end: date.end } as unknown, this)
      this.stateChanges.next();
    }
  }

  // placeholder input
  @Input() pH: string;

  // for mat
  get placeholder() {
    return this.pH;
  }
  set placeholder(plh) {
    this.pH = plh;
    this.stateChanges.next();
  }


  // for mat
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  // placeholder input
  @Input() optional: boolean;

  get required() {
    return !this.optional;
  }
  set required(req) {
    this.optional = !req;
    this.stateChanges.next();
  }

  // for mat
  focused = false;

  @HostBinding('attr.aria-describedby') describedBy = '';

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }
  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != 'input') {
      // this.el.nativeElement.querySelector('input').focus();
    }
  }

  constructor(
    private el: ElementRef,
    private overlay: Overlay, private viewContainerRef: ViewContainerRef,
    private positionBuilder: OverlayPositionBuilder,
    private _singleModel: MatSingleDateSelectionModel<any>,
    private _rangeModel: MatRangeDateSelectionModel<any>,
    private nativeDateAdapter: NativeDateAdapter,
    private cdRef: ChangeDetectorRef,
    public override _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() public override _parentForm: NgForm,
    @Optional() public override _parentFormGroup: FormGroupDirective,
    @Optional() @Self() public override ngControl: NgControl,
    private fm: FocusMonitor,
    private renderer: Renderer2
  ) {
    super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl)
    fm.monitor(el.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
    if (ngControl) {
      // set the value accessor to the current component instance
      ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this._model = this._rangeModel;
    this.ngControl.statusChanges.subscribe((status) => {
      console.log(status);
      this.stateChanges.next()
    })
  }


  ngAfterViewInit() {
    this.renderer.listen(this.inputElRef.nativeElement, 'keydown', (e: Event) => {
      e.preventDefault();
    })
  }

  ngDoCheck() {
    // console.log("from file input")
    if (this.ngControl) {
      this.updateErrorState();
      // this.stateChanges.next();
    }
  }
  setSelection(presetId) {

    let d = new Date();
    d.setHours(0, 0, 0, 0)
    this.dateMeta.selectionType = presetId;
    switch (presetId) {
      case ('last7Days'):
        console.log('last 7 days');
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        this._model.add(new Date(d.getTime() - 6 * 86400000));
        this._model.add(d);
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        break;
      case ('last30Days'):
        console.log('last 30 days');
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        this._model.add(new Date(d.getTime() - 29 * 86400000));
        this._model.add(d);
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        break;
      case ('thisMonth'):
        console.log('this month');
        let currentDate = d.getDate()
        if (currentDate != 1) {
          this._model.updateSelection({ start: null, end: null } as unknown as any, this);
          this._model.add(new Date(d.getTime() - (currentDate - 1) * 86400000));
          this._model.add(d);
          this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        }
        break;
      case ('lastMonth'):
        console.log('last month');
        d.setDate(1);
        let lastMonthlastDayDate = new Date(d.getTime() - 86400000)
        let lastMonthLastDay = lastMonthlastDayDate.getDate()
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        this._model.add(new Date(lastMonthlastDayDate.getTime() - (lastMonthLastDay - 1) * 86400000));
        this._model.add(lastMonthlastDayDate);
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        break;
      case ('custom'):
        console.log('custom selection');
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        let dateRange = this.dateMeta.dateString.split(' - ');
        this._model.add(new Date(dateRange[0]));
        this._model.add(new Date(dateRange[1]));
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        break;
      default:
        console.log('default')
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onClick(e: Event) {
    console.log('click document')
    let target, targetId, targetIndex;
    target = e.target;
    targetId = e.target['id'];
    targetIndex = Number(target.getAttribute('data-index'));

    if (this.selectedPresetRef) {
      this.selectedPresetRef.classList.remove('selected')
    }

    let setClass = () => {
      target.classList.add('selected')
      this.selectedPresetRef = target;
      this.overlayRef.dispose()
      this.subscribeBackDropClick.unsubscribe()
    }
    if (this.selectionPresets.map(item => item.id).indexOf(targetId) != -1) {
      let preset = this.selectionPresets[targetIndex]
      this.setSelection(preset.id)
      setClass();
      this.dateMeta.dateString = preset.str;
      this.propagateChange(this._model.selection)
    }

  }

  onClickApply(e: Event) {
    this.dateMeta.selectionType = 'custom';
    this.selectedPresetRef = null;
    const selection = this._model.selection;
    this.dateMeta.dateString = this.nativeDateAdapter.format(selection.start, 'yyyy-mm-dd') + ' - ' + this.nativeDateAdapter.format(selection.end, 'yyyy-mm-dd')
    this.propagateChange(this._model.selection)
    this.overlayRef.dispose()
    this.subscribeBackDropClick.unsubscribe()
  }

  onClickCancel(e: Event) {
    // this.clearSelection(); 
    this.clearSelection()
    this.setSelection(this.dateMeta.selectionType)
    this.overlayRef.dispose()
    this.subscribeBackDropClick.unsubscribe()
  }

  onHover(event) {
    let target = event.target
    const selection = this._model.selection;
    if (target.classList.contains('mat-calendar-body-cell') && selection.start && !selection.end) {
      let calendarBody = this.calendar.monthView._matCalendarBody;
      let matCell = this._getCellFromElement(target);
      calendarBody.previewStart = selection.start.getTime()
      calendarBody.previewEnd = matCell.compareValue
    }
  }

  onSelect(event) {

  }

  _getCellFromElement(element: HTMLElement): MatCalendarCell | null {
    let calendarBody = this.calendar.monthView._matCalendarBody;
    let cell: HTMLElement | undefined;

    if (isTableCell(element)) {
      cell = element;
    } else if (isTableCell(element.parentNode!)) {
      cell = element.parentNode as HTMLElement;
    }

    if (cell) {
      const row = cell.getAttribute('data-mat-row');
      const col = cell.getAttribute('data-mat-col');

      if (row && col) {
        return calendarBody.rows[parseInt(row)][parseInt(col)];
      }
    }

    return null;
  }

  openDateRangePicker(e: Event) {
    // this.clearSelection()
    let positions = [
      new ConnectionPositionPair({ originX: 'start', originY: 'bottom' }, { overlayX: 'start', overlayY: 'top' }),
      new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'bottom' })
    ]
    let positionStrategy = this.positionBuilder.flexibleConnectedTo(this.dateFieldRef)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(false);
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      panelClass: ['atai-date-range-calendar-wrap', 'is-active'],
      positionStrategy: positionStrategy
    })

    this.overlay.position().flexibleConnectedTo(this.dateFieldRef).withPositions

    let portalRef = new TemplatePortal(this.calendarTemplateRef, this.viewContainerRef)
    this.overlayRef.attach(portalRef)
    if (this.calendar) {

    }
    this.subscribeBackDropClick = this.overlayRef.backdropClick().pipe(take(1)).subscribe(() => this.overlayRef.dispose());
  }

  // get the date in between of the start and end dates considering the time for start and end dates is equal
  getTheDatesInBetween(start, end) {
    let startTime = start.getTime();
    let endTime = end.getTime();
    let day = 86400000;
    let tempTime = (startTime < endTime) ? (startTime + day) : (endTime + day);
    let tempEndTime = (startTime < endTime) ? endTime : startTime;
    let returnDates = [];
    while (tempTime <= tempEndTime) {
      let date = new Date(tempTime);
      if (!(date.getDate() === end.getDate() && date.getMonth() === end.getMonth() && date.getFullYear() === end.getFullYear())) {
        returnDates.push(date);
      }
      tempTime += day;
    }
    return returnDates;
  }

  // on clicking the clear selection button we clear the selected dates
  clearSelection() {
    this.selectedDates = [];
    this.dateMeta.selectedRange = null;
    this._model.updateSelection({ start: null, end: null } as unknown as any, this);
    if (this.calendar) {
      this.calendar.updateTodaysDate()
    }
  }

  _handleUserSelection(event: MatCalendarUserEvent<any | null>) {
    // this.calendar.monthView._previewStart = new Date(event.value).getTime();
    // this.calendar.monthView._previewEnd = new Date(event.value).getTime() + 86400000;
    // console.log(  event.value.getTime(), typeof event.value)
    // console.log('selected', this.calendar.monthView._matCalendarBody.previewStart, event.value.getTime(), this.calendar.monthView._previewStart, this.calendar.monthView._previewEnd)
    const selection = this._model.selection;
    const value = event.value;
    const isRange = selection instanceof DateRange;
    // if (isRange && this._rangeSelectionStrategy) {
    //     const newSelection = this._rangeSelectionStrategy.selectionFinished(value, selection as unknown as DateRange<any>, event.event);
    //     this._model.updateSelection(newSelection as unknown as any, this);
    //     this._model.add(value);
    // } else if (value && (isRange || !this._dateAdapter.sameDate(value, selection as unknown as any))) {
    //     this._model.add(value);
    // }


    // // let startDate = selection.start ? selection.start : '';
    if (!selection.end) {
      if (selection.start) {
        let calendarBody = this.calendar.monthView._matCalendarBody;
        calendarBody.previewStart = null;
        calendarBody.previewEnd = null;
        // console.log(this.calendar.monthView._previewStart)
        let isSameDate = selection.start.toString() == value.toString();
        if (value && !isSameDate) {
          // console.log("NOT SAME DATE CAN ADD IN THE DATE LIST and the IN BETWEEN DATES ALSO. CHECK IF ALREADY EXISTS TO NOT DUPLICATE")   
          // if the selected end date is less than the start then set the start to the new date
          if (value.getTime() < selection.start.getTime()) {
            this.resetRange()
            this._model.add(value);
          } else {
            this._model.add(value);

          }
          this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
          console.log("DATE SELECTED RANGE SELECTION", this._model.selection)

          // this.selectedDate = value;
          // CHECK IF ANY DATE ALREADY EXISTS AND GET THE LIST OF DATES TO BE ADDED    
        } else if (value) {
          console.log("SAME DATE SO REMOVE THE DATE FROM THE LIST OF DATES AND ALSO RESET THE DATESELECTION MODEL")
        }
      } else {
        if (value) {
          // this.clearSelection();
          console.log("ADD DATE TO THE SELECTION AND ALSO LIST OF DATES ")
          // this.selectedDates.push(value.toString());
          // this.selectedDate = value;
          // this._model.updateSelection({ start: null, end: null } as unknown as any, this);
          this._model.add(value);
          this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        }
      }
    } else {
      if (value) {
        // this.clearSelection();
        // this._model.add(value);
        // this.selectedDates.push(value.toString());
        // this.dateMeta.selectedRange = value; 
        // this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        this._model.add(value);
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
      }
    }

    // this.calendar.updateTodaysDate();
    // this.cdRef.detectChanges()
    console.log(this._model.selection)
  }

  // resetRange selection model
  resetRange() {
    this._model.updateSelection({ start: null, end: null } as unknown as any, this);
  }


  changeMonth(event) {
    // we are setting selected year. 
    this.year = event.getFullYear();
    this.month = this.listOfMonths[event.getMonth()];
  }

  // dateClass = (date: Date): MatCalendarCellCssClasses => {
  //   // calendar is disabled
  //   if (!this.isCalendarEnabled) {
  //     const highlightDate = this.IsABookedDate(date);
  //     // we show booked dates
  //     return (highlightDate && !this.isCalendarEnabled) ? 'special-date' : '';
  //   } else {
  //     // calendar is enabled
  //     // we show only selected dates and added dates 
  //     let dateString = date.toString();
  //     if (this.selectedDates.indexOf(dateString) != -1) {
  //       return 'selected-date'
  //     } else {
  //       return ""
  //     }
  //   }
  // };

  dateClass = (date: Date): MatCalendarCellCssClasses => {
    // calendar is disabled 
    return "";
  };

  propagateChange = (quantity) => { };

  onTouched = () => { };

  touched = false;

  disabled = false;

  writeValue(date: any) {
    // validate the date string for required format
    let regexDate = new RegExp(/(Last 7 Days|Last 30 Days|Last Month|This Month)|(\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2})/);
    let isValidDate = regexDate.test(date);
    if (date && date.start && date.start instanceof Date && date.end && date.end instanceof Date) {
      this._model.updateSelection({ start: null, end: null } as unknown as any, this);
      this._model.add(new Date(date.start));
      this._model.add(new Date(date.end));
      let selection = this._model.selection
      this.dateMeta.selectedRange = new DateRange(selection.start, selection.end);
      this.dateMeta.dateString = this.nativeDateAdapter.format(selection.start, 'yyyy-mm-dd') + ' - ' + this.nativeDateAdapter.format(selection.end, 'yyyy-mm-dd')
      // if format is satisfied then set the UI and model with the selected dates  
    } else {
      console.warn("THE DATE " + date + " IS NOT A VALID VALUE FOR THE DATE RANGE PICKER");
    }
  }

  registerOnChange(onChange: any) {
    this.propagateChange = onChange;
  }

  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    // this.destroy$.next(null);
    this.fm.stopMonitoring(this.el.nativeElement);
  }

}

// The date preview during range selection is sometimes missing adding a date to preview
// the date range should show the currently selected dates during the opening of the pop up
// The date range should temporarily hold the User interacted data until apply or any of the preset are clicked . If cancel is clicked the date meta should be reverted to the previous selection