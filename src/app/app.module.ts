import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import { MyDateInput } from './shared/custom-controls/my-date/components/my-date-input/my-date.input';
import { AppComponent } from './app.component';
import { MyTimeInput } from './shared/custom-controls/my-time/components/my-time-input/my-time.input';

@NgModule({
  declarations: [
    AppComponent,
    MyTimeInput,
    MyDateInput,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
