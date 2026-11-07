function enderecoPages(valor) {
  const url = new URL(valor);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !/^[a-z\d-]+\.github\.io$/i.test(url.hostname))
    throw Error('Cole o endereço publicado do jogo no GitHub Pages (https://usuario.github.io/jogo/).');
  return url;
}
function criarJogador(jogo) {
  const frame = document.createElement('iframe');
  frame.title = jogo.nome;
  frame.setAttribute('sandbox','allow-scripts allow-pointer-lock allow-orientation-lock');
  frame.setAttribute('allow','fullscreen; autoplay; gamepad');
  frame.allowFullscreen = true;
  frame.src = enderecoPages(jogo.link).href;
  return frame;
}
