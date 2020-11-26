import { Component, ElementRef, Inject, Input, OnDestroy, Optional, Self, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, NgControl, AbstractControl, ControlValueAccessor, Validators } from '@angular/forms';

import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatFormField, MatFormFieldControl, MAT_FORM_FIELD } from '@angular/material/form-field';

import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ITime } from './../../Interfaces/time';


@Component({
  selector: 'my-time-input',
  templateUrl: './my-time.input.html',
  styleUrls: ['./my-time.input.scss'],
  providers: [{ provide: MatFormFieldControl, useExisting: MyTimeInput }],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class MyTimeInput implements ControlValueAccessor, MatFormFieldControl<ITime>, OnDestroy {

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
  public get value(): ITime | null {
    if (this.parts.valid) {
      const { value: { hours, minutes } } = this.parts;

      return { hours, minutes };
    }

    return null;
  }
  public set value(time: ITime | null) {
    const { hours, minutes } = time || { hours: '', minutes: '' };
    this.parts.setValue({ hours, minutes });
    this.stateChanges.next();
  }

  public static nextId = 0;
  public static ngAcceptInputTypeDisabled: boolean | string | null | undefined;
  public static ngAcceptInputTypeRequired: boolean | string | null | undefined;

  @ViewChild('hours')
  public hoursInput: HTMLInputElement;

  @ViewChild('minutes')
  public minutesInput: HTMLInputElement;

  public stateChanges = new Subject<void>();
  public parts: FormGroup;
  public focused = false;
  public controlType = 'example-tel-input';
  public id = `example-tel-input-${MyTimeInput.nextId++}`;

  private _placeholder: string;
  private _required = false;
  private _disabled = false;

  private _destroy$ = new ReplaySubject<number>(1);

  constructor(
    private _formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    ) {
    this._initTable();
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

  public onChange = (_: any) => {};
  public onTouched = () => {};

  public get errorState(): boolean {
    return this.parts.invalid && this.parts.dirty;
  }

  public get empty(): boolean {
    const { value: { hours, minutes } } = this.parts;

    return !hours && !minutes;
  }

  public get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  public setDescribedByIds(ids: string[]): void {
    const controlElement = this._elementRef.nativeElement
      .querySelector('.example-tel-input-container');
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  public onContainerClick(): void {
    if (this.parts.valid) {
      return;
    }

    if (this.parts.controls.hours.valid) {
      this._focusMonitor.focusVia(this.minutesInput, 'program');
    } else {
      this._focusMonitor.focusVia(this.hoursInput, 'program');
    }
  }

  public writeValue(time: ITime | null): void {
    this.value = time;
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

  private _initTable(): void {
    this.parts = this._formBuilder.group({
      hours: [
        null,
        [Validators.required, Validators.minLength(2), Validators.min(0), Validators.max(23)],
      ],
      minutes: [
        null,
        [Validators.required, Validators.minLength(2), Validators.min(0), Validators.max(59)],
      ],
    });
  }

  private _enableFocusChecking(): void {
    this._focusMonitor.monitor(this._elementRef, true)
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe(
      (origin) => {
        if (this.focused && !origin) {
          this.onTouched();
        }
        this.focused = !!origin;
        this._checkMinutes(this.focused);
        this.stateChanges.next();
      });
  }

  private _checkMinutes(focusStatus: boolean): void {
    if (focusStatus || this.parts.valid) {
      return;
    }

    this.value = {
      hours: this._getValidHours(),
      minutes: this._getValidMinutes(),
    };
    this.onChange(this.value);
  }

  private _getValidHours(): string {
    const hours = this.parts.get('hours').value;

    if (hours?.length === 1) {
      return `0${hours}`;
    }

    return hours;
  }

  private _getValidMinutes(): string {
    const hours = this.parts.get('hours').value;
    const minutes = this.parts.get('minutes').value;

    if (!hours) {
      return '';
    }

    if (!minutes) {
      return '00';
    }

    if (minutes?.length === 1) {
      return `0${minutes}`;
    }

    return minutes;
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

