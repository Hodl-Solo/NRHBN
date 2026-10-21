# Northern Rivers Honey Badger Network

Static website for Bitcoin meetups across the Northern Rivers, NSW.

## Stack

- Plain HTML/CSS/JavaScript
- Leaflet + OpenStreetMap
- GitHub Pages friendly
- Python-generated meetup data
- GitHub Actions automation

## Updating meetups

`Northern-Rivers-Bitcoin-Meetups.md` is the single source of truth.

Edit a row, commit to `main`, and GitHub Actions runs `generate-meetups.py` to rebuild `meetups-source.html`.

### Meetup statuses

- `Active`
- `Coming Soon`

### Meetup types

- `General`
- `Community`
- `Technical`

## Before launch

Replace the placeholder `hello@example.com` mailto link in `index.html` with the network's preferred contact method. Confirm the direct links and schedules for Women of Bitcoin - Byron Bay, Murbah Bitcoiners and Mullumbimby Bitcoin Meetup.
