// --- Grelhas (SlickGrid) em ecrãs estreitos ------------------------------
//
// As grelhas correm com forceFitColumns, que espreme as colunas para a largura
// do contentor até ao minWidth de cada uma — 30px por omissão, ilegível num
// telemóvel. Com um mínimo utilizável, o SlickGrid resolve os dois casos:
// poucas colunas cabem e esticam-se; muitas ultrapassam o viewport e ganham
// scroll horizontal dentro da grelha.
//
// A instância vem de $(el).data("slickgridObject"), onde o produto a pendura.
// Mexer no minWidth não marca a vista como alterada: o onColumnsResized só
// dispara no arrasto do separador de colunas.

const LARGURA_MINIMA = 110
const ESTREITO = "(max-width: 949px)"
const MINIMO_DO_PRODUTO = 30   // columnDefaults.minWidth do SlickGrid

function ecraEstreito() {
    return window.matchMedia(ESTREITO).matches
}

function ajustar(contentor) {
    const grelha = window.jQuery && jQuery(contentor).data("slickgridObject")
    if (!grelha || typeof grelha.getColumns !== "function") return

    const minimo = ecraEstreito() ? LARGURA_MINIMA : null
    const colunas = grelha.getColumns()
    let mudou = false

    colunas.forEach(coluna => {
        // colunas de serviço (checkbox de selecção, acções): ficam estreitas
        if (coluna.resizable === false) return

        // número e não undefined: o $.extend do setColumns descarta undefined
        if (typeof coluna.cobMinimoOriginal !== "number") {
            coluna.cobMinimoOriginal = typeof coluna.minWidth === "number"
                ? coluna.minWidth
                : MINIMO_DO_PRODUTO
        }

        const novoMinimo = minimo === null ? coluna.cobMinimoOriginal : minimo
        if (coluna.minWidth === novoMinimo) return

        // o autosizeColumns achata as colunas contra o mínimo; guardar a largura
        // é o que permite repor a proporção que a vista define
        if (minimo !== null) {
            if (typeof coluna.cobLarguraAnterior !== "number") {
                coluna.cobLarguraAnterior = coluna.width
            }
        } else if (typeof coluna.cobLarguraAnterior === "number") {
            coluna.width = coluna.cobLarguraAnterior
            delete coluna.cobLarguraAnterior
        }

        coluna.minWidth = novoMinimo
        mudou = true
    })

    // o setColumns redesenha a grelha e acorda o observador: só escrever quando
    // há mesmo o que mudar evita o ciclo
    if (mudou) grelha.setColumns(colunas)
}

function percorrer() {
    document.querySelectorAll("div[class*='slickgrid_']").forEach(ajustar)
}

let temporizador = null
function agendar() {
    clearTimeout(temporizador)
    temporizador = setTimeout(percorrer, 150)
}

function arrancar() {
    percorrer()
    // as grelhas das referências aparecem tarde e são refeitas a cada pesquisa
    new MutationObserver(mutacoes => {
        // o desenho virtual das linhas mexe no DOM a cada scroll e não traz
        // grelhas novas
        const alheias = mutacoes.some(m =>
            !(m.target.closest && m.target.closest(".slick-viewport")))
        if (alheias) agendar()
    }).observe(document.body, { childList: true, subtree: true })
    window.addEventListener("resize", agendar)
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar)
} else {
    arrancar()
}
