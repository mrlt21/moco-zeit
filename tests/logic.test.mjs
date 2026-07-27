// Testet die reine Plan-Logik direkt aus index.html (Single Source of Truth).
// Ausführen: node tests/logic.test.mjs
import { readFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const m = html.match(/\/\*==LOGIC_START==\*\/([\s\S]*?)\/\*==LOGIC_END==\*\//);
if (!m) { console.error('LOGIC-Marker in index.html nicht gefunden'); process.exit(1); }

// Stub-Zuordnung, die die echte Struktur nachbildet
const MAP = { instances: {
  kornflex: { base_url:'x', shooting_task:'Shooting Days',
    task_aliases:{ post:'Post Production','stacy und anna':'Post Production', pre:'Beratung - Kundenmeetings',
      meeting:'Beratung - Kundenmeetings', koordination:'Projektleitung - Koordination',
      dreh:'Shooting Days', admin:'Administration' },
    projects:{
      K_ADMIN:{ identifier:'P22001', name:'Ov_Allgemein', internal:true, markup:false },
      K_CNC:{ identifier:'P25074', name:'coolandclean', markup:true },
      K_GP:{ identifier:'P26026', name:'GP Bern', markup:'post_only' },
      '3T':{ identifier:'P26009', name:'3T Lager', markup:true } } },
  breitbild: { base_url:'y', shooting_task:'Production',
    task_aliases:{ post:'Post-Production', dreh:'Production', admin:'Administration' },
    projects:{ BB_ESA:{ name:'Garagenkonzepte', markup:false } } } },
  redirects:{ K_CNC:{ '3t':'3T' } } };

const L = new Function('MAPPINGS', m[1] + '\n;return {normTask,matchTask,mapTask,markupFactor,findProject,resolveRedirect,round2,parseCSV,csvGroups,buildPlan};')(MAP);
const K = MAP.instances.kornflex, B = MAP.instances.breitbild;

let pass=0, fail=0;
const eq=(got,exp,msg)=>{ const a=JSON.stringify(got),b=JSON.stringify(exp);
  if(a===b){ pass++; } else { fail++; console.error('FAIL:', msg, '\n   got', a, '\n   exp', b); } };
const ok=(cond,msg)=>{ if(cond){ pass++; } else { fail++; console.error('FAIL:', msg); } };

/* Aufschlag-Regeln (inkl. der „Production"-Substring-Falle) */
eq(L.markupFactor(K, K.projects.K_CNC, 'Post Production'), 1.2, 'K_CNC Post → +20%');
eq(L.markupFactor(K, K.projects.K_CNC, 'Produktion - Shooting Days'), 1.0, 'Shooting (langer Name) → kein Aufschlag');
eq(L.markupFactor(K, K.projects.K_GP, 'Post Production'), 1.2, 'GP post_only: Post → +20%');
eq(L.markupFactor(K, K.projects.K_GP, 'Projektleitung - Koordination'), 1.0, 'GP post_only: Koord → kein Aufschlag');
eq(L.markupFactor(K, K.projects.K_ADMIN, 'Administration'), 1.0, 'intern → kein Aufschlag');
eq(L.markupFactor(B, B.projects.BB_ESA, 'Post-Production'), 1.0, 'Breitbild → nie Aufschlag');

/* Task-Matching (der Anzeige-/Substring-Bug) */
eq(L.matchTask([{id:9,name:'Post Production - Graphics und Video'}], 'Post Production').id, 9, 'Substring-Match Post');
eq(L.matchTask([{id:1,name:'Administration'}], 'nonsense'), null, 'kein Match → null');
eq(L.mapTask(K, 'POST'), 'Post Production', 'Alias POST');
eq(L.mapTask(K, 'Stacy und Anna'), 'Post Production', 'Alias Stacy und Anna');
eq(L.mapTask(K, ''), null, 'leerer Name → null');
eq(L.normTask('3 Post-Production'), 'post-production', 'normTask entfernt Nummer');

/* CSV-Parsing + Gruppierung + buildPlan */
const csv = 'timeline,start date,end date,duration (minutes),name,notes\n'+
  '"K_ADMIN",2026-05-06 09:00:00,2026-05-06 10:00:00,60,"Meeting",""\n'+
  '"K_ADMIN",2026-05-06 10:00:00,2026-05-06 10:30:00,30,"Admin",""\n'+
  '"K_CNC",2026-05-06 11:00:00,2026-05-06 12:00:00,60,"POST",""\n'+
  '"K_CNC",2026-05-06 12:00:00,2026-05-06 12:30:00,30,"3T",""\n'+
  '"XYZ",2026-05-06 13:00:00,2026-05-06 14:00:00,60,"egal",""\n';
const groups = L.csvGroups(csv);
ok(Object.keys(groups).length===3, 'csvGroups: 3 Gruppen (K_ADMIN, K_CNC, XYZ)');
const plan = L.buildPlan(groups);
const admin = plan.find(r=>r.csv_code==='K_ADMIN');
eq(admin.task, 'Administration', 'K_ADMIN intern → Administration');
eq(admin.hours_effective, 1.5, 'K_ADMIN zwei Einträge summiert (1.5h)');
eq(admin.description, 'Meeting, Admin', 'Beschrieb = zusammengefasste Namen');
eq(admin.markup, false, 'intern kein Aufschlag');
const cnc = plan.find(r=>r.csv_code==='K_CNC' && r.task==='Post Production');
ok(!!cnc, 'K_CNC POST-Zeile existiert');
eq(cnc.hours_booked, 1.2, 'K_CNC 1.0h * 1.2 = 1.2 gebucht');
ok(plan.some(r=>r.csv_code==='3T'), 'Redirect K_CNC "3T" → Projekt 3T');
const unknown = plan.find(r=>r.csv_code==='XYZ');
ok(unknown && unknown.adhoc===true && unknown.instance===null, 'Unbekanntes Kürzel → adhoc');

console.log(pass+' Tests ok'+(fail?(', '+fail+' FEHLER'):''));
process.exit(fail?1:0);
