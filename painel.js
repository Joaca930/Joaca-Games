'use strict';
const el = id => document.getElementById(id);
let sessao = null;
async function api(path, token, options = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...options, redirect:'error', cache:'no-store',
    headers:{Authorization:'Bearer ' + token, Accept:'application/vnd.github+json', 'Content-Type':'application/json'}
  });
  if (!res.ok) {
    const mensagem = {401:'Token inválido ou vencido.',403:'Confira as permissões Contents e Email addresses do token.',404:'Repositório ou jogos.json não encontrado. Confira o nome, o acesso do token e os arquivos enviados.',409:'O catálogo mudou. Clique em publicar para tentar novamente.',422:'O GitHub recusou a alteração. Confira a branch e as permissões.'};
    throw Error(mensagem[res.status] || 'Falha no GitHub (HTTP ' + res.status + ').');
  }
  return res.json();
}
el('login').onsubmit = async evento => {
  evento.preventDefault();
  const repo = 'Joaca930/Joaca-Games';
  const email = el('email').value.trim().toLowerCase();
  const token = el('token').value.trim();
  const botao = el('login').querySelector('button');
  botao.disabled = true;
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
    const chave = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    if (chave !== 'e62876ce8bd916c4142fd2fd9dd9fb8c7a648ecac00dbf0316391cc533aeaaad') throw Error('Acesso exclusivo do dono.');
    const base = '/repos/' + repo;
    const [usuario, dados, emails] = await Promise.all([api('/user', token), api(base, token), api('/user/emails', token)]);
    if (!emails.some(e => e.verified && e.email.toLowerCase() === email)) throw Error('Confirme esse e-mail na conta do GitHub.');
    if (dados.owner.type !== 'User' || usuario.id !== dados.owner.id) throw Error('Apenas a conta dona deste repositório pode entrar.');
    sessao = {token, base, branch:dados.default_branch};
    el('token').value = '';
    el('login').hidden = true; el('cadastro').hidden = false; el('sair').hidden = false;
    el('status').textContent = ''; el('link').focus();
  } catch (erro) { el('status').textContent = erro.message; }
  finally { botao.disabled = false; }
};
let candidato = null;
function limparPrevia() {
  candidato = null; el('previa').hidden = true; el('amostra').replaceChildren();
}
el('link').oninput = limparPrevia;
el('cadastro').onsubmit = async evento => {
  evento.preventDefault();
  limparPrevia();
  const campo = el('link');
  const botao = el('cadastro').querySelector('button');
  campo.disabled = botao.disabled = el('sair').disabled = true;
  try {
    const url = enderecoPages(campo.value.trim());
    el('status').textContent = 'Verificando o endereço…';
    const res = await fetch(url, {credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(20000)});
    if (!res.ok || !res.headers.get('Content-Type')?.includes('text/html')) throw Error('O endereço precisa abrir uma página HTML publicada.');
    const destino = enderecoPages(res.url);
    if (destino.origin === location.origin && [new URL('./',location.href).pathname,location.pathname,new URL('index.html',location.href).pathname].includes(destino.pathname)) throw Error('Esse endereço é do próprio catálogo. Cole o link do jogo.');
    const doc = new DOMParser().parseFromString(await res.text(),'text/html');
    if (!doc.querySelector('script,iframe,canvas,embed,object,video') && !doc.querySelector('[onclick],input,button')) throw Error('A página abriu, mas não encontrei conteúdo interativo. Confira o link do jogo.');
    candidato = {nome:(doc.title.trim() || destino.pathname.split('/').filter(Boolean).pop() || destino.hostname).slice(0,90), link:url.href};
    el('titulo').textContent = candidato.nome; el('amostra').replaceChildren(criarJogador(candidato));
    el('previa').hidden = false; el('status').textContent = 'Página HTML encontrada. Teste o jogo na prévia.';
  } catch (erro) { el('status').textContent = erro instanceof TypeError ? 'Não foi possível ler o endereço. Confira o link público e o acesso entre sites.' : erro.message; }
  finally { campo.disabled = botao.disabled = el('sair').disabled = false; }
};
el('publicar').onclick = async () => {
  if (!sessao || !candidato) return;
  const {nome, link} = candidato;
  const botao = el('publicar');
  botao.disabled = el('link').disabled = el('cadastro').querySelector('button').disabled = el('sair').disabled = true;
  try {
    const {base, token, branch} = sessao;
    const path = base + '/contents/jogos.json';
    el('status').textContent = 'Publicando…';
    const arquivo = await api(path + '?ref=' + encodeURIComponent(branch), token);
    const bytes = Uint8Array.from(atob(arquivo.content), c => c.charCodeAt(0));
    const jogos = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(jogos)) throw Error('Formato inesperado em jogos.json.');
    if (jogos.some(j => j.link === link)) throw Error('Esse link já está cadastrado.');
    jogos.unshift({nome, link});
    const conteudo = new TextEncoder().encode(JSON.stringify(jogos, null, 2) + '\n');
    const content = btoa(Array.from(conteudo, byte => String.fromCharCode(byte)).join(''));
    await api(path, token, {method:'PUT',body:JSON.stringify({message:'Adicionar jogo: ' + nome, content, sha:arquivo.sha, branch})});
    el('cadastro').reset(); limparPrevia();
    el('status').textContent = nome + ' foi salvo! O jogo aparecerá quando o GitHub Pages terminar a publicação.';
  } catch (erro) { el('status').textContent = erro.message; }
  finally { botao.disabled = el('link').disabled = el('cadastro').querySelector('button').disabled = el('sair').disabled = false; }
};
el('sair').onclick = () => { sessao = null; limparPrevia(); el('cadastro').reset(); el('cadastro').hidden = true; el('sair').hidden = true; el('login').hidden = false; el('status').textContent = 'Você saiu.'; };
