# TODO Liste

- [x] Test planning service getPlanning.
- [x] A month iterator from 2019 to the end of 2020 and call `getPlanning` for each building in `Room.building`.
- [x] Parse `start & end` attr from `CELACT API` with `new Date(moment.tz(date,'Europe/Paris').format())`
- [ ] add Room service `fetch` `try/catch` error debug log.
- [ ] add Planning service `try/catch` error debug log.
- [x] Routes for :
  - `/`: main entry.
  - `/buildings`: Buildings list.
  - `/rooms/:building`: Get rooms for given buiding or all rooms.