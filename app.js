/* All source text is rendered through textContent or escaped HTML. */
'use strict';
const C=LabCore,$=id=>document.getElementById(id);let data=window.INITIAL_DATA||null,current=null,selected=null;
const e=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function showSource(){const online=GoogleSheets.connected();$('source-mode').textContent=online?'已連線 Google 試算表':'尚未連線 Google 試算表';$('source-detail').textContent=online?'每次查詢即時讀取115下半年度豬病表單。':'不需下載 Excel；請先連線，再輸入免疫室編號。';$('google-disconnect').hidden=!online;$('google-connect').textContent=online?'切換 Google 帳號':'連線 Google 試算表';}
function clearResults(){data=null;current=null;selected=null;$('result').hidden=true;$('empty').hidden=false;$('confirmed').checked=false;$('word').disabled=true;$('pdf').disabled=true;for(const id of ['iso-records','pcr-records','drugs','meta','stamp-status','ast-select','isolation-select','pcr-select','vet-select'])$(id).replaceChildren();}
$('google-connect').addEventListener('click',async()=>{clearResults();GoogleSheets.disconnect();$('google-connect').disabled=true;try{$('message').textContent='請在 Google 視窗完成登入…';await GoogleSheets.connect();$('message').textContent='已連線，請輸入免疫室編號查詢。';}catch(err){$('message').textContent=err.message;}finally{$('google-connect').disabled=false;showSource();}});
$('google-disconnect').addEventListener('click',()=>{GoogleSheets.disconnect();clearResults();showSource();$('message').textContent='已中斷連線並清除查詢結果。';});

