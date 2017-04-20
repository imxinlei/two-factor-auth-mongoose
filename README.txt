# schedule (draft)
schedule is designed to be the simplest way to deal with complex time-range based scheduling information.

## Table of contents

- [Create a Schedule](#create-a-schedule)
- [Query Schedule Information](#query-schedule-information)
- [API Documentation](#api-documentation)
- [Backwords Compatibility](#backwords-compatibility)

---

## Create a Schedule

`schedule()` will return a Schedule Object.

### simple schedule (daily)
Time range below: Everyday from 0 + 8h (8:00) to 0 + 9h (9:00), carry data {any_field}, combined with everyday (9:00 - 10:00) and (10:00 - 11:00)

```js
const dailySched = schedule().tz('xxx').from('2017-04-01')
  .every('1day').from('8hour').to('9hour').data({ any_field_maybe_target: 1 })
  .and()
  .every('1day').from('9hour').to('10hour').data({ any_field_maybe_target: 2 })
  .and()
  .every('1day').from('10hour').to('11hour').data({ any_field_maybe_target: 1 });
```

### simple schedule (weekly)
Time range below: Every monday / tuesday the whole day, carry data {any_field}

```js
const weeklySched = schedule().tz('xxx').from('2017-04-01')
  .every('monday', 'tuesday').data({ any_field: 'any_value' });

// this is equivalent
const weeklySched = schedule().tz('xxx').from('2017-04-01')
  .every('monday').data({ any_field: 'any_value' })
  .and()
  .every('tuesday').data({ any_field: 'any_value' });

// this is equivalent
const weeklySched = schedule().tz('xxx').from('2017-04-01')
  .every('1week').from('0hour').to('24hour').data({ any_field: 'any_value' })
  .and()
  .every('1week').from('1day').to('2day').data({ any_field: 'any_value' });
```

### simple schedule (other) 
Monthly / Yearly is similar

---

### extreme schedule (Fourier like)
the statement below means the combination of : 

- every 3days and 20min (72h + 20min), from the second day + 5sec to the third day + 10 seconds (24h + 5sec), during this 24h5sec, every hour from 10min to the end of the hour (50min, the last schedule only last for 5 sec). 
- every month 14th and 15th, from the first 8hour to 14hour (means: 14th 8:00 - 14:00 and 15th 8:00 - 14:00)
- every tuesday and wendsday, the whole day

the sample might be overlap, which is not allowed, but just the principle
```js
const sched = schedule().tz('xxx').from('2017-04-01')
  .every('3day20min').from('1day5sec').to('2day10sec')
    .every('1hour').from('10min').data({ any_field_maybe_target: 5, any_field: 'BEFORE_MEAL' })
  .and()
  .every('1month').from('4day').to('9day').data({ any_field_maybe_target: 5 })
  .and()
  .every('tuesday', 'wendsday').data({ target: 3 });

  const schedString = sched.raw();
```

---

## Query Schedule Information
```js
  const restoredSched = schedule(schedString);

  const ranges = restoredSched.queryRanges(new Date('2017-4-1'), Date.now());
  const currentRange = restoredSched.queryRanges(Date.now());

  if (currentRange.data.any_field === 1) {
    // during this time range, something should be done once
  }
```
TODO

## API Documentation
TODO

## Backwords Compatibility
Schedule can output a string or object to express the schedule range.
```json
{
  "__v": "1.0",
  "schedule": {}
}
```
So if the sched string version 1.0 is saved to the database, and when it come out, and the schedule lib is version 1.3, so the string will go throught the convertors (1.0 -> 1.1, 1.1 -> 1.2, 1.2 -> 1.3), after these three convertors, old data will be available for the latest schedul lib.
