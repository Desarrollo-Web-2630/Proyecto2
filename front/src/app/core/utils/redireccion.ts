// Evita redirecciones abiertas: solo se acepta una ruta interna ('/procesos'),
// nunca una URL externa ('https://otro.com') ni de protocolo relativo ('//otro.com').
export function rutaInternaSegura(valor: string | null | undefined, porDefecto = '/procesos'): string {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) {
    return porDefecto;
  }
  if (valor.startsWith('/login') || valor.startsWith('/registro') || valor.startsWith('/activar-cuenta')) {
    return porDefecto;
  }
  return valor;
}
