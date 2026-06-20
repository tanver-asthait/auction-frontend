import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indianCurrency',
  standalone: true
})
export class IndianCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return value.toString();
    }

    // 1 Crore = 10,000,000 (10^7)
    if (numValue >= 10000000) {
      const croreVal = numValue / 10000000;
      return `${this.formatNumber(croreVal)} Crore`;
    }

    // 1 Lac = 100,000 (10^5)
    if (numValue >= 100000) {
      const lacVal = numValue / 100000;
      return `${this.formatNumber(lacVal)} Lac`;
    }

    // Otherwise format normally with standard local Indian formatting (en-IN)
    return numValue.toLocaleString('en-IN');
  }

  private formatNumber(num: number): string {
    // Round to 2 decimal places and parse back to strip trailing decimal zeros
    return parseFloat(num.toFixed(2)).toString();
  }
}
