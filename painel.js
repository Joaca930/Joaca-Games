'use strict';
const el = id => document.getElementById(id);
let sessao = null;
const host = location.hostname;
if (host.endsWith('.github.io')) {
  const dono = host.slice(0, -'.github.io'.length);
  const partes = location.pathname.split('/').filter(Boolean);
  el('repo').value = dono + '/' + (partes.length > 1 ? partes[0] : host);
}
async function api(path, token, options = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...options, redirect:'error', cache:'no-store',
    headers:{Authorization:'Bearer ' + token, Accept:'application/vnd.github+json', 'Content-Type':'application/json'}
  });
  if (!res.ok) {
    const mensagem = {401:'Token inválido ou vencido.',403:'Confira a permissão Contents e as regras da branch.',404:'Repositório ou jogos.json não encontrado. Confira o nome, o acesso do token e os arquivos enviados.',409:'O catálogo mudou. Clique em publicar para tentar novamente.',422:'O GitHub recusou a alteração. Confira a branch e as permissões.'};
    throw Error(mensagem[res.status] || 'Falha no GitHub (HTTP ' + res.status + ').');
  }
  return res.json();
}
el('login').onsubmit = async evento => {
  evento.preventDefault();
  const repo = el('repo').value.trim();
  const token = el('token').value.trim();
  const botao = el('login').querySelector('button');
  botao.disabled = true;
  try {
    if (!/^[a-z0-9-]+\/[a-z0-9._-]+$/i.test(repo)) throw Error('Use o formato usuário/repositório.');
    const base = '/repos/' + repo;
    const [usuario, dados] = await Promise.all([api('/user', token), api(base, token)]);
    if (dados.owner.type !== 'User' || usuario.id !== dados.owner.id) throw Error('Apenas a conta dona deste repositório pode entrar.');
    sessao = {token, base, branch:dados.default_branch};
    el('token').value = '';
    el('login').hidden = true; el('cadastro').hidden = false; el('sair').hidden = false;
    el('conta').textContent = dados.full_name + ' · ' + sessao.branch;
    el('status').textContent = ''; el('nome').focus();
  } catch (erro) { el('status').textContent = erro.message; }
  finally { botao.disabled = false; }
};
el('cadastro').onsubmit = async evento => {
  evento.preventDefault();
  const botao = el('cadastro').querySelector('button');
  botao.disabled = true; el('sair').disabled = true;
  try {
    const nome = el('nome').value.trim();
    const link = new URL(el('link').value.trim());
    if (!nome || link.protocol !== 'https:' || link.username || link.password) throw Error('Informe um nome e um link HTTPS público para o jogo.');
    const {base, token, branch} = sessao;
    const path = base + '/contents/jogos.json';
    el('status').textContent = 'Publicando…';
    const arquivo = await api(path + '?ref=' + encodeURIComponent(branch), token);
    const bytes = Uint8Array.from(atob(arquivo.content), c => c.charCodeAt(0));
    const jogos = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(jogos)) throw Error('Formato inesperado em jogos.json.');
    if (jogos.some(j => j.link === link.href)) throw Error('Esse link já está cadastrado.');
    jogos.unshift({nome, link:link.href});
    const conteudo = new TextEncoder().encode(JSON.stringify(jogos, null, 2) + '\n');
    const content = btoa(Array.from(conteudo, byte => String.fromCharCode(byte)).join(''));
    await api(path, token, {method:'PUT',body:JSON.stringify({message:'Adicionar jogo: ' + nome, content, sha:arquivo.sha, branch})});
    el('cadastro').reset();
    el('status').textContent = nome + ' foi salvo! O jogo aparecerá quando o GitHub Pages terminar a publicação.';
  } catch (erro) { el('status').textContent = erro.message; }
  finally { botao.disabled = false; el('sair').disabled = false; }
};
el('sair').onclick = () => { sessao = null; el('cadastro').reset(); el('cadastro').hidden = true; el('sair').hidden = true; el('login').hidden = false; el('status').textContent = 'Você saiu.'; };
