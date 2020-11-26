import { Component } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  public form = new FormGroup({
    date: new FormControl(null),
    time: new FormControl(null),
  });

  public get date(): AbstractControl {
    return this.form?.get('date');
  }

  public get time(): AbstractControl {
    return this.form?.get('time');
  }

}
