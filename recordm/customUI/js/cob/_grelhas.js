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

// --- O menu de acções sai da grelha ---------------------------------------
//
// A coluna das acções traz um dropdown (DELETE, DUPLICATE, …) desenhado dentro
// da célula e mais alto do que a linha. Para ele poder sair da grelha, o
// produto deixa a cadeia toda em overflow visível: a célula (.entry-actions),
// o canvas, e o próprio viewport, que o presenter põe em overflow:visible logo
// a seguir a criar a grelha.
//
// Desde que o viewport passou a ser a área de scroll horizontal (ver a regra
// das grelhas no _global.css) voltou a cortá-lo: nas últimas linhas o menu
// aparecia truncado, muitas vezes só com a primeira opção. Um scroll container
// corta sempre o que está posicionado lá dentro, e não dá para o pedir só num
// eixo — pôr overflow-x em auto arrasta o overflow-y atrás.
//
// A saída é o menu deixar de estar lá dentro: em position:fixed o bloco
// contentor passa a ser a janela, e o corte do viewport não o apanha. Mede-se
// a caixa enquanto ele ainda está absolute, e é dessa medida que saem as
// coordenadas de ecrã — assim não é preciso repetir aqui o alinhamento que o
// CSS do produto lhe dá (right:0 contra a célula). Em troca deixa de acompanhar
// a grelha, e por isso fecha-se mal algo role.
//
// Solto, sobra o problema que a grelha escondia: o menu abre sempre para baixo
// do botão e, numa linha junto ao fundo da janela, fica fora do ecrã. Rolar
// para lá não é saída — o scroll fecha-o. Por isso, quando não cabe para baixo
// e há mais espaço para cima, abre para cima; e em qualquer dos casos encosta-se
// ao ecrã em vez de sair dele.

const MENU_ABERTO = ".slick-viewport .dropdown.open > .dropdown-menu"
const FOLGA = 4   // respiro entre o menu e o bordo da janela

let menuSolto = null

function prender() {
    if (!menuSolto) return
    const estilo = menuSolto.style
    estilo.position = estilo.top = estilo.left = ""
    estilo.right = estilo.bottom = estilo.margin = ""
    estilo.maxHeight = estilo.overflowY = ""
    menuSolto = null
}

function soltar() {
    prender()

    const menu = document.querySelector(MENU_ABERTO)
    if (!menu) return

    // o clientWidth/Height da raiz é a janela sem as barras de scroll, que é
    // onde o menu tem mesmo de caber
    const raiz = document.documentElement
    const caixa = menu.getBoundingClientRect()
    const botao = (menu.parentElement.querySelector(".dropdown-toggle") || menu.parentElement)
        .getBoundingClientRect()

    const abaixo = raiz.clientHeight - FOLGA - caixa.top
    const acima = botao.top - FOLGA
    // o respiro que o CSS põe entre o botão e o menu, para o repetir do outro lado
    const respiro = caixa.top - botao.bottom

    // um menu mais alto do que a janela ficaria sempre com o resto inalcançável:
    // encolhe e rola por dentro
    const altura = Math.min(caixa.height, raiz.clientHeight - 2 * FOLGA)

    const topo = altura > abaixo && acima > abaixo
        ? botao.top - respiro - altura
        : caixa.top

    menu.style.position = "fixed"
    menu.style.top = Math.max(FOLGA, Math.min(topo, raiz.clientHeight - FOLGA - altura)) + "px"
    menu.style.left = Math.max(FOLGA, Math.min(caixa.left, raiz.clientWidth - FOLGA - caixa.width)) + "px"
    menu.style.right = "auto"
    menu.style.bottom = "auto"
    // o top/left medido já conta com a margem que o afastava do botão; deixá-la
    // aqui somava-a outra vez
    menu.style.margin = "0"

    if (altura < caixa.height) {
        const estilo = getComputedStyle(menu)
        // o max-height mede a caixa de conteúdo, salvo em border-box: descontar
        // o que as bordas e o padding acrescentam à altura medida
        const moldura = estilo.boxSizing === "border-box" ? 0
            : caixa.height - menu.clientHeight
              + parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)
        menu.style.maxHeight = (altura - moldura) + "px"
        menu.style.overflowY = "auto"
    }

    menuSolto = menu
}

function fecharMenuSolto() {
    if (!menuSolto) return
    const dropdown = menuSolto.parentElement
    prender()
    if (dropdown) dropdown.classList.remove("open")
}

function vigiarMenus() {
    // o Bootstrap abre e fecha o dropdown num listener dele no document; ler o
    // estado já fora do ciclo do evento evita depender da ordem dos listeners
    document.addEventListener("click", () => setTimeout(soltar, 0))
    // o Esc também o fecha
    document.addEventListener("keyup", () => { if (menuSolto) setTimeout(soltar, 0) })

    // solto, o menu já não acompanha a grelha nem a página: mais vale fechá-lo
    // do que deixá-lo encostado a uma linha que já não é a dele
    window.addEventListener("scroll", fecharMenuSolto, true)
    window.addEventListener("resize", fecharMenuSolto)
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
    vigiarMenus()
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar)
} else {
    arrancar()
}
