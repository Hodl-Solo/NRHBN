#!/usr/bin/env python3
"""Generate website meetup data from Northern-Rivers-Bitcoin-Meetups.md."""
import html
import re
from pathlib import Path

SOURCE=Path('Northern-Rivers-Bitcoin-Meetups.md')
OUTPUT=Path('meetups-source.html')


def parse_links(cell):
    links=re.findall(r'\[([^\]]+)\]\(([^)]+)\)',cell)
    plain=re.sub(r'\[([^\]]+)\]\(([^)]+)\)','',cell).strip(' ·')
    return links,plain


def parse_coords(value):
    m=re.match(r'^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$',value)
    return m.groups() if m else ('','')


def main():
    rows=[]
    for line in SOURCE.read_text(encoding='utf-8').splitlines():
        if not line.startswith('|') or line.startswith('|---'):
            continue
        cols=[c.strip() for c in line.split('|')[1:-1]]
        if not cols or cols[0]=='Name' or len(cols)<8:
            continue
        name,town,schedule,venue,status,kind,links_cell,map_cell=cols[:8]
        links,note=parse_links(links_cell)
        lat,lon=parse_coords(map_cell)
        rows.append((name,town,schedule,venue,status,kind,links,note,lat,lon))

    parts=['<!DOCTYPE html>','<html lang="en"><head><meta charset="UTF-8"><title>Meetup data</title></head><body>']
    for name,town,schedule,venue,status,kind,links,note,lat,lon in rows:
        attrs={
            'data-name':name,'data-town':town,'data-schedule':schedule,'data-venue':venue,
            'data-status':status,'data-type':kind,'data-lat':lat,'data-lon':lon
        }
        attr_text=' '.join(f'{k}="{html.escape(v,quote=True)}"' for k,v in attrs.items())
        parts.append(f'<div class="meetup-item" {attr_text}>')
        for label,url in links:
            parts.append(f'<a href="{html.escape(url,quote=True)}">{html.escape(label)}</a>')
        if note:
            parts.append(f'<span class="meetup-note">{html.escape(note)}</span>')
        parts.append('</div>')
    parts.append('</body></html>')
    OUTPUT.write_text('\n'.join(parts),encoding='utf-8')
    print(f'Generated {len(rows)} meetup records in {OUTPUT}')

if __name__=='__main__':
    main()
