const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let meetups=[],activeType='all',query='',mapInstance=null;

function escapeHtml(v=''){
  return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','"':'&quot;'}[c]));
}
function escapeAttr(v=''){return escapeHtml(v);}

function extract(){
  fetch('meetups-source.html',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('Meetup source unavailable');return r.text();})
    .then(html=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      meetups=$$('.meetup-item',doc).map(item=>({
        name:item.dataset.name||'',
        town:item.dataset.town||'',
        type:item.dataset.type||'General',
        status:item.dataset.status||'Active',
        schedule:item.dataset.schedule||'',
        venue:item.dataset.venue||'',
        lat:Number.parseFloat(item.dataset.lat),
        lon:Number.parseFloat(item.dataset.lon),
        links:$$('a',item).map(a=>({label:a.textContent.trim(),href:a.getAttribute('href')})),
        note:$('.meetup-note',item)?.textContent.trim()||''
      }));
      $('#hero-count').textContent=meetups.length;
      $('#town-count').textContent=new Set(meetups.map(m=>m.town)).size;
      render();
      renderMap();
    })
    .catch(()=>{
      $('#hero-count').textContent='—';
      $('#town-count').textContent='—';
      $('#results-count').textContent='Could not load meetup listings.';
      const map=$('#meetup-map');
      if(map)map.innerHTML='<p class="map-error">Could not load meetup locations.</p>';
    });
}

function card(m){
  const coming=m.status.toLowerCase().includes('coming');
  const links=m.links.length
    ?m.links.map(l=>`<a href="${escapeAttr(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`).join('')
    :`<span>${escapeHtml(m.note||'Details coming soon')}</span>`;
  return `<article class="meetup-card ${coming?'featured':''}">
    <div class="card-top">
      <div>
        <div class="card-town">${escapeHtml(m.town)}</div>
        <h3>${escapeHtml(m.name)}</h3>
      </div>
      <span class="type-tag">${escapeHtml(m.type)}</span>
    </div>
    <div class="status ${coming?'soon':''}">${escapeHtml(m.status)}</div>
    <p class="schedule">${escapeHtml(m.schedule)}</p>
    ${m.venue?`<p class="venue">${escapeHtml(m.venue)}</p>`:''}
    <div class="card-links">${links}</div>
  </article>`;
}

function render(){
  const q=query.trim().toLowerCase();
  const visible=meetups.filter(m=>{
    const typeMatch=activeType==='all'||(activeType==='Coming Soon'?m.status==='Coming Soon':m.type===activeType);
    const searchMatch=!q||`${m.name} ${m.town} ${m.type} ${m.schedule} ${m.venue}`.toLowerCase().includes(q);
    return typeMatch&&searchMatch;
  });
  $('#meetup-grid').innerHTML=visible.map(card).join('');
  $('#results-count').textContent=`${visible.length} meetup${visible.length===1?'':'s'} shown`;
  $('#empty-state').hidden=visible.length!==0;
  $('#clear-search').hidden=!q&&activeType==='all';
}

function mapPopup(m){
  const coming=m.status.toLowerCase().includes('coming');
  const links=m.links.length?`<div class="map-popup-links">${m.links.map(l=>`<a href="${escapeAttr(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`).join('')}</div>`:'';
  return `<div class="map-popup"><strong>${escapeHtml(m.name)}</strong><span class="map-popup-town">${escapeHtml(m.town)} · ${escapeHtml(m.type)}</span><span class="map-popup-status ${coming?'soon':''}">${escapeHtml(m.status)}</span><p>${escapeHtml(m.schedule)}</p>${links}</div>`;
}

function renderMap(){
  const el=$('#meetup-map');
  if(!el||typeof L==='undefined')return;
  if(mapInstance){mapInstance.remove();mapInstance=null;}
  const mapped=meetups.filter(m=>Number.isFinite(m.lat)&&Number.isFinite(m.lon));
  if(!mapped.length){el.innerHTML='<p class="map-error">No meetup locations are available.</p>';return;}

  mapInstance=L.map(el,{scrollWheelZoom:false,preferCanvas:true,zoomControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapInstance);

  const bounds=[];
  mapped.forEach((m,index)=>{
    const coming=m.status.toLowerCase().includes('coming');
    // Small offsets keep multiple Byron Bay groups individually clickable.
    const offsets=[[0,0],[.006,.008],[-.005,.009],[.004,-.008]];
    const sameTownBefore=mapped.slice(0,index).filter(x=>x.town===m.town).length;
    const [latOffset,lonOffset]=offsets[sameTownBefore%offsets.length];
    const point=[m.lat+latOffset,m.lon+lonOffset];
    const marker=L.circleMarker(point,{
      radius:coming?8:7,
      color:coming?'#139DF2':'#F25D07',
      weight:coming?3:2,
      dashArray:coming?'4 4':null,
      fillColor:coming?'#051F40':'#F27405',
      fillOpacity:coming?.35:.94
    }).addTo(mapInstance);
    marker.bindPopup(mapPopup(m),{maxWidth:300});
    bounds.push(point);
  });

  mapInstance.fitBounds(bounds,{padding:[38,38],maxZoom:10});
  const legend=L.control({position:'bottomright'});
  legend.onAdd=()=>{
    const div=L.DomUtil.create('div','map-legend');
    div.innerHTML='<span><i class="legend-dot active"></i>Active</span><span><i class="legend-dot soon"></i>Coming soon</span>';
    return div;
  };
  legend.addTo(mapInstance);
}

document.addEventListener('DOMContentLoaded',()=>{
  extract();
  const menu=$('.menu-toggle'),nav=$('#site-nav');
  menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  $$('#site-nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');}));
  $('#directory-search')?.addEventListener('input',e=>{query=e.target.value;render();});
  $$('.filter').forEach(btn=>btn.addEventListener('click',()=>{
    activeType=btn.dataset.type;
    $$('.filter').forEach(b=>b.classList.toggle('active',b===btn));
    render();
  }));
  $('#clear-search')?.addEventListener('click',()=>{
    query='';activeType='all';$('#directory-search').value='';
    $$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.type==='all'));
    render();
  });
});
