function enderecoJogo(valor) {
  const url = new URL(valor);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw Error('Cole um link público HTTPS que abra o jogo.');
  return url;
}
function criarJogador(jogo) {
  const frame = document.createElement('iframe');
  frame.title = jogo.nome;
  frame.setAttribute('sandbox','allow-scripts allow-pointer-lock allow-orientation-lock');
  frame.setAttribute('allow','fullscreen; autoplay; gamepad');
  frame.allowFullscreen = true;
  frame.src = enderecoJogo(jogo.link).href;
  return frame;
}
