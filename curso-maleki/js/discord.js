// ── discord.js — Integración Discord OAuth2 y asignación de roles ─────────────

window.MalekiDiscord={

  // Inicia el flujo OAuth2 de Discord
  startOAuth(){
    const cfg=window.DISCORD_CONFIG;
    if(!cfg||cfg.clientId==='TU_DISCORD_CLIENT_ID'){
      window.MalekiUI.toast('Discord no configurado aún. Completa firebase-config.js','error');
      return;
    }
    const params=new URLSearchParams({
      client_id:cfg.clientId,
      redirect_uri:cfg.redirectUri,
      response_type:'token',
      scope:cfg.scope
    });
    window.location.href='https://discord.com/api/oauth2/authorize?'+params.toString();
  },

  // Maneja el callback de Discord (token en el hash de la URL)
  async handleCallback(accessToken){
    try{
      // Obtener datos del usuario Discord
      const res=await fetch('https://discord.com/api/users/@me',{
        headers:{Authorization:'Bearer '+accessToken}
      });
      if(!res.ok) throw new Error('Error obteniendo datos de Discord');
      const discordUser=await res.json();

      // Guardar en perfil
      const user=await window.MalekiAuth.getCurrentUser();
      if(user){
        await window.MalekiDB.linkDiscord(user.uid,discordUser);
        window.MalekiUI.toast('Discord conectado: @'+discordUser.username,'success');
      }
      // Limpiar hash de la URL
      history.replaceState(null,'',window.location.pathname);
      return{ok:true,discord:discordUser};
    }catch(e){
      console.error('Discord callback error',e);
      return{ok:false,error:e.message};
    }
  },

  // Asigna rol en Discord al aprobar un nivel
  // Soporta 3 modos: webhook (Make/Zapier), bot directo (si hay backend), o solo aviso
  async assignRole(uid,level){
    const cfg=window.DISCORD_CONFIG;
    const roleIds={1:cfg?.roles?.iniciado,2:cfg?.roles?.erudito,3:cfg?.roles?.maestro};
    const roleId=roleIds[level];

    // Modo 1: Webhook de Make/Zapier
    if(cfg?.webhookUrl){
      try{
        const progress=await window.MalekiDB.getProgress(uid);
        await fetch(cfg.webhookUrl,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            uid,level,
            discordId:progress.discordId,
            discordUsername:progress.discordUsername,
            roleId,
            guildId:cfg.guildId,
            timestamp:new Date().toISOString()
          })
        });
        console.log('Webhook Discord disparado para nivel',level);
      }catch(e){
        console.warn('Error disparando webhook Discord',e);
      }
      return;
    }

    // Modo 2: Sin configuración — solo log
    console.log('Discord no configurado. Para asignar el rol automáticamente:');
    console.log('1. Crea un bot en https://discord.com/developers/applications');
    console.log('2. Completa DISCORD_CONFIG.webhookUrl en firebase-config.js');
    console.log('Nivel aprobado:',level,'UID:',uid);
  },

  // Verifica si el usuario está en el servidor de Discord (opcional)
  async checkGuildMembership(accessToken,guildId){
    try{
      const res=await fetch('https://discord.com/api/users/@me/guilds',{
        headers:{Authorization:'Bearer '+accessToken}
      });
      const guilds=await res.json();
      return guilds.some(g=>g.id===guildId);
    }catch(e){
      return false;
    }
  }
};

// Verificar si hay un token de Discord en la URL al cargar
(function checkDiscordCallback(){
  const hash=window.location.hash;
  if(hash&&hash.includes('access_token=')){
    const params=new URLSearchParams(hash.slice(1));
    const token=params.get('access_token');
    if(token){
      window.MalekiDiscord.handleCallback(token).then(r=>{
        if(r.ok) window.MalekiUI&&window.MalekiUI.toast('Discord conectado exitosamente','success');
      });
    }
  }
})();
