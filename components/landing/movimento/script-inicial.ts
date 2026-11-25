/**
 * Chaves e script que roda ANTES da primeira pintura (inline no topo da landing). Sem React, para o
 * Server Component poder importar. O conteúdo é visível sem JS: só a classe `mv-abertura` esconde algo
 * (decoração do herói), e o failsafe tira tudo se o JS não montar em 1,5 s (06-MOVIMENTO.md).
 */
export const CHAVE_LEVE = "cc-modo-leve";
export const CHAVE_ABERTURA = "cc-abertura";
export const CONSULTA_REDUZIDO = "(prefers-reduced-motion: reduce)";
export const FAILSAFE_MS = 1500;

export const SCRIPT_INICIAL = `(function(){var c=document.documentElement.classList,e=false;
try{e=localStorage.getItem("${CHAVE_LEVE}")==="1"}catch(x){}
if(matchMedia("${CONSULTA_REDUZIDO}").matches)e=true;
c.add("mv");
if(e)c.add("mv-estatico");
else try{if(!sessionStorage.getItem("${CHAVE_ABERTURA}")){sessionStorage.setItem("${CHAVE_ABERTURA}","1");c.add("mv-abertura")}}catch(x){}
setTimeout(function(){if(!c.contains("mv-pronto"))c.remove("mv","mv-abertura")},${FAILSAFE_MS})})()`;
