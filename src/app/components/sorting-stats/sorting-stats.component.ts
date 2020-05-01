import {Component, EventEmitter, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {SortingService} from '../../services/sorting.service';
import {UtilsService} from '../../services/utils.service';
import {QuickSort} from '../../algorithms/quickSort';
import {DataBar} from '../../interfaces/data-bar';
import {DataStateService} from '../../services/data-state.service';

@Component({
  selector: 'app-sorting-stats',
  templateUrl: './sorting-stats.component.html',
  styleUrls: ['./sorting-stats.component.scss']
})
export class SortingStatsComponent implements OnInit {

  rqs = new AlgoType('Randomized QuickSort');
  seed: EventEmitter<number[]> = new EventEmitter<number[]>();
  sort$: EventEmitter<any> = new EventEmitter<any>();
  stopEmitter: EventEmitter<any> = new EventEmitter<any>();
  delay: EventEmitter<number> = new EventEmitter<number>();

  form: FormGroup;
  test: FormGroup;

  dataSet: DataBar[] = [];
  fDataSet: DataBar[] = [];

  testMode = '';

  size = 50;
  isSorting = false;
  expectedNumberOfChecks: number;

  numberOfRuns = 10;
  nlogn: number;
  incrementalData: DataBar[] = [];


  constructor(public ds: DataStateService<number>, public ss: SortingService<number>,
              private fb: FormBuilder, private dataHelper: UtilsService<number>) {
  }

  ngOnInit(): void {


    this.emit();
    this.form = this.fb.group({
      isAnimated: [true, []]
    });

    this.test = this.fb.group({
      shuffle: [false, []],
      number: [this.numberOfRuns, []]
    });

    this.form.get('isAnimated').valueChanges.subscribe((s) => {
        const delay = s === true ? 0.002 : 0;
        this.delay.emit(delay);
      }
    );

    this.test.get('number').valueChanges.subscribe((s) => {
        this.numberOfRuns = s;
      }
    );


  }

  public async emit() {
    const data = this.dataHelper.orderedArray(this.size);
    await this.dataHelper.shuffle(data);
    await this.ds.set(data);
    await this.seed.emit(data);
    return data;
  }

  sort() {
    this.testMode = 'Single run';
    this.emit();
    this.sort$.emit();
  }

  stop() {
    this.stopEmitter.emit();
  }

  isReady() {
    return this.isSorting;
  }

  onSorting(newValue: boolean) {
    this.isSorting = newValue;
  }


  async massiveTests() {
    this.testMode = 'Multiple runs';
    this.dataSet = [];
    this.fDataSet = [];
    const algoFactory = () => new QuickSort(0);
    Promise.resolve().then(() => {
      if (this.test.get('shuffle').value) { this.ds.shuffle(); }
      this.ss.runManyTimes(this.numberOfRuns, this.ds.data, algoFactory)
      .then((results) => {
        results.forEach((result, index) => this.dataSet.push({name: index, value: result}));
        this.ss.isSorting.next(false);
        this.fDataSet = this.frequency();
        this.Expectation();
        });
    });
    this.ss.isSorting.emit(false);
  }

  async incrementalTest() {
    this.testMode = 'grow';
    this.incrementalData = [];
    this.ss.algorithm = new QuickSort(0);
    const data = [];
    for (let i = 0; i < this.numberOfRuns; i++ ) {
      data.push(i);
      await this.dataHelper.shuffle(data);
      this.incrementalData.push({name: i, value: await this.ss.algorithm.sort(data)});
    }
  }


  frequency(): any {
    const S: DataBar[] = this.dataSet.map(x => x.value).reduce((acc: DataBar[], item: number) => {
      const n = item;
      const v = acc[item] ? acc[item].value + 1 : 1;
      acc[item] = {name: n, value: v};
      return acc;
    }, []);
    return S.filter(x => x.value > 0);
  }

  Expectation() {
    if (this.dataSet.length > 0) {
      const S = this.dataSet.map(x => x.value);
      const R = this.numberOfRuns;
      const reducer = (accumulator, currentValue) => accumulator + currentValue;
      this.nlogn = this.size * Math.log(this.size);
      this.expectedNumberOfChecks = Math.round( 1 / R * S.reduce(reducer));
    }
  }

}

export class AlgoType {
  constructor(public title: string) {
  }
}