function opts(el,rows,label,none){el.replaceChildren(new Option(none,''));for(const r of rows)el.add(new Option(label(r),String(r.row)));}
function records(){ $('iso-summary').textContent='細菌分離 · '+current.isolation.length+' 筆';$('pcr-summary').textContent='Colony PCR · '+current.pcr.length+' 筆';$('iso-records').innerHTML=current.isolation.map(r=>`<div class="raw-record"><small>細菌分離紀錄表 · 第 ${r.row} 列</small><p><b>${e(r.values[2])}</b> · ${e(r.values[15]||'未填結果')} · ${e(r.values[16]||'未填染色結果')}</p><p>培養基：${e(r.values[18]||'—')}　輪值獸醫師：${e(r.values[13]||'—')}</p></div>`).join('')||'<p class="small">沒有分離紀錄。</p>';$('pcr-records').innerHTML=current.pcr.map(r=>`<div class="raw-record"><small>細菌Colony PCR · 第 ${r.row} 列</small><p><b>${e(r.values[2])}</b> · ${e(r.values[3])} · ${e(r.values[4])}</p><p>${r.values.slice(6).map((v,i)=>v?e(pcrLabel(i+6))+': '+e(v):'').filter(Boolean).join('　')||'尚無檢測結果'}</p><p>細菌組獸醫師：${e(r.values[5]||'—')}</p></div>`).join('')||'<p class="small">沒有 Colony PCR 紀錄。</p>';}
function pcrLabel(i){const names={6:'Strep Suis',7:'Strep sp',8:'Gp',9:'Err',10:'App',11:'Bb-DNT',12:'Pm',13:'CPA',14:'CPB',15:'CPE',16:'ETX',17:'IAP',18:'CPB2',19:'Type',20:'Clostridium difficile',21:'STa',22:'STb',23:'LT',24:'AIDA',25:'F18',26:'STx2e',27:'CNF',28:'Sal C',29:'Sal T',30:'Sal sp'};return names[i]||C.clean(data?.pcr?.[2]?.[i])||C.clean(data?.pcr?.[1]?.[i])||'第 '+(i+1)+' 欄';}
function renderResult(){ $('empty').hidden=true;$('result').hidden=false;$('result-id').textContent=current.id;$('counts').textContent=`分離 ${current.isolation.length} · PCR ${current.pcr.length} · 藥敏 ${current.ast.length}`;opts($('ast-select'),current.ast,r=>`${r.values[2]}｜${r.values[3]}｜${r.values[4]}（第 ${r.row} 列）`,'請選擇一筆菌株');$('no-ast').hidden=current.ast.length>0;records();if(current.ast.length===1)$('ast-select').value=String(current.ast[0].row);selectRecord();if(!current.ast.length&&!current.isolation.length&&!current.pcr.length)$('message').textContent='找不到此完整編號，請確認年度與流水號。';}
function selectRecord(){selected=current.ast.find(r=>String(r.row)===$('ast-select').value)||null;$('report-controls').hidden=!selected;$('drug-card').hidden=!selected;$('confirmed').checked=false;$('download-status').textContent='';if(!selected)return;const a=selected.values;$('meta').innerHTML=[['畜主',a[8]],['輪值獸醫師','請見下方印章選擇'],['送檢日期',a[4]],['細菌鑑定',a[3]],['分離部位',a[2]],['藥敏來源','第 '+selected.row+' 列']].map(([k,v])=>'<div><small>'+e(k)+'</small><strong>'+e(v||'—')+'</strong></div>').join('');let iso=C.matches(selected,current.isolation,'isolation');opts($('isolation-select'),iso,r=>`第 ${r.row} 列 · ${r.values[16]||'未填分類'} · ${r.values[18]||'未填培養基'}`,'未指定分離紀錄');if(iso.length===1)$('isolation-select').value=String(iso[0].row);let pcr=C.matches(selected,current.pcr,'pcr');opts($('pcr-select'),pcr,r=>`第 ${r.row} 列 · ${r.values[3]} · ${r.values[4]}`,'不帶入毒力基因結果');$('pcr-select').disabled=!/Escherichia coli/i.test(a[3]||'');$('site-text').value=C.clean(a[2]);$('report-date').value=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});$('match-note').textContent=`同部位且同菌名的分離紀錄 ${iso.length} 筆；同部位 PCR ${pcr.length} 筆。E. coli 毒力結果須手動選擇並核對培養基，不能只依編號帶入。`;$('kind').value=C.gram(iso.length===1?iso[0]:null);selectDutyVet();refresh();}
function selectDutyVet(){
 const iso=current.isolation.find(r=>String(r.row)===$('isolation-select').value);
 const duty=C.clean(iso?.values[13]);
 const names=new Set(Object.keys(ASSETS.stamps));
 current.isolation.forEach(r=>{const n=C.clean(r.values[13]);if(n&&!n.startsWith('#'))names.add(n);});
 if(duty)names.add(duty);
 $('vet-select').replaceChildren(new Option('未指定獸醫師（待補章）',''));
 [...names].sort((a,b)=>a.localeCompare(b,'zh-Hant')).forEach(n=>$('vet-select').add(new Option(n+'－'+(ASSETS.stamps[n]?'選取'+n+'獸醫師的印章':'尚無印章（待補章）'),n)));
 $('vet-select').value=duty;
 $('vet-source').textContent=iso?'預設來源：細菌分離紀錄表第 '+iso.row+' 列，輪值獸醫師：'+(duty||'未填寫')+'。可從選單改選。':'尚未選定唯一分離紀錄，請選擇分離紀錄或手動選章。';
}
function refresh(){if(!selected)return;$('confirmed').checked=false;const vet=$('vet-select').value,stamp=ASSETS.stamps[vet];$('stamp-status').classList.toggle('warning',!stamp);$('stamp-status').innerHTML=stamp?`<span>選用獸醫師：${e(vet)}<br>已找到對應印章</span><img alt="${e(vet)}印章" src="data:image/${stamp.ext==='jpeg'?'jpeg':'png'};base64,${stamp.data}">`:`選用獸醫師：${e(vet||'未指定')} · 未找到對應印章，報告將標示「待補章」。`;const kind=$('kind').value;$('drugs').innerHTML=kind?C.drugRows(selected,kind).map(d=>`<tr><td>${e(d.name)}<small>${e(d.code)}</small></td><td>${e(d.dose)}</td><td>${e(d.mm||'—')}</td><td><span class="badge ${e(d.state)}" title="${e(d.label)}">${e(d.value)}</span>${d.state==='error'?'<small>'+e(d.label)+'</small>':''}</td></tr>`).join(''):'<tr><td colspan="4">請選擇陽性菌或陰性菌範本後，查看對應藥物。</td></tr>';enable();}
function enable(){const ok=!!(selected&&ASSETS.templates[$('kind').value]&&$('kind').value&&/^\d{4}-\d{2}-\d{2}$/.test($('report-date').value)&&$('site-text').value.trim()&&$('confirmed').checked);$('word').disabled=!ok;$('pdf').disabled=!ok;}
function model(){if($('word').disabled)throw Error('請先完成報告欄位並核對資料。');return LabReport.model({record:selected,kind:$('kind').value,pcr:current.pcr.find(r=>String(r.row)===$('pcr-select').value),date:$('report-date').value,site:$('site-text').value.trim(),stampPosition:$('stamp-position').value,vet:$('vet-select').value});}
function save(blob,name){let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}
$('search-form').addEventListener('submit',async ev=>{ev.preventDefault();$('message').textContent='';$('search-button').disabled=true;try{const id=C.norm($('case-id').value);C.find({isolation:[],pcr:[],ast:[]},id);clearResults();$('message').textContent='正在讀取 Google 試算表最新資料…';current=await GoogleSheets.lookup(id);$('message').textContent='最新查詢：'+new Date().toLocaleString('zh-TW');showSource();renderResult();}catch(err){$('message').textContent=err.message||String(err);$('result').hidden=true;$('empty').hidden=false;}finally{$('search-button').disabled=false;showSource();}});
$('ast-select').addEventListener('change',selectRecord);$('isolation-select').addEventListener('change',()=>{let iso=current.isolation.find(r=>String(r.row)===$('isolation-select').value);$('kind').value=C.gram(iso);selectDutyVet();refresh();});for(const id of ['kind','pcr-select','report-date','stamp-position','site-text','vet-select'])$(id).addEventListener('change',refresh);$('confirmed').addEventListener('change',enable);
$('word').addEventListener('click',async()=>{try{let m=model();$('download-status').textContent='正在套用 Word 範本…';$('word').disabled=true;const blob=await LabReport.docx(m);save(blob,`${m.date}_${m.id}_${m.site}_${m.organism}_藥敏報告.docx`.replace(/[\\/:*?"<>|]/g,'_'));$('download-status').textContent='Word 已產生。';}catch(err){$('download-status').textContent='無法產生：'+err.message;}finally{enable();}});
$('pdf').addEventListener('click',()=>{try{let m=model(),w=window.open('','_blank');if(!w)throw Error('請允許此網站開啟報告視窗。');w.document.open();w.document.write(LabReport.printHtml(m));w.document.close();}catch(err){$('download-status').textContent=err.message;}});
showSource();

for(const id of ['site-text','report-date'])$(id).addEventListener('input',()=>{$('confirmed').checked=false;enable();});

$('assets-file').addEventListener('change',async ev=>{
 const file=ev.target.files[0];if(!file)return;
 try{
  if(file.size>12*1024*1024)throw Error('設定檔超過 12 MB。');
  const raw=JSON.parse(await file.text());
  if(!raw.templates||!raw.stamps||!Array.isArray(raw.notes))throw Error('設定格式不正確。');
  for(const kind of ['positive','negative']){
   if(typeof raw.templates[kind]!=='string'||!/^UEs[A-Za-z0-9+/=]+$/.test(raw.templates[kind]))throw Error('缺少有效的 Word 範本。');
   const zip=await JSZip.loadAsync(raw.templates[kind],{base64:true});if(!zip.file('word/document.xml'))throw Error('Word 範本不完整。');
  }
  const stamps=Object.create(null);
  for(const [name,stamp] of Object.entries(raw.stamps)){
   if(!name.trim()||!['png','jpeg','jpg'].includes(stamp.ext)||typeof stamp.data!=='string'||!/^[A-Za-z0-9+/=]+$/.test(stamp.data)||!Number.isFinite(stamp.width)||!Number.isFinite(stamp.height)||stamp.width<=0||stamp.height<=0)throw Error('印章格式不正確。');
   stamps[name]={data:stamp.data,ext:stamp.ext,width:stamp.width,height:stamp.height};
  }
  if(!raw.notes.every(n=>typeof n==='string'))throw Error('報告說明格式不正確。');
  window.ASSETS={templates:{positive:raw.templates.positive,negative:raw.templates.negative},stamps,notes:raw.notes};
  $('assets-status').textContent='已匯入兩份範本與 '+Object.keys(stamps).length+' 位印章。';
  if(selected){selectDutyVet();refresh();}
 }catch(err){$('assets-status').textContent='匯入失敗：'+err.message;}
 ev.target.value='';
});
