async function carregar() {
  const catalogo = document.querySelector('#catalogo');
  try {
    const resposta = await fetch('jogos.json', {cache:'no-store'});
    if (!resposta.ok) throw Error();
    const jogos = await resposta.json();
    catalogo.replaceChildren();
    document.querySelector('#count').textContent = jogos.length + (jogos.length === 1 ? ' jogo' : ' jogos');
    if (!jogos.length) {
      catalogo.className = 'empty';
      catalogo.innerHTML = '<strong>Ainda não há jogos publicados</strong><p>Os jogos do Joaca vão aparecer aqui.</p>';
      return;
    }
    catalogo.className = 'grid';
    for (const jogo of jogos) {
      const url = new URL(jogo.link);
      if (url.protocol !== 'https:') continue;
      const card = document.createElement('a');
      card.className = 'card'; card.href = '#jogar=' + encodeURIComponent(url.href);
      const nome = document.createElement('strong');
      nome.textContent = jogo.nome;
      const acao = document.createElement('span'); acao.textContent = 'Jogar agora ▶';
      card.append(nome, acao); catalogo.append(card);
    }
    function navegar() {
      const jogo = jogos.find(item => location.hash === '#jogar=' + encodeURIComponent(item.link));
      document.querySelector('.hero').hidden = !!jogo;
      document.querySelector('#jogos').hidden = !!jogo;
      document.querySelector('#player').hidden = !jogo;
      const quadro = document.querySelector('#quadro'); quadro.replaceChildren();
      if (jogo) { document.querySelector('#jogando').textContent = jogo.nome; quadro.append(criarJogador(jogo)); window.scrollTo(0,0); }
    }
    addEventListener('hashchange', navegar); navegar();
    const tela = document.querySelector('#tela'); tela.hidden = !document.fullscreenEnabled;
    tela.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.querySelector('#player').requestFullscreen()).catch(() => {});
  } catch { catalogo.textContent = 'Não foi possível carregar os jogos. Atualize a página ou confira a hospedagem.'; }
}
carregar();
