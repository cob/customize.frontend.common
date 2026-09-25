//--------------- Instâncias abertas por referência: cada caixa com a sua barra ---------------
// Cada instância aberta por referência traz os seus próprios botões, num
// cabeçalho colado ao topo da própria caixa.
//
// Os detalhes abertos formam uma ÁRVORE: do mesmo registo podem sair dois
// irmãos (um Contrato e um Projecto, de references diferentes), cada um com
// filhos seus. Por isso os Cancel/Save não podem viver num "nível activo" —
// teriam de escolher entre irmãos, e a ordem do DOM não é a ordem de abertura.
//
// A coluna lateral das aninhadas é escondida por CSS (ver _global.css).
cob.custom.customize.push(function (core, utils, ui) {

    const NIVEL_MAX = 4          // a partir daqui repete-se a última cor
    let temporizador = null

    core.customizeAllInstances(function () {
        construir()
        const raiz = document.querySelector("div.instance-container")
        if (raiz && !raiz.dataset.cobCabObs) {
            raiz.dataset.cobCabObs = "1"
            new MutationObserver(agendar).observe(raiz, { childList: true, subtree: true })
        }
        if (!window.cobCabResize) {
            window.cobCabResize = true
            window.addEventListener("resize", agendar)
        }
    })

    function agendar() {
        // curto: o cabeçalho tem de aparecer ao mesmo tempo que a caixa, senão
        // vê-se o conteúdo a saltar
        clearTimeout(temporizador)
        temporizador = setTimeout(construir, 30)
    }

    // O elemento pertence a esta instância e não a uma aninhada lá dentro, nem a
    // um cabeçalho nosso (que leva clones do que estes selectores apanham).
    function proprio(seccao, selector) {
        return [...seccao.querySelectorAll(selector)]
            .find(el => el.closest(".instance-detail-container") === seccao && !el.closest(".cob-cabecalho")) || null
    }

    function nomeDe(seccao) {
        const el = proprio(seccao, ".definition-name")
        return el ? el.textContent.trim() : ""
    }

    function idDe(seccao) {
        const linha = proprio(seccao, ".js-single-instance")
        const m = linha && linha.textContent.match(/\d+/)
        return m ? m[0] : ""
    }

    function profundidade(seccao) {
        let n = 0
        for (let p = seccao.parentElement; p; p = p.parentElement) {
            if (p.classList && p.classList.contains("instance-detail-container")) n++
        }
        return n
    }

    function botoesDe(seccao) {
        const nav = proprio(seccao, ".sidenav")
        if (!nav) return []
        return [...nav.querySelectorAll("button")].filter(b => !b.closest(".cob-cabecalho"))
    }

    // O clone mantém as classes, de que dependem os ícones do produto. O clique
    // é travado no próprio evento para não chegar aos handlers delegados, que
    // agiriam sobre o registo errado, e é reencaminhado para o botão original.
    function clonar(original) {
        const copia = original.cloneNode(true)
        copia.removeAttribute("id")
        copia.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"))
        copia.classList.add("cob-cab-copia")
        return copia
    }

    function reencaminhar(copia, original) {
        copia.addEventListener("click", ev => {
            ev.preventDefault()
            ev.stopImmediatePropagation()
            ev.stopPropagation()
            original.click()
        }, true)
    }

    function construir() {
        const seccoes = [...document.querySelectorAll(".instance-detail-container")]
        if (!seccoes.length) return

        const topo = seccoes[0]
        seccoes.forEach(seccao => {
            if (seccao !== topo) garantirCabecalho(seccao)   // o de topo fica com a goteira
        })
        // só depois de todos montados: a medição precisa do layout final
        medirBarraDeTopo()
        posicionarColados()
        document.querySelectorAll(".cob-cabecalho").forEach(ajustarLargura)
    }

    // Onde cada elemento colado se fixa: a base (o que o menu e a barra do
    // registo ocupam) mais a altura de tudo o que cola e o contém.
    //
    // Medido e não fixo em constantes: há instâncias sem $group nenhum, os
    // cabeçalhos de grupo não têm todos a mesma altura, e uma caixa pode estar
    // dentro de dois grupos ou de nenhum.
    function posicionarColados() {
        const topo = document.querySelector(".instance-detail-container")
        if (!topo) return
        const barra = proprio(topo, ".sidenav")
        const barraColada = barra && getComputedStyle(barra).position === "sticky"
        const base = barraColada
            ? parseFloat(getComputedStyle(barra).top || 0) + barra.getBoundingClientRect().height
            : 0

        // cada elemento colado com o pedaço de árvore a que manda
        const colados = []
        document.querySelectorAll("li.cob-grupo > table").forEach(tab => {
            if (getComputedStyle(tab).position === "sticky") colados.push({ el: tab, ambito: tab.parentElement })
        })
        document.querySelectorAll(".cob-cabecalho").forEach(cab => {
            if (getComputedStyle(cab).position === "sticky") colados.push({ el: cab, ambito: cab.parentElement })
        })

        colados.forEach(({ el, ambito }) => {
            let desvio = base
            colados.forEach(outro => {
                if (outro.el !== el && outro.ambito !== ambito && outro.ambito.contains(el)) {
                    desvio += outro.el.getBoundingClientRect().height
                }
            })
            const novo = Math.round(desvio) + "px"
            if (el.style.top !== novo) el.style.top = novo
        })
    }

    // Abaixo dos 1175px a coluna do registo de topo vira barra colada (ver
    // _global.css) e os cabeçalhos das aninhadas colam por baixo dela. A altura
    // depende do que lá couber.
    function medirBarraDeTopo() {
        const topo = document.querySelector(".instance-detail-container")
        const nav = topo && proprio(topo, ".sidenav")
        const colada = nav && getComputedStyle(nav).position === "sticky"
        const altura = colada ? Math.round(nav.getBoundingClientRect().height) : 0
        document.documentElement.style.setProperty("--cob-barra-h", altura + "px")
    }

    // Quando a linha não dá para tudo, os atalhos COLLAPSE/EXPAND ficam só com o
    // ícone. Medido em vez de @media porque o que aperta é a largura da CAIXA,
    // não a do ecrã: um detalhe ao terceiro nível é estreito mesmo num ecrã
    // largo. Funciona porque os botões são flex:none/nowrap — não podendo
    // encolher nem quebrar por dentro, o que não cabe vê-se no scrollWidth.
    function ajustarLargura(cab) {
        cab.classList.remove("cob-cab-apertado")        // medir com tudo à mostra
        cab.classList.remove("cob-cab-linha-accoes")
        if (cab.scrollWidth > cab.clientWidth + 1) cab.classList.add("cob-cab-apertado")

        // Num cabeçalho que quebra (ver _global.css), quem cede primeiro é o
        // nome, que encolhe até às reticências enquanto os botões se partem em
        // duas filas ao lado dele. Se isso acontecer, os botões levam a linha
        // inteira: cabem quase sempre numa fila só e o nome recupera o espaço.
        const accoes = cab.querySelector(".cob-cab-accoes")
        const botao = accoes && accoes.firstElementChild
        if (botao && accoes.getBoundingClientRect().height > botao.getBoundingClientRect().height + 1) {
            cab.classList.add("cob-cab-linha-accoes")
        }
    }

    // O detalhe é inserido a seguir à grelha de onde foi aberto, o que numa
    // grelha longa cai abaixo do ecrã e faz o clique parecer sem efeito. Só
    // nesse caso se traz a caixa para o topo.
    function mostrar(seccao) {
        // no quadro seguinte: a decisão só precisa do topo da caixa, que existe
        // assim que ela entra no documento e não se mexe depois — o que cresce
        // é o conteúdo por baixo
        requestAnimationFrame(() => {
            if (!seccao.isConnected) return
            const sp = scrollportDe(seccao)
            const rp = sp === document.scrollingElement
                ? { top: 0, bottom: window.innerHeight }
                : sp.getBoundingClientRect()
            const rs = seccao.getBoundingClientRect()
            // já visível: mexer na posição seria mexer onde ninguém pediu
            if (rs.top < rp.bottom) return
            seccao.scrollIntoView({ block: "start", behavior: "smooth" })
        })
    }

    function scrollportDe(el) {
        for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p)
            if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 4) return p
        }
        return document.scrollingElement
    }

    // Reconciliação, não reconstrução: o observador que chama isto vigia o mesmo
    // contentor onde escrevemos, por isso uma passagem sem alterações tem de não
    // mexer no DOM — senão fica um ciclo de 30 em 30ms.
    function garantirCabecalho(seccao) {
        const id = idDe(seccao)
        const nome = nomeDe(seccao)

        let cab = seccao.firstElementChild
        if (!cab || !cab.classList.contains("cob-cabecalho")) cab = null

        if (cab && cab.dataset.cobId === id && cab.dataset.cobNome === nome) {
            sincronizarAccoes(cab, seccao)
            return
        }

        if (cab) cab.remove()
        seccao.insertBefore(criarCabecalho(seccao, id, nome), seccao.firstChild)

        // Uma vez por caixa: quem rola a seguir é o utilizador. A marca fica no
        // elemento e não numa variável daqui, porque esta função é registada em
        // cob.custom.customize e volta a correr a cada instância com um closure
        // novo (é também por isso que o observador e o resize vivem em
        // dataset/window).
        if (!seccao.dataset.cobRolada) {
            seccao.dataset.cobRolada = "1"
            mostrar(seccao)
        }
    }

    function criarCabecalho(seccao, id, nome) {
        const cab = document.createElement("div")
        cab.className = "cob-cabecalho"
        cab.dataset.cobId = id
        cab.dataset.cobNome = nome
        cab.dataset.cobNivel = Math.min(profundidade(seccao), NIVEL_MAX)

        const titulo = document.createElement("span")
        titulo.className = "cob-cab-nome"
        titulo.textContent = nome
        cab.appendChild(titulo)

        // Clonam-se os botões de copiar e não a linha do id: essa é uma .row do
        // Bootstrap com .span4 lá dentro, que fora da coluna lateral se desmancha.
        const idBloco = document.createElement("span")
        idBloco.className = "cob-cab-id"
        if (id) idBloco.appendChild(document.createTextNode("ID: " + id))
        const linhaId = proprio(seccao, ".js-single-instance")
        if (linhaId) {
            linhaId.querySelectorAll(".js-copy-id, .js-copy-link").forEach(original => {
                const copia = clonar(original)
                reencaminhar(copia, original)
                idBloco.appendChild(copia)
            })
        }
        if (idBloco.childNodes.length) cab.appendChild(idBloco)

        const links = document.createElement("div")
        links.className = "cob-cab-links"
        ;[".js-collapse-all", ".js-expand-all"].forEach(sel => {
            const original = proprio(seccao, sel)
            if (!original) return
            const copia = clonar(original)
            reencaminhar(copia, original)
            // numa linha apertada fica só o ícone: o rótulo sobrevive no title
            const texto = copia.textContent.replace(/\s+/g, " ").trim()
            if (texto && !copia.title) copia.title = texto
            links.appendChild(copia)
        })
        if (links.children.length) cab.appendChild(links)

        const accoes = document.createElement("div")
        accoes.className = "cob-cab-accoes"
        cab.appendChild(accoes)

        sincronizarAccoes(cab, seccao)
        return cab
    }

    // Os botões do produto aparecem, desaparecem e mudam de estado ao longo da
    // vida do formulário. A assinatura diz se o CONJUNTO mudou, e só aí se mexe
    // no DOM; o estado é copiado sempre, que é barato e não é uma mutação de
    // childList.
    function sincronizarAccoes(cab, seccao) {
        const accoes = cab.querySelector(".cob-cab-accoes")
        const originais = botoesDe(seccao).filter(b => !b.classList.contains("hidden"))
        const assinatura = originais.map(b => b.className + "|" + b.textContent.trim()).join("~")

        if (accoes.dataset.cobAssinatura !== assinatura) {
            accoes.dataset.cobAssinatura = assinatura
            accoes.innerHTML = ""
            originais.forEach(original => {
                const copia = clonar(original)
                reencaminhar(copia, original)
                copia.cobOriginal = original
                accoes.appendChild(copia)
            })
        }

        ;[...accoes.children].forEach(copia => {
            if (copia.cobOriginal) copia.disabled = copia.cobOriginal.disabled
        })
    }
})
