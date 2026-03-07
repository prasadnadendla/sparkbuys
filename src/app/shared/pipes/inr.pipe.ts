import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(amount: string | number | null | undefined): string {
    if (amount == null) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
}
