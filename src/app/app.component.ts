import { Component } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { Time } from './shared/custom-controls/my-tel/classes/time';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
 public form: FormGroup = new FormGroup({
    time: new FormControl(new Time('12', '12'))
  });
}
