(()=>{
  'use strict';
  const el=id=>document.getElementById(id);
  const labels={pending:'Waiting to send',sending:'Sending',retry:'Retry scheduled',accepted:'Accepted by provider',
    delivered:'Delivery confirmed by provider',failed:'Delivery failed',uncertain:'Delivery unconfirmed — review needed',suppressed:'Not sent — notification preference or permission'};
  async function request(path,options={}) {
    const response=await fetch(path,{credentials:'same-origin',...options});
    if(!response.ok)throw Error(response.status===401?'Please sign in again.':'Unable to load notification settings. Please try again.');
    return response.json();
  }
  async function history(){
    el('notificationStatus').textContent='Checking delivery status…';
    try {
      const data=await request('/api/notifications');
      el('notificationHistory').replaceChildren();
      if(!data.enabled){el('notificationStatus').textContent='Delivery tracking is not enabled yet. This does not mean your creations failed.';return;}
      const rows=Array.isArray(data.notifications)?data.notifications:[];
      el('notificationStatus').textContent=rows.length?'Latest notification attempts:':'No tracked notifications yet.';
      for(const row of rows){
        const li=document.createElement('li');
        const date=new Date(row.updated_at);
        li.textContent=`${row.channel==='sms'?'Text':'Email'} · ${labels[row.status] || 'Status unavailable'} · ${Number.isNaN(date.getTime())?'Time unavailable':date.toLocaleString()}`;
        el('notificationHistory').append(li);
      }
    }catch(error){el('notificationStatus').textContent=error.message;}
  }
  window.loadGenerationNotifications=async()=>{
    const checkbox=el('generationEmail'),save=el('saveGenerationEmail'),status=el('generationEmailStatus');
    el('refreshNotifications').onclick=history;
    save.onclick=async()=>{
      const desired=checkbox.checked;save.disabled=true;checkbox.disabled=true;
      try {
        // Preserve the other preference fields rather than resetting marketing/billing.
        const current=await request('/api/settings/notifications');
        const saved=await request('/api/settings/notifications',{method:'PUT',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({...current.notifications,email_generation_complete:desired})});
        checkbox.checked=!!saved.notifications?.email_generation_complete;
        status.textContent='Email preference saved. Existing sent messages cannot be recalled.';
      }catch(error){status.textContent=error.message;}
      finally{save.disabled=false;checkbox.disabled=false;}
    };
    try {
      const data=await request('/api/settings/notifications');
      checkbox.checked=!!data.notifications?.email_generation_complete;
      checkbox.disabled=false;save.disabled=false;status.textContent='Your preference applies to future completion notifications.';
    }catch(error){status.textContent=error.message;}
    await history();
  };
})();
