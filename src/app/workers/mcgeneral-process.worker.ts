/// <reference lib="webworker" />

// returns mode
import {ProcessType} from '../components/byzantine-fault-tolerance/process-type.enum';

function mode(array: number[]) {

  if (array.length === 0) {
    return null;
  }

  const countOne = array.reduce((acc, curr) => {
    if (!acc && curr === 1) {
      return 1;
    } else {
      if (curr === 0 ) {
        return acc;
      }
      if (curr === 1) {
        return acc + 1;
      }
    }
  });

  const countZero = array.length - countOne;

  if (countOne > countZero) {
    return {maj : 1, tally: countOne };
  } else {
    return {maj : 0, tally: countZero };
  }
}


addEventListener('message', ({ data }) => {
  let message;

  let maj: number;
  let tally: number;
  const pid = data.state.pid;

  // unreliable process
  if (data.state.type === ProcessType.unreliable) {
    const coin = Math.round(Math.random());
    message = { bit: coin, pid, msg: ('random') } ;
  } else {

    // reliable process
    tally = mode(data.bits).tally;
    maj = mode(data.bits).maj;

    // shared coin
    // if (tally >= data.edge) { bit = mode; } else { bit = data.coin; }
    const bit = tally >= data.edge ? maj : data.coin;
    let msg: string;
    if (tally >= data.edge) { msg = ('maj = ' + maj); } else {msg = ('coin = ' + bit ); }
    message = { bit, pid, maj, tally, coin: data.coin, msg,  };

  }
  // console.log('received', data.bits );
  // console.log( 'pid', message.pid, 'vote', message.bit, 'maj', maj, 'tally', tally, message.msg,' < > ', data.edge);
  postMessage(message);
}
);