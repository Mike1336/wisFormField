import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, Inject, Input, OnDestroy, Optional, Self, ViewChild } from '@angular/core';
import { FormGroup,FormBuilder, NgControl, AbstractControl, ControlValueAccessor, Validators } from '@angular/forms';
import { MatFormField, MatFormFieldControl, MAT_FORM_FIELD } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import {Time} from '../classes/time';


@Component({
  selector: 'my-time-input',
  templateUrl: './my-time.input.html',
  styleUrls: ['./my-time.input.scss'],
  providers: [{ provide: MatFormFieldControl, useExisting: MyTimeInput }],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  }
})
export class MyTimeInput implements ControlValueAccessor, MatFormFieldControl<Time>, OnDestroy {

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
  public get value(): Time | null {
    if (this.parts.valid) {
      const {
        value: { hours, minutes }
      } = this.parts;
      return new Time(hours, minutes);
    }
    return null;
  }
  public set value(tel: Time | null) {
    const { hours, minutes } = tel || new Time('', '');
    this.parts.setValue({ hours, minutes });
    this.stateChanges.next();
  }

  public static nextId = 0;

  public parts: FormGroup;
  public stateChanges = new Subject<void>();
  public focused = false;
  public controlType = 'example-tel-input';
  public id = `example-tel-input-${MyTimeInput.nextId++}`;
  public onChange = (_: any) => {};
  public onTouched = () => {};

  private _placeholder: string;
  private _required = false;
  private _disabled = false;

  @ViewChild('hours') hoursInput: HTMLInputElement;
  @ViewChild('minutes') minutesInput: HTMLInputElement;

  public get errorState(): boolean {
    return this.parts.invalid && this.parts.dirty;
  }

  public get empty() {
    const {
      value: { hours, minutes }
    } = this.parts;

    return !hours && !minutes;
  }

  public get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  constructor(
    private _formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor, 
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    ) {

    this.parts = _formBuilder.group({
      hours: [
        null,
        [Validators.required, Validators.minLength(2), Validators.min(0), Validators.max(23)]
      ],
      minutes: [
        null,
        [Validators.required, Validators.minLength(2), Validators.min(0), Validators.max(59)]
      ],
    }); // TODO: create own method

    _focusMonitor.monitor(_elementRef, true).subscribe(origin => {
      if (this.focused && !origin) {
        this.onTouched();
      }
      this.focused = !!origin;
      this.stateChanges.next();
    }); // TODO: create own method

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  public autoFocusNext(control: AbstractControl, nextElement?: HTMLInputElement): void {
    if (!control.errors && nextElement) {
      this._focusMonitor.focusVia(nextElement, 'program');
    }
  }

  public autoFocusPrev(control: AbstractControl, prevElement: HTMLInputElement): void {
    if (control.value.length < 1) {
      this._focusMonitor.focusVia(prevElement, 'program');
    }
  }

  public ngOnDestroy() {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  public setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement
      .querySelector('.example-tel-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  public onContainerClick() {
    if (this.parts.controls.hours.valid) {
      this._focusMonitor.focusVia(this.hoursInput, 'program');
    } else if (this.parts.controls.minutes.valid) {
      this._focusMonitor.focusVia(this.minutesInput, 'program');
    }
  }

  public writeValue(time: Time | null): void {
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

  public handleInput(control: AbstractControl, nextElement?: HTMLInputElement): void {
    this.autoFocusNext(control, nextElement);
    this.onChange(this.value);
  }

  public static ngAcceptInputType_disabled: boolean | string | null | undefined;
  public static ngAcceptInputType_required: boolean | string | null | undefined;

}