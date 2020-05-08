import {Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {SortingService} from '../../services/sorting.service';
import {UtilsService} from '../../services/utils.service';
import {QuickSort} from '../../algorithms/sorting/quickSort';
import {DataBar} from '../../interfaces/data-bar';
import {DataStateService} from '../../services/data-state.service';

export interface MultiBar {
 name: any;
 series: DataBar[];
}


@Component({
  selector: 'app-sorting-stats',
  templateUrl: './sorting-stats.component.html',
  styleUrls: ['./sorting-stats.component.scss']
})
export class SortingStatsComponent implements OnInit, OnDestroy {


  seed: EventEmitter<number[]> = new EventEmitter<number[]>();
  delay = 1;

  form: FormGroup;
  test: FormGroup;

  // checks
  singleRunBars: DataBar[] = [];
  checksPerRun: DataBar[] = [];

  checksGraph: MultiBar[] = [];
  distribution: MultiBar[] = [];
  ExpectationPerRun: DataBar[] = [];

  // swaps
  swapsPerRun: DataBar[] = [];

  testMode = '';

  size = 50;
  isSorting = false;
  expectedNumberOfChecks: number;
  progress: number;
  numberOfRuns = 10;
  nlogn: DataBar[] = [];
  incrementalData: DataBar[] = [];

  // calculation of c
  private cArray: number[];
  c: number;
  runningNumber = 0;



  constructor(public ds: DataStateService<number>, public ss: SortingService<number>,
              private fb: FormBuilder, private dataHelper: UtilsService<number>) {
  }

  ngOnInit(): void {


    this.emit();

    this.ss.updates.subscribe((data) => {
      console.log(data, this.testMode);
      if (this.testMode === 'Single run') {

        this.singleRunBars = data;
      }
    });

    this.form = this.fb.group({
      isAnimated: [true, []]
    });

    this.test = this.fb.group({
      shuffle: [false, []],
      number: [this.numberOfRuns, []]
    });

    this.form.get('isAnimated').valueChanges.subscribe((s) => {
        this.delay = s ? 1 : 0;
      }
    );

    this.test.get('number').valueChanges.subscribe((s) => {
        this.numberOfRuns = s;
      }
    );

    this.ss.yieldChecks.subscribe((v) => {
      this.runningNumber ++;
      this.progress = Math.floor((this.runningNumber / this.numberOfRuns ) * 100);
      this.checksPerRun.push(v.c);
      this.swapsPerRun.push(v.s);
      if (this.runningNumber === this.numberOfRuns ) {
        this.isSorting = false;
        this.checksGraph = [
            { name: 'Checks per run', series: this.checksPerRun },
            { name: 'checks expectation', series: this.ExpectationPerRun },
            { name: 'n log n', series: this.nlogn },
            { name: 'Swaps per run', series: this.swapsPerRun },
          ];
        this.distribution = [{ name: 'distribution', series: this.frequency()}];
        // console.log( this.c );
      }
      this.expectation();
    });

    this.ss.isSorting.subscribe((val) => this.isSorting = val);
    this.ds.dataSeed.subscribe((data) => this.singleRunBars = data);
  }

  public async emit() {
    const data = this.dataHelper.orderedArray(this.size);
    await this.dataHelper.shuffle(data);
    await this.ds.set(data);
    await this.seed.emit(data);
    return data;
  }

  async sort() {
    this.testMode = 'Single run';
    await this.ss.run(1, this.ds.data);
  }

  stop() {
    this.ss.stop();
  }

  async massiveTests() {
    this.progress = 0;
    this.runningNumber = 0;
    this.ExpectationPerRun = [];
    this.isSorting = true;
    this.testMode = 'Multiple runs';
    this.checksPerRun = [];
    this.swapsPerRun = [];
    this.nlogn = [];
    this.cArray = [];
    this.ss.run(this.numberOfRuns, this.ds.data);
  }
  async incrementalTest() {
    this.testMode = 'grow';
    this.incrementalData = [];
    this.ExpectationPerRun = [];
    this.ss.algorithm = new QuickSort(0);
    const data = [];
    for (let i = 0; i < this.numberOfRuns; i++ ) {
      data.push(i);
      await this.dataHelper.shuffle(data);
      this.incrementalData.push({name: i, value: await this.ss.algorithm.sort(data)});
    }
  }
  frequency(): any {
    const S: DataBar[] = this.checksPerRun.map(x => x.value).reduce((acc: DataBar[], item: number) => {
      const n = item;
      const v = acc[item] ? acc[item].value + 1 : 1;
      acc[item] = {name: n, value: v};
      return acc;
    }, []);
    return S.filter(x => x.value > 0);
  }
  expectation() {
    if (this.checksPerRun.length > 0) {
      const S = this.checksPerRun.map(x => x.value);
      const sum = (accumulator, currentValue) => accumulator + currentValue;
      this.expectedNumberOfChecks = 1 / this.checksPerRun.length * S.reduce(sum);
      const nlogn = {name: this.checksPerRun.length, value: this.size * Math.log(this.size)};
      const expected = {name: this.checksPerRun.length , value: this.expectedNumberOfChecks };
      this.nlogn.push (nlogn);
      this.ExpectationPerRun.push(expected);
      this.c = expected.value / nlogn.value;

    }
    // this.ExpectationPerRun = [...this.ExpectationPerRun];
  }

  async shuffle() {
    this.testMode = 'Single run';
    await this.ds.shuffle();
  }

  async changeInputSize() {
    this.testMode = 'Single run';
    await this.emit();
  }
  ngOnDestroy(): void {
  }
}
