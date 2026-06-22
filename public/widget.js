(function () {
  // ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
  var CHAT_URL = 'https://TU-SUBDOMINIO.villarreal.es/chat'; // <-- cambia esta URL
  var COLOR_PRIMARY = '#005F9E';
  var COLOR_ACCENT = '#FFD700';
  // ──────────────────────────────────────────────────────────────────────────

  var isOpen = false;

  // Botón flotante
  var btn = document.createElement('button');
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  btn.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
    'width:56px', 'height:56px', 'border-radius:50%', 'border:none',
    'background:' + COLOR_PRIMARY, 'color:white', 'cursor:pointer',
    'box-shadow:0 4px 16px rgba(0,0,0,0.25)', 'display:flex',
    'align-items:center', 'justify-content:center',
    'transition:transform 0.2s ease',
  ].join(';');

  btn.onmouseenter = function () { btn.style.transform = 'scale(1.1)'; };
  btn.onmouseleave = function () { btn.style.transform = 'scale(1)'; };

  // Burbuja con "VCF" en el botón
  var badge = document.createElement('span');
  badge.textContent = 'VCF';
  badge.style.cssText = [
    'position:absolute', 'top:-6px', 'right:-6px',
    'background:' + COLOR_ACCENT, 'color:' + COLOR_PRIMARY,
    'font-size:9px', 'font-weight:bold', 'border-radius:8px',
    'padding:2px 4px', 'line-height:1',
  ].join(';');
  btn.style.position = 'fixed';
  btn.appendChild(badge);

  // Panel iframe
  var panel = document.createElement('div');
  panel.style.cssText = [
    'position:fixed', 'bottom:92px', 'right:24px', 'z-index:99998',
    'width:380px', 'height:560px', 'border-radius:16px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.2)', 'overflow:hidden',
    'display:none', 'transition:opacity 0.2s ease',
  ].join(';');

  var iframe = document.createElement('iframe');
  iframe.src = CHAT_URL;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.allow = 'clipboard-write';
  panel.appendChild(iframe);

  btn.addEventListener('click', function () {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    if (isOpen) btn.appendChild(badge);
  });

  document.body.appendChild(panel);
  document.body.appendChild(btn);
})();
