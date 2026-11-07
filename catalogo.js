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
      card.className = 'card'; card.href = url.href; card.target = '_blank'; card.rel = 'noopener noreferrer';
      const nome = document.createElement('strong');
      nome.textContent = jogo.nome;
      const acao = document.createElement('span'); acao.textContent = 'Jogar agora ↗';
      card.append(nome, acao); catalogo.append(card);
    }
  } catch { catalogo.textContent = 'Não foi possível carregar os jogos. Atualize a página ou confira a hospedagem.'; }
}
carregar();
