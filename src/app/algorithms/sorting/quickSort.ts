import { EventEmitter } from '@angular/core';
import { BarColors } from '../../types/barColors';
import { Sortable } from './sortable.interface';
import { Observable } from 'rxjs';


export class QuickSort implements Sortable<number> {
  checks = 0;
  swapEvent = new EventEmitter();
  checkEvent = new EventEmitter();
  colors: EventEmitter<any> = new EventEmitter<any>();
  stop: boolean;
  private painter: BarColors = new BarColors(0, 0, 0, 0);

  constructor(private delay?: number) {
    this.stop = false;
    this.checkEvent.subscribe(() => this.checks++);
  }

  customColors(): Observable<any> {
    return this.colors;
  }

  onSwap(): Observable<any> {
    return this.swapEvent;
  }

  onCheck(): Observable<any> {
    return this.checkEvent;
  }

  onStop() {
    this.stopToggle();
  }

  async sort(data: number[]) {
    this.checks = 0;
    this.randomizedQuickSort(data, 0, data.length - 1);
    return this.checks;

  }

  public stopToggle() {
    this.stop = !this.stop;
  }

  public swap(A: Array<number>, first: number, second: number) {
    this.swapEvent.emit();
    if (this.stop) {
      return;
    }
    const aux = A[first];
    A[first] = A[second];
    A[second] = aux;
  }

  public partition(A: Array<number>, p: number, r: number) {
    if (this.stop) {
      return;
    }
    const x = A[r];
    let i = p - 1;
    let j = p;
    for (j; j < r; j++) {
      this.checkEvent.emit();
      if (A[j] <= x) {
        this.checkEvent.emit();
        i++;
        this.painter.setWhite(j);
        this.painter.setYellow(i);
        this.colors.emit(this.painter);
        this.swap(A, i, j);
      }
    }
    this.swap(A, i + 1, r);
    return i + 1;
  }

  private randomizedPartition(A: Array<number>, p: number, r: number) {
    if (this.stop) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * (r - p + 1)) + p;
    this.swap(A, r, randomIndex);
    return this.partition(A, p, r);
  }


  public randomizedQuickSort(A: Array<number>, p: number, r: number) {
    if (this.stop) {
      return null;
    }
    this.painter.setYellow(p);
    this.painter.setGreen(r);
    if (p <= r) {
      this.checkEvent.emit();
      const q = this.randomizedPartition(A, p, r);
      this.painter.setRed(q - 1);
      this.colors.emit(this.painter);
      this.randomizedQuickSort(A, p, q - 1);
      this.painter.setGreen(r);
      this.painter.setRed(q + 1);
      this.colors.emit(this.painter);
      this.randomizedQuickSort(A, q + 1, r);
    } else {
      return this.checks;
    }
  }



}


