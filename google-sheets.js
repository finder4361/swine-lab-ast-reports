/* Google Sheets is contacted directly; credentials live only in page memory. */
(function(root){
 'use strict';
 const scope='https://www.googleapis.com/auth/spreadsheets.readonly';
 const spreadsheetId='1XoEmzrqOYzDl8YE4HU3DLtbnoR4G-W1kiqlPbI8Kiu4';
 let token='',expires=0,pending=false,session=0;
 const connected=()=>!!token&&Date.now()<expires;
 function disconnect(){token='';expires=0;session++;}
 function connect(){
  if(pending)return Promise.reject(Error('Google 登入進行中。'));
  if(!root.google?.accounts?.oauth2)return Promise.reject(Error('Google 登入元件尚未載入，請稍後重試。'));
  const id=root.GOOGLE_CLIENT_ID;
  if(!id)return Promise.reject(Error('網站管理員尚未完成 Google 登入設定。'));
  pending=true;const attempt=++session;
  return new Promise((resolve,reject)=>{
   let timer;
   const fail=message=>{clearTimeout(timer);pending=false;reject(Error(message));};
   const client=root.google.accounts.oauth2.initTokenClient({client_id:id,scope,include_granted_scopes:false,
    callback:r=>{clearTimeout(timer);pending=false;if(attempt!==session)return reject(Error('登入已取消。'));if(r.error||!r.access_token||!root.google.accounts.oauth2.hasGrantedAllScopes(r,scope))return fail('未取得試算表唯讀權限，請重新連線並允許讀取。');token=r.access_token;expires=Date.now()+Math.max(0,Number(r.expires_in||3600)-60)*1000;resolve();},
    error_callback:()=>fail('登入視窗已關閉或無法開啟，請重新點選連線。')});
   timer=setTimeout(()=>{session++;fail('Google 登入逾時，請重新連線。');},120000);
   try{client.requestAccessToken({prompt:'select_account'});}catch(_){fail('無法開啟 Google 登入，請重新連線。');}
  });
 }
 function validate(valueRanges){
  if(!Array.isArray(valueRanges)||valueRanges.length!==3)throw Error('Google 回傳的工作表不完整。');
  const data={};['isolation','pcr','ast'].forEach((k,i)=>data[k]=valueRanges[i].values||[]);
  const C=root.LabCore;
  if(C.norm(data.isolation[0]?.[1])!=='免疫室編號'||C.norm(data.ast[0]?.[1])!=='免疫室編號')throw Error('來源欄位已變更，請先更新欄位對應。');
  for(const d of C.drugs)if(C.norm(data.ast[1]?.[d[3]])!==d[0])throw Error('藥物欄位已變更：'+d[0]+'，已停止讀取以免填錯。');
  return data;
 }
 async function lookup(id){
  root.LabCore.find({isolation:[],pcr:[],ast:[]},id);
  if(!connected()){disconnect();throw Error('請先點選「連線 Google 試算表」；連線過期時需重新登入。');}
  const active=session;
  const q=new URLSearchParams({valueRenderOption:'FORMATTED_VALUE',majorDimension:'ROWS'});
  for(const r of ["'細菌分離紀錄表'!A:AE","'細菌Colony PCR'!A:AI","'藥敏結果紀錄表'!A:BB"])q.append('ranges',r);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+spreadsheetId+'/values:batchGet?'+q,{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:controller.signal});
   if(response.status===401){disconnect();throw Error('Google 連線已過期，請重新連線。');}
   if(response.status===403)throw Error('無法讀取表單。請確認登入帳號有表單權限，並已啟用 Google Sheets API。');
   if(response.status===429)throw Error('查詢次數過多，請稍候再試。');
   if(!response.ok)throw Error('Google 試算表讀取失敗（'+response.status+'），請稍候再試。');
   const body=await response.json();
   if(active!==session)throw Error('連線已中斷，請重新查詢。');
   return root.LabCore.find(validate(body.valueRanges),id);
  }catch(err){if(err.name==='AbortError')throw Error('讀取超過 30 秒，請檢查網路後重試。');throw err;}finally{clearTimeout(timer);}
 }
 root.GoogleSheets={connect,disconnect,connected,lookup,validate};
})(window);
