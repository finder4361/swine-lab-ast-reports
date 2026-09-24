(function(root){
'use strict';
const clean=v=>String(v??'').trim();
const norm=v=>clean(v).normalize('NFKC').replace(/[‐‑–—−]/g,'-').replace(/\s/g,'').toUpperCase();
const drugs=[['SXT25','Trimethoprim/Sulfamethoxazole','25',11],['AML25','Amoxicillin','25',13],['AMP10','Ampicillin','10',15],['ENR5','Enrofloxacin','5',17],['CL30','Cephalexin','30',19],['KF30','Cephalothin','30',21],['EFT30','Ceftiofur','30',23],['CEQ30','Cefquinome','30',25],['DO30','Doxycycline','30',27],['OT30','Oxytetracycline','30',29],['FFC30','Florfenicol','30',31],['CN10','Gentamicin','10',33],['LS','Lincomycin/Spectinomycin','100',35],['P10','Penicillin G','10',37],['MY15','Lincomycin','15',39],['B10','Bacitracin','10 U',41],['S10','Streptomycin','10',43],['K30','Kanamycin','30',45],['APR15','Apramycin','15',47],['CT10','Colistin Sulphate','10',49]];
const genes=[['STa',21],['STb',22],['LT',23],['AIDA',24],['F18',25],['STx2e',26],['CNF',27]];
function indexed(rows,start){return (rows||[]).slice(start).map((v,i)=>({values:v,row:i+start+1})).filter(x=>clean(x.values[1]));}
function siteMap(rows){const map=Object.create(null);for(const row of (rows||[]).slice(2)){const key=norm(row[0]),name=clean(row[2]);if(key&&name&&!Object.hasOwn(map,key))map[key]=name;}return map;}
function siteName(value,map){const raw=clean(value);return map?.[norm(raw)]||raw;}
function find(data,id){const n=norm(id);if(!/^\d{2,3}-\d+$/.test(n))throw Error('請輸入完整免疫室編號，例如 115-2651。');return {id:n,sites:siteMap(data.sites),isolation:indexed(data.isolation,2).filter(x=>norm(x.values[1])===n),pcr:indexed(data.pcr,3).filter(x=>norm(x.values[1])===n),ast:indexed(data.ast,3).filter(x=>norm(x.values[1])===n)};}
function matches(record,rows,type){const a=record.values;return rows.filter(x=>norm(x.values[2])===norm(a[2])&&(type!=='isolation'||norm(x.values[15])===norm(a[3])));}
function interpretation(v){const s=clean(v);if(!s)return {value:'—',state:'empty',label:'未填寫'};if(/^#/.test(s))return {value:'待確認',state:'error',label:s};if(/^(S|I|R)$/i.test(s))return {value:s.toUpperCase(),state:s.toUpperCase(),label:({S:'具感受性',I:'具中間感受性',R:'具抗藥性'})[s.toUpperCase()]};if(/^Un$/i.test(s))return {value:'Un',state:'unavailable',label:'缺片未檢測'};return {value:'待確認',state:'error',label:s};}
function drugRows(record,kind){return drugs.filter((d,i)=>d[0]!=='CEQ30'&&(i<13||(kind==='positive'?i>=13&&i<16:i>=16))).map(d=>({code:d[0],name:d[1],dose:d[2],mm:clean(record.values[d[3]]),...interpretation(record.values[d[3]+1])}));}
function gram(isolation){const g=clean(isolation?.values[16]);return /Gram\s*\+/.test(g)?'positive':/Gram\s*-/.test(g)?'negative':'';}
function pcrText(record){return record?genes.map(([g,i])=>[g,clean(record.values[i])]).filter(([,v])=>v).map(([g,v])=>g+' ('+v+')').join('、'):'';}
const api={clean,norm,drugs,genes,indexed,siteMap,siteName,find,matches,interpretation,drugRows,gram,pcrText};
if(typeof module!=='undefined')module.exports=api;root.LabCore=api;
})(typeof window!=='undefined'?window:globalThis);
