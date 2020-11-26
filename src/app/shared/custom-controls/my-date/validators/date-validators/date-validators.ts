import { FormGroup } from '@angular/forms';

export class DateValidators {

  public static isValid(form: FormGroup): { [key: string]: boolean } {
    const day = form.get('day').value;
    const month = form.get('month').value;
    const year = form.get('year').value;

    if (day?.length < 2 || month?.length < 2 || year?.length < 4) {
      return null;
    }

    const daysInMonth = new Date(+year, +month, 0).getDate();
    const isValid = day <= daysInMonth;

    return isValid ? null : { invalidDate: true };
  }

}
