let contexto;

/** Som breve de encaixe, iniciado apenas por uma ação explícita da pessoa. */
export function tocarEncaixe({ mudo = false } = {}) {
  if (mudo || typeof window === 'undefined' || !window.AudioContext) return;
  try {
    contexto ||= new window.AudioContext();
    if (contexto.state === 'suspended') contexto.resume().catch(() => {});
    const agora = contexto.currentTime;
    const oscilador = contexto.createOscillator();
    const volume = contexto.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(740, agora);
    oscilador.frequency.exponentialRampToValueAtTime(520, agora + 0.075);
    volume.gain.setValueAtTime(0.0001, agora);
    volume.gain.exponentialRampToValueAtTime(0.055, agora + 0.008);
    volume.gain.exponentialRampToValueAtTime(0.0001, agora + 0.09);
    oscilador.connect(volume);
    volume.connect(contexto.destination);
    oscilador.start(agora);
    oscilador.stop(agora + 0.095);
    oscilador.onended = () => { oscilador.disconnect(); volume.disconnect(); };
  } catch { /* Áudio indisponível não pode bloquear a montagem. */ }
}
