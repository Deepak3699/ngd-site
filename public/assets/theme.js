(function(){
  var key='ngd-theme', media=window.matchMedia('(prefers-color-scheme: dark)');
  function choice(){try{return localStorage.getItem(key)||'system'}catch(e){return 'system'}}
  function apply(){
    var c=choice(), mode=c==='system'?(media.matches?'dark':'light'):c;
    document.documentElement.setAttribute('data-theme',mode);
    document.documentElement.style.colorScheme=mode;
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',mode==='light'?'#fbfaff':'#0A0A0F');
    var b=document.getElementById('ngdThemeToggle');
    if(!b)return;
    var icon=c==='system'?'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>':c==='light'?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>':'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>';
    b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon+'</svg>';
    b.setAttribute('aria-label','Theme: '+c+'. Click to change theme.');
    b.title='Theme: '+c+' · click to cycle';
  }
  window.NGDSetTheme=function(c){try{localStorage.setItem(key,c)}catch(e){}apply()};
  apply();
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.getElementById('ngdThemeToggle');if(!b)return;
    b.addEventListener('click',function(){var c=choice();window.NGDSetTheme(c==='system'?'light':c==='light'?'dark':'system')});
    apply();
  });
  if(media.addEventListener)media.addEventListener('change',function(){if(choice()==='system')apply()});
})();