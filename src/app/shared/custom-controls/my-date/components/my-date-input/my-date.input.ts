import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  Optional,
  Inject,
  Self,
} from '@angular/core';
import {
   AbstractControl,
   ControlValueAccessor,
   FormGroup,
   NgControl,
   Validators,
   FormControl,
  } from '@angular/forms';

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatFormField, MatFormFieldControl, MAT_FORM_FIELD } from '@angular/material/form-field';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';

import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DateValidators } from '../../validators/date-validators/date-validators';
import { IDate } from '../../interfaces/date';

@Component({
  selector: 'my-date-input',
  templateUrl: './my-date-input.html',
  styleUrls: ['./my-date-input.scss'],
  providers: [{ provide: MatFormFieldControl, useExisting: MyDateInput }],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class MyDateInput implements ControlValueAccessor, MatFormFieldControl<IDate>, OnDestroy {

  @Input()
  public get placeholder(): string {
    return this._placeholder;
  }
  public set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  public get required(): boolean {
    return this._required;
  }
  public set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  public get disabled(): boolean {
    return this._disabled;
  }
  public set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }

  @Input()
  public get value(): IDate | null {
    if (this.parts.valid) {
      const { value: { day, month, year } } = this.parts;

      return { day, month, year };
    }

    return null;
  }
  public set value(date: IDate | null) {
    const { day, month, year } = date || { day: '', month: '', year: '' };
    this.parts.setValue({ day, month, year });
    this.stateChanges.next();
  }

  public static nextId = 0;
  public static ngAcceptInputTypeDisabled: boolean | string | null | undefined;
  public static ngAcceptInputTypeRequired: boolean | string | null | undefined;

  @ViewChild('day')
  public dayInput: HTMLInputElement;

  @ViewChild('month')
  public monthInput: HTMLInputElement;

  @ViewChild('year')
  public yearInput: HTMLInputElement;


  public stateChanges = new Subject<void>();
  public parts: FormGroup;
  public focused = false;
  public controlType = 'example-tel-input';
  public id = `example-tel-input-${MyDateInput.nextId++}`;

  public dayControl: FormControl;

  public monthControl: FormControl;

  public yearControl: FormControl;

  private _placeholder: string;
  private _required = false;
  private _disabled = false;

  private readonly _currentYear = new Date().getFullYear();

  private _destroy$ = new ReplaySubject<number>(1);

  constructor(
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    ) {
    this._initForm();
    this._enableFocusChecking();

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  public onChange = (value: any) => {};
  public onTouched = () => {};

  public get errorState(): boolean {
    return this.parts.invalid && this.parts.dirty;
  }

  public get empty(): boolean {
    const {
      value: { day, month, year },
    } = this.parts;

    return !day && !month && !year;
  }

  public get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  public setDescribedByIds(ids: string[]): void {
    const controlElement = this._elementRef.nativeElement
    .querySelector('.date-input-container');
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  public onContainerClick(): void {
    if (this.parts.valid) {
      return;
    }

    if (!this.parts.controls.day.valid) {
      this._focusMonitor.focusVia(this.dayInput, 'program');
    } else if (!this.parts.controls.month.valid) {
      this._focusMonitor.focusVia(this.monthInput, 'program');
    } else if (!this.parts.controls.year.valid) {
      this._focusMonitor.focusVia(this.yearInput, 'program');
    }
  }

  public writeValue(date: IDate | null): void {
    this.value = date;
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public handleInput(event: any, control: AbstractControl, nextElement?: HTMLInputElement): void {
    const isOverflow = this._isOverflow(control, event.key);

    if (isOverflow) {
      this._autoFocusNext(control, nextElement);
    }

    if (this.parts.valid) {
      this.onChange(this.value);
    }
  }

  public handleBackspace(control: AbstractControl, prevElement: HTMLInputElement): void {
    if (control.value.length !== 0) {
      return;
    }

    this._autoFocusPrev(prevElement);
  }

  private _initForm(): void {
    this.dayControl = new FormControl(
      null,
      [
        Validators.required,
        Validators.minLength(2),
        Validators.min(1),
        Validators.max(31),
      ],
    );
    this.monthControl = new FormControl(
      null,
      [
        Validators.required,
        Validators.minLength(2),
        Validators.min(1),
        Validators.max(12),
      ],
    );

    this.yearControl = new FormControl(
      null,
      [
        Validators.required,
        Validators.minLength(4),
        Validators.min(1970),
        Validators.max(this._currentYear),
      ],
    );

    this.parts = new FormGroup({
      day: this.dayControl,
      month: this.monthControl,
      year: this.yearControl,
    },
      [
        DateValidators.isValid,
      ],
    );
  }

  private _enableFocusChecking(): void {
    this._focusMonitor.monitor(this._elementRef, true)
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe(
      (origin: FocusOrigin) => {
        if (this.focused && !origin) {
          this.onTouched();
        }
        this.focused = !!origin;
        this._checkDate();
        this.stateChanges.next();
      });
  }

  private _checkDate(): void {
    if (this.focused || this.parts.valid) {
      return;
    }

    this.value = {
      day: this._getValidDay(),
      month: this._getValidMonth(),
      year: this._getValidYear(),
    };
    this.onChange(this.value);
  }

  private _getValidDay(): string {
    const day = this.parts.get('day').value;

    if (day === '0') {
      return '';
    }

    if (day?.length === 1) {
      return `0${day}`;
    }

    return day;
  }

  private _getValidMonth(): string {
    const month = this.parts.get('month').value;

    if (month === '0') {
      return '';
    }

    if (month?.length === 1) {
      return `0${month}`;
    }

    return month;
  }

  private _getValidYear(): string {
    const year = this.parts.get('year').value;

    if (year?.length < 4) {
      return '';
    }

    return year;
  }

  private _isOverflow(
    currentControl: AbstractControl,
    clickedKey: string,
    ): boolean {
    return currentControl.value.length === 2 && !isNaN(+clickedKey);
  }

  private _autoFocusNext(control: AbstractControl, nextElement?: HTMLInputElement): void {
    if (control.valid && nextElement) {
      this._focusMonitor.focusVia(nextElement, 'program');
    }
  }

  private _autoFocusPrev(prevElement: HTMLInputElement): void {
    this._focusMonitor.focusVia(prevElement, 'program');
  }

}
