cob.custom.customize.push(function (core, utils, ui) {
    // Keywords to show or hide fields for mobile
    const KEYWORD_SHOW = "$ShowOnMobile"
    const KEYWORD_HIDE = "$HideOnMobile"

    // A true, as grelhas de referências viram cartões tocáveis. A false, fica a
    // grelha, legível por ter um mínimo de largura por coluna (ver _grelhas.js).
    const GRELHAS_EM_CARTOES = false

    //--------------- Mobile support ---------------------
    core.customizeAllInstances( function (instance, presenter) {
        // We do this to avoid searching for the exact same fields
        // when reapplying the customization
        let found_fields = getRelevantFields(presenter)
        /*
            0 - fields with $ShowOnMobile
            1 - fields WITHOUT $ShowOnMobile (we will want to hide them)
            2 - fields with $HideOnMobile
        */
        applyMobileCustomizations(presenter,instance,
            found_fields[0], found_fields[1], found_fields[2]
        );

        // Reapply changes on resize
        window.addEventListener('resize', function() {
            applyMobileCustomizations(presenter, instance,
                found_fields[0], found_fields[1], found_fields[2]
            );
        });
        
        // Make sure to apply some visual changes on duplicate
        reapplyOnDuplicate(presenter)
    })

    function applyMobileCustomizations(presenter, instance, 
        fields_show_mobile, fields_without_show_mobile, fields_hide_mobile){

        if(isMobile() && isScreenMd()) { // || (isNaked() && isScreenMd()) -> add for destkop debug
            // marca o modo mobile no <html>: o CSS precisa de o distinguir de uma
            // janela de desktop estreita, onde a letra deve manter-se pequena
            document.documentElement.classList.add("cob-mobile")
            handleFieldVisibility(presenter,fields_show_mobile, fields_without_show_mobile, fields_hide_mobile )

            // A coluna lateral vira barra colada, igual à das outras larguras
            // (ver _global.css). Com o Save e o Cancel dentro da barra de cada
            // instância, uma aninhada pode ser gravada em mobile.
            removeNavbar()
            $("#mobile-context").remove()
            showSidenavChildren()
            if (GRELHAS_EM_CARTOES) cardifyReferenceGrids()
            arrumarGrupos()
            arrumarReferencias()
        } else {
            document.documentElement.classList.remove("cob-mobile")
            showAllFields(presenter,fields_show_mobile, fields_without_show_mobile, fields_hide_mobile )
            removeNavbar()
            showSidenavChildren()
            undoMobileExtras()
            // Os $group são marcados em qualquer largura, porque o cabeçalho
            // colado vale em todas (ver _global.css); o aspecto é que é regido
            // por largura, no _mobile.css.
            arrumarGrupos()
            // Modo compacto (janela estreita num desktop): não é mobile, mas a
            // linha do $ref tem o mesmo problema de espaço — o DETAILS continua
            // ao lado da lupa para o campo aproveitar a largura toda.
            if (isScreenMd()) {
                arrumarReferencias()
            }
        }
    }

    // Retrieve relevant fields we want to operate on (hide or show)
    function getRelevantFields(presenter) {
        // Code to optimize field showing/hiding
        let fields_show_mobile = [] //fields with ShowOnMobile
        let fields_without_show_keyword = [] //fields without ShowOnMobile to hide
        let fields_hide_mobile = [] //fields with HideOnMobile

        const rm_hidden_keyword = "$style[hide]"

        // Get fields with $ShowOnMobile
        presenter.findFieldPs(f => {
            // We ignore fields with both $ShowOnMobile and $style[hide] because the latter takes precedence
            // (we always want to hide fields with $style[hide])
            let field_desc = f.field.fieldDefinition.description
            if ( field_desc && !field_desc.includes(rm_hidden_keyword)) {
                if (KEYWORD_SHOW in f.field.fieldDefinition.configuration.extensions) {
                    fields_show_mobile.push(f)
                } else {
                    fields_without_show_keyword.push(f)
                }
            }
        })

        // Get fields with $HideOnMobile 
        fields_hide_mobile = presenter.findFieldPs(f =>
            (KEYWORD_HIDE in f.field.fieldDefinition.configuration.extensions))

        return [fields_show_mobile, fields_without_show_keyword, fields_hide_mobile]
    }

    // Update customization on duplication
    function reapplyOnDuplicate(presenter, instance ){
        const duplicateButtons = document.querySelectorAll('span.duplicate-button');

        duplicateButtons.forEach(button => {
            button.addEventListener('click', () => {
                if(isMobile() && isScreenMd()) { // || (isNaked() && isScreenMd()) -> add for destkop debug
                    // as acções vivem na barra de cada instância
                    removeNavbar()
                }
            });
        });
    }

    // Expand all 
    function expandAll() {
        var a = document.getElementsByClassName("js-expand-all")
        if(a.length > 0) {
            a[0].click()
        }
    }

    // Collapse all 
    function collapseAll() {
        var a = document.getElementsByClassName("js-collapse-all")
        if(a.length > 0) {
            a[0].click()
        }
    }

    // Remove navbar
    function removeNavbar() {
        if($("#mobile-navbar").length > 0) {
            $("#mobile-navbar").remove()
        }
    }

    // Make sure all fields are visible
    function showAllFields(presenter, fields_show_mobile, fields_without_show_mobile, fields_hide_mobile) {
        // we found $ShowOnMobile, meaning we will ignore $HideOnMobile
        if (fields_show_mobile.length > 0) {
            // Make sure marked fields are visible
            for(const line of fields_show_mobile){
                const element = line.content()
                element.removeClass("custom-hide")
            }

            // Show unmarked fields
            for(const line of fields_without_show_mobile){
                const element = line.content()
                element.removeClass("custom-hide")
            }
        } else {
            // Show fields
            for(const line of fields_hide_mobile){
                const element = line.content()
                element.removeClass("custom-hide")
            }
        }
    }

    // Hide target fields and make sure marked ones are also visible
    function handleFieldVisibility(presenter, fields_show_mobile, fields_without_show_mobile, fields_hide_mobile) {
        // Then we found $ShowOnMobile, meaning we will ignore $HideOnMobile
        if (fields_show_mobile.length > 0) {
            // Make sure marked fields are visible
            for(const line of fields_show_mobile){
                const element = line.content()
                element.removeClass("custom-hide")
            }

            // Hide unmarked fields
            for(const line of fields_without_show_mobile){
                const element = line.content()
                element.addClass("custom-hide")
            }
        } else {
            // Hide fields
            for(const line of fields_hide_mobile){
                const element = line.content()
                element.addClass("custom-hide")
            }
        }
    }   

    // Hide sidenav
    function hideSidenav() {
        const $sidenav = $(".sidenav");
        $sidenav.children().hide();    
    }

    // Show sidenav children
    function showSidenavChildren() {
        const $sidenav = $(".sidenav");
        // .css("display", "") e não .show(): o .show() grava display:block
        // inline, que ganha à folha de estilo e impediria o CSS de arrumar a
        // coluna quando ela vira barra (ver _global.css).
        $sidenav.children().css("display", "");
    }

    // Helpers to check if we're mobile or naked
    function isNaked() {
        return core.getSettings().mode() === "naked"
    }

    // We use user-agents to check if we're mobile
    function isMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        return isMobileUA || isForcedMobile() || ecraMuitoEstreito()
    }

    // Abaixo de 480px não há espaço para o layout de rato, venha o pedido de onde
    // vier: uma janela de desktop assim estreita é, para efeitos de layout, um
    // telemóvel. Entre 480 e 949px manda o modo compacto (ver _nested_instances.js).
    function ecraMuitoEstreito() {
        return window.matchMedia("(max-width: 479px)").matches
    }

    // ?mobile=1 força o modo mobile (fica na sessão); ?mobile=0 desliga.
    // Serve para testar num browser de secretária com a janela estreita.
    const FORCE_MOBILE_KEY = "cobForceMobile"
    function isForcedMobile() {
        try {
            const url = (window.location.search || "") + (window.location.hash || "")
            if (/[?&]mobile=1/.test(url)) sessionStorage.setItem(FORCE_MOBILE_KEY, "1")
            if (/[?&]mobile=0/.test(url)) sessionStorage.removeItem(FORCE_MOBILE_KEY)
            return sessionStorage.getItem(FORCE_MOBILE_KEY) === "1"
        } catch (e) { return false }
    }

    // Helper function to check current window size
    function isScreenMd() {
        return window.matchMedia("(max-width: 949px)").matches;
    }

    // Hide dropdown buttons
    function hideToggleButtons() {
        // Select all span elements with the class "toggle-button label"
        const toggleButtons = document.querySelectorAll('span.toggle-button.label');
    
        toggleButtons.forEach(function(button) {
            button.classList.add('hidden');
        });
    }


    function buildNavbar(presenter, instance) {
        // State for show hidden
        let showing = false

        // Taken from _show_hidden.js to show hidden button
        const urlParams = new URLSearchParams(window.location.search);
        const dev = urlParams.get('dev') || (core.getGroups() || []).includes("System");
        let can_show_hidden = (dev == true || dev == "true")  
        && (   $(".custom-hide").size() 
            || $(".custom-hide-in-edit").size()
            || $(".custom-hide-in-group-edit").size() 
            || $(".custom-hide-in-new-instance").size() 
        )

        // Select the parent element with the class "sidenav"
        const $sidenav = $(".sidenav");

        // Select all child elements inside the parent element and hide them
        $sidenav.children().hide();

        // Retrieve recordmui save buttons
        let saveBtn = $(".js-save-instance") // ALWAYS exists
        let saveEditBtn = $(".js-save-edit-instance")
        let saveNewBtn = $(".js-save-create-new-instance")

        // Aux booleans for readability
        let saveEditExists = saveEditBtn.length > 0
        let saveNewExists = saveNewBtn.length > 0
        let navbarWidth = "w-10/12"

        // Get buttons text (they are already localized)
        let backText = $(".js-back").find('span').text()
        let saveText = saveBtn.find('span').text()
        let saveEditText = saveEditExists ? saveEditBtn.find('span').text() : ""
        let saveNewText = saveNewExists ? saveNewBtn.find('span').text() : ""

        // SAVE Buttons HTML
        let $backBtn = $(`
        <button class="pb-[3px] rounded-l-md w-4/12 content-center  !text-sm !text-white  
        pt-1 bg-slate-400 hover:bg-slate-300">
          <i class="fa-solid fa-chevron-left"></i> <div class="text-xs">${backText}</div>
        </button>`)

        let $saveBtn = $(`
        <button class="js-save-instance pb-[3px] content-center  !text-sm !text-white  
        pt-1 bg-green-400 hover:bg-green-300">
            <i class="fa-solid fa-floppy-disk"></i> <div class="text-xs">${saveText}</div>
        </button>
        `)

        let $saveEditBtn = $(`
        <button class="js-save-edit-instance pb-[3px] content-center !text-sm !text-white  
        pt-1 bg-green-500 hover:bg-green-400">
            <i class="fa-solid fa-floppy-disk"></i> <div class="text-xs">${saveEditText}</div>
        </button>
        `)

        let $saveNewBtn = $(`
        <button class="js-save-create-new-instance pb-[3px] content-center  !text-sm !text-white  
        pt-1 bg-green-600 hover:bg-green-500">
            <i class="fa-solid fa-floppy-disk"></i> 
            <div class="text-xs">${saveNewText}</div> 
        </button>
        `)


        // OTHER Buttons HTML
        let $ellipsisBtn = $(`
        <button id="ellipsis-navbar-btn" class="rounded-r-md pb-[3px] w-4/12 content-center 
        flex items-center justify-center  !text-base !text-white  
        pt-1 bg-slate-500">
          <i class="fa-solid fa-ellipsis"></i>
        </button>`)

        let $expandBtn = $(`
        <button id="ellipsis-expand" class="py-2 w-full px-2 rounded-t-md bg-slate-700 flex-col items-center justify-center"> 
        <i class="fa-solid fa-up-right-and-down-left-from-center  !text-base !text-white  "></i> 
        <div class="text-xs">Expand</div> 
        </button>`)

        let $collapseBtn = $(`
        <button id="ellipsis-collapse" class="pb-2 w-full px-2 bg-slate-600 flex-col items-center justify-center"> 
        <i class="fa-solid fa-down-left-and-up-right-to-center !text-base !text-white"></i>
        <div class="text-xs">Collapse</div> 
        </button>
        `)

        let showHiddenIcon = showing ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"
        let $showHiddenBtn = $(`
        <button id="ellipsis-show-hidden" class="pb-2 w-full px-2 bg-slate-500 flex-col items-center justify-center"> 
        <i class="${showHiddenIcon} !text-base !text-white"></i>
        <div class="text-xs">Show</div> 
        </button>
        `)

        /******** SAVE Button click handlers ********/
        $backBtn.click(function (e) {
            e.preventDefault();
            if($("#mobile-navbar").length > 0) {
                $("#mobile-navbar").remove()
            }
            core.navigateBack();
        });

        /******** OTHER Button click handlers ********/
        $ellipsisBtn.click(function (e) {
            e.preventDefault();
            const hiddenButtons = document.querySelector('#ellipsis-menu');
            hiddenButtons.classList.toggle('scale-y-0');
            hiddenButtons.classList.toggle('opacity-0');
            hiddenButtons.classList.toggle('scale-y-100');
            hiddenButtons.classList.toggle('opacity-100');
        });

        /******** EXPAND Button click handler ********/ 
        $expandBtn.click(function (e) {
            e.preventDefault()
            expandAll()
        });

        /******** COLLAPSE Button click handler ********/ 
        $collapseBtn.click(function (e) {
            e.preventDefault()
            collapseAll()
        });

        /******** SHOW HIDDEN Button click handler ********/ 
        $showHiddenBtn.click(function (e) {
            e.preventDefault()
            if(!showing) {
                document.documentElement.style.setProperty("--dev-display", "block");
            } else {
                document.documentElement.style.setProperty("--dev-display", "");
            }
            showing = !showing
            $("#ellipsis-show-hidden i").toggleClass("fa-eye")
            $("#ellipsis-show-hidden i").toggleClass("fa-eye-slash")
            $("#ellipsis-show-hidden div").text(showing ? "Hide" : "Show")
        });

        // Create Ellipsis Menu container
        let $ellipsisMenu = `
        <div id="ellipsis-menu" class="rounded-md overflow-hidden shadow-xl fixed flex flex-col items-center bottom-20 origin-bottom
        transition-all ease-in-out scale-y-0 opacity-0">
        </div>
        `

        /******** Insert main navbar holder ********/ 
        $sidenav.append(`
        <div id="mobile-navbar" class="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-3 pb-3 pointer-events-none" >
            <div id="inner-mobile-navbar" class="h-fit w-full max-w-sm rounded-md shadow-lg overflow-hidden flex justify-evenly pointer-events-auto">
            </div>
        </div>`)

        // Function to prepare the ellipsis menu basic buttons
        // (that always exists - collapse and expand)
        function prepareEllipsisMenuBaseButtons() {
            // Add elipsis button
            $("#inner-mobile-navbar").append($ellipsisBtn) 
            // Add ellipsis menu to ellipsis button
            $("#ellipsis-navbar-btn").append($ellipsisMenu)
            $("#ellipsis-menu").append($expandBtn)
            $("#ellipsis-menu").append($collapseBtn)
            if ( can_show_hidden ) {
                $("#ellipsis-menu").append($showHiddenBtn)
            }
        }

        /******** Add buttons to navbar holder ********/ 
        /* 
        The logic should be the following: Due to possibly having all the save buttons,
        we prioritize the ones that appear in the navbar as such: SaveNew > SaveEdit > Save.
        
        Using this priority system, we only show the highest-priority save button, and push
        the others to the ellipsis menu if they exist.

        Ideally, I can abstract this logic and build it dynamically.
        E.g: adding the "rounded-b-xl" can be done to the last button to be added.
        The main issue is dealing with the possibilities of the multiple save buttons.

        Save button priorities:
        Save & Create -> Save & Edit -> Save
        */

        // Back button always present
        $("#inner-mobile-navbar").append($backBtn)

        // If save new exists
        if(saveNewExists) {
            // Add save  new to navbar
            $("#inner-mobile-navbar").append($saveNewBtn)
            $saveNewBtn.toggleClass("w-6/12")
            prepareEllipsisMenuBaseButtons()
            if(saveEditExists) {
                $("#ellipsis-menu").append($saveEditBtn)
                $saveEditBtn.toggleClass("w-full")
                $saveEditBtn.toggleClass("pb-2 px-1")
            } 
            $("#ellipsis-menu").append($saveBtn)
            $saveBtn.toggleClass("rounded-b-md")
            $saveBtn.toggleClass("w-full")
        } else {
            // If save edit exists but save new does not exist
            if (saveEditExists) {
                $("#inner-mobile-navbar").append($saveEditBtn)
                $saveEditBtn.toggleClass("w-6/12")

                prepareEllipsisMenuBaseButtons()

                $("#ellipsis-menu").append($saveBtn)
                $saveBtn.toggleClass("rounded-b-md")
                $saveBtn.toggleClass("w-full")
            } else {
                // only the default save is enabled
                $("#inner-mobile-navbar").append($saveBtn)
                $saveBtn.toggleClass("w-6/12")

                prepareEllipsisMenuBaseButtons()

                if (can_show_hidden) { $showHiddenBtn.toggleClass("rounded-b-md") }
                // else bottommost button is collapseAll
                else {$collapseBtn.toggleClass("rounded-b-md")}
                
            }
        }
    }


    /* ==================================================================
       Melhorias de mobile: cabeçalho de contexto, referências em cartões,
       histórico no menu e altura da barra. Tudo reversível em desktop.
       ================================================================== */

    // --- Cabeçalho fixo com definição, id e atalhos de copiar ---------------
    function buildContextHeader(instance) {
        $("#mobile-context").remove()

        const $sidenav = $(".sidenav")
        const definicao = $sidenav.find(".definition-name").first().text().trim()
        const idTexto = ($sidenav.find(".js-single-instance .details").first().find("span").first()
                            .contents().filter(function () { return this.nodeType === 3 }).text() || "")
                            .replace(/\s+/g, " ").trim()

        if (!definicao && !idTexto) return

        const $header = $(`
            <div id="mobile-context">
                <div class="mc-def"></div>
                <div class="mc-right"><span class="mc-id"></span></div>
            </div>`)
        $header.find(".mc-def").text(definicao)
        $header.find(".mc-id").text(idTexto)

        // Os botões de copiar mantêm-se na sidenav (onde têm os handlers);
        // aqui ficam clones que reencaminham o clique.
        $sidenav.find(".js-copy-id, .js-copy-link").each(function () {
            const $original = $(this)
            const $clone = $original.clone().removeClass("btn btn-mini").addClass("mc-btn")
            $clone.on("click", function (e) { e.preventDefault(); $original.trigger("click") })
            $header.find(".mc-right").append($clone)
        })

        // Dentro da secção da instância e não em .cob-app, para morrer com ela
        // ao navegar para fora. Continua position:fixed: a secção é absolute, e
        // absolute não cria bloco de contenção para fixed.
        const $seccao = $(".instance-detail-container").first()
        ;($seccao.length ? $seccao : $(".cob-app")).append($header)
    }

    // --- Grelhas de referências em cartões tocáveis ------------------------
    function cardifyReferenceGrids() {
        // As grelhas de referências são carregadas depois do resto: tenta de novo
        // e fica a observar o contentor para as que aparecerem mais tarde.
        [400, 1200, 2500].forEach(ms => setTimeout(procurarGrelhas, ms))
        const container = document.querySelector(".instance-detail-container")
        if (container && !container.dataset.cobGridObs) {
            container.dataset.cobGridObs = "1"
            new MutationObserver(mutacoes => {
                // ignora o que nós próprios inserimos, senão o observador dispara-se a si mesmo
                const alheias = mutacoes.some(m => !(m.target.closest && m.target.closest(".cob-cards")))
                if (alheias) agendarProcura()
            }).observe(container, { childList: true, subtree: true })
        }
        procurarGrelhas()
    }

    let temporizadorGrelhas = null
    function agendarProcura() {
        clearTimeout(temporizadorGrelhas)
        temporizadorGrelhas = setTimeout(procurarGrelhas, 300)
    }

    function procurarGrelhas() {
        document.querySelectorAll(".instance-detail-container div[class*='slickgrid_']").forEach(grelha => {
            renderCards(grelha)
            if (!grelha.dataset.cobCards) {
                grelha.dataset.cobCards = "1"
                const canvas = grelha.querySelector(".grid-canvas")
                if (canvas) new MutationObserver(() => agendarProcura())
                    .observe(canvas, { childList: true, subtree: true, characterData: true })
            }
        })
    }

    let aRenderizar = false
    function renderCards(grelha) {
        if (!isMobile() || !isScreenMd() || aRenderizar) return
        aRenderizar = true
        try { desenharCartoes(grelha) } finally { aRenderizar = false }
    }

    function desenharCartoes(grelha) {

        const colunas = [...grelha.querySelectorAll(".slick-header-column")]
            .map(c => c.textContent.trim())
        const linhas = [...grelha.querySelectorAll(".grid-canvas .slick-row")]

        let $lista = $(grelha).prev(".cob-cards")
        if (!$lista.length) { $lista = $('<div class="cob-cards"></div>'); $(grelha).before($lista) }

        if (!linhas.length) {
            // a grelha pode estar a meio de um redesenho: só diz "sem registos"
            // se a legenda confirmar que são mesmo zero
            const legenda = $(grelha).closest("li,div").find(".references-legend").first().text() || ""
            const zero = /\(\s*0\s*\)/.test(legenda)
            if (zero || !$lista.data("cheia")) {
                $lista.empty().append('<div class="cob-cards-vazio">Sem registos</div>')
                $lista.data("cheia", false)
            }
            $(grelha).addClass("cob-grid-escondida")
            return
        }

        $lista.empty()
        $lista.data("cheia", true)
        linhas.forEach(linha => {
            const celulas = [...linha.querySelectorAll(".slick-cell")]
            const valores = celulas.map((celula, i) => ({
                nome: colunas[i] || "",
                texto: (celula.innerText || celula.textContent || "").replace(/\s+/g, " ").trim(),
                temLink: !!celula.querySelector("a[href^='#/instance/']"),
                html: celula.innerHTML
            })).filter(v => v.nome && v.texto && !/^actions$/i.test(v.nome))

            // o link do cartão tem de ser o do próprio registo da linha (coluna
            // Actions), não o da primeira referência que a linha mostrar
            const detalhe = linha.querySelector("a.js-show-instance[href*='/instance/']")
                         || linha.querySelector(".slick-cell:last-child a[href*='/instance/']")
                         || linha.querySelector("a[href*='/instance/']")
            const href = detalhe ? detalhe.getAttribute("href") : null

            // o título deve ser o que identifica o registo: nem o id, nem uma data
            const eId = v => /^(id|#)$/i.test(v.nome)
            const eData = v => /date|data/i.test(v.nome) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v.texto)
            const uteis = valores.filter(v => !eId(v) && !eData(v))
            const candidato = uteis.find(v => v.temLink)
                           || uteis.sort((a, b) => b.texto.length - a.texto.length)[0]
                           || valores.find(v => !eId(v))
                           || valores[0]
            if (!candidato) return   // grelha ainda a desenhar: não estraga os cartões que já lá estão

            // um título curto (um estado, um número) identifica mal: nesse caso
            // manda o id para título e o candidato para a linha de baixo
            const valorId = valores.find(eId)
            const titulo = (candidato.texto.length >= 8 || !valorId) ? candidato.texto : valorId.texto
            const meta = valores.filter(v => v.texto !== titulo).slice(0, 4)

            const $cartao = $(`<${href ? "a" : "div"} class="cob-card"${href ? ` href="${href}"` : ""}></${href ? "a" : "div"}>`)
            $cartao.append($('<div class="cob-card-titulo"></div>').text(titulo))
            if (meta.length) {
                const $meta = $('<div class="cob-card-meta"></div>')
                meta.forEach(m => $meta.append($('<span></span>').append($('<b></b>').text(m.nome)).append(document.createTextNode(" " + m.texto))))
                $cartao.append($meta)
            }
            if (href) $cartao.append('<i class="cob-card-seta icon-chevron-right"></i>')
            $lista.append($cartao)
        })

        $(grelha).addClass("cob-grid-escondida")
    }

    // --- Histórico deixa de flutuar por cima da barra ----------------------
    function moveHistoryIntoMenu() {
        const $menu = $("#ellipsis-menu")
        const $historico = $(".js-logs-button").first()
        if ($menu.length && $historico.length && !$menu.find(".js-logs-button").length) {
            $historico.addClass("cob-menu-historico")
            $menu.append($historico)
        }
    }

    // --- A barra diz a sua altura ao CSS, para o conteúdo não ficar tapado --
    function measureNavbar() {
        // mede só a fila de botões: o contentor inclui o menu das reticências,
        // que é fixed e daria uma altura muito maior do que a barra ocupa
        const botoes = [...document.querySelectorAll("#inner-mobile-navbar > button")]
        const altura = botoes.length ? Math.ceil(Math.max(...botoes.map(b => b.getBoundingClientRect().height))) : 0
        document.documentElement.style.setProperty("--cob-navbar-h", (altura + 20) + "px")
    }

    // --- Grupos: seta pequena, nome, contagem e cabeçalho colado -----------
    // Dois casos no produto: o $group (li.field-group, com cabeçalho próprio) e
    // o campo com filhos (li normal com > ol.fields). Marca-se a profundidade —
    // o CSS trata da calha, da cor e do offset do sticky — e conta-se os campos
    // lá dentro.
    const COB_NIVEL_MAX = 5

    function arrumarGrupos() {
        // o produto põe um <ol class="fields"> vazio em todas as linhas; só conta
        // como grupo quem lá tem mesmo campos
        const filhosDe = li => {
            const ol = li.querySelector(":scope > ol.fields")
            if (!ol) return null
            const lis = [...ol.children].filter(c => c.tagName === "LI")
            return lis.length ? { ol, lis } : null
        }
        document.querySelectorAll(".instance-detail-container ol.fields li").forEach(li => {
            const filhos = filhosDe(li)
            const cabecalho = li.querySelector(":scope > table")
            if (!filhos || !cabecalho) return

            const ehGrupo = li.classList.contains("field-group")
            li.classList.add(ehGrupo ? "cob-grupo" : "cob-subcampos")

            // dois contadores: o visual (cor e calha, conta tudo o que tem filhos)
            // e o do sticky (só os $group é que colam, e só esses ocupam 34px)
            let nivel = 0, nivelSticky = 0
            for (let p = li.parentElement; p; p = p.parentElement) {
                if (p.classList && p.classList.contains("instance-detail-container")) break
                if (p.tagName === "LI" && filhosDe(p)) {
                    nivel++
                    if (p.classList.contains("field-group")) nivelSticky++
                }
            }
            li.dataset.nivel = Math.min(nivel, COB_NIVEL_MAX)
            li.style.setProperty("--cob-grupo-nivel", Math.min(nivelSticky, COB_NIVEL_MAX))

            const etiqueta = cabecalho.querySelector(":scope > tbody > tr > td.cob-field-container-label")

            const toggle = cabecalho.querySelector(":scope > tbody > tr > td span.toggle-button")
            if (!toggle) return

            // A seta fica na célula das acções, onde o produto a põe: é o que
            // mantém os ícones todos juntos e o nome do campo a seguir a eles
            // (ver _mobile.css).

            // a linha do cabeçalho inteira abre/fecha, sem roubar o clique a nada
            if (!cabecalho.dataset.cobClicavel) {
                cabecalho.dataset.cobClicavel = "1"
                if (ehGrupo) cabecalho.addEventListener("click", ev => {
                    if (ev.target.closest("input, select, textarea, a, button, label, .toggle-button, .duplicate-button, .remove-button, .drag-handle")) return
                    toggle.click()
                })
            }
        })
    }

    // --- DETAILS ao lado da lupa, em vez de numa linha só dele -------------
    // O link para o registo referenciado vive na célula de descrição, que em
    // mobile cai para baixo do campo. Sobe para a célula do valor, logo a seguir
    // ao botão de pesquisa, que é onde a mão já está.
    let temporizadorRefs = null
    function arrumarReferencias() {
        // as referências chegam depois do resto do formulário, e voltam a nascer
        // sempre que se escolhe outro registo no campo: tenta outra vez e fica a observar
        ;[400, 1200, 2500].forEach(ms => setTimeout(moverLinksDeReferencia, ms))
        const container = document.querySelector(".instance-detail-container")
        if (container && !container.dataset.cobRefObs) {
            container.dataset.cobRefObs = "1"
            new MutationObserver(() => {
                clearTimeout(temporizadorRefs)
                temporizadorRefs = setTimeout(moverLinksDeReferencia, 200)
            }).observe(container, { childList: true, subtree: true })
        }
        moverLinksDeReferencia()
    }

    function moverLinksDeReferencia() {
        document.querySelectorAll(".instance-detail-container td.cob-field-container-description a[href*='/instance/']").forEach(link => {
            const linha = link.closest("tr")
            const valor = linha && linha.querySelector("td.cob-field-container-value")
            if (!valor || valor.contains(link)) return
            // o texto ("Details"/"Detalhes") passa a tooltip: na linha só cabe
            // bem um botão pequeno, e a largura toda faz falta ao campo
            const texto = link.textContent.trim()
            if (texto && !link.title) link.title = texto
            if (texto && !link.getAttribute("aria-label")) link.setAttribute("aria-label", texto)
            link.classList.add("cob-ref-link")
            valor.appendChild(link)
        })
    }

    // --- Desfazer tudo quando se volta a desktop ---------------------------
    function undoMobileExtras() {
        $("#mobile-context").remove()
        $(".cob-app").removeClass("has-mobile-context")
        $(".cob-cards").remove()
        $(".cob-grid-escondida").removeClass("cob-grid-escondida")
        // Numa janela estreita (modo compacto) o DETAILS e os grupos ficam como
        // em mobile — o CSS que os acompanha é regido por largura. Só se desfaz
        // quando há mesmo largura para o layout do produto.
        if (!isScreenMd()) {
            document.querySelectorAll("a.cob-ref-link").forEach(link => {
                const linha = link.closest("tr")
                const descricao = linha && linha.querySelector("td.cob-field-container-description")
                const addons = descricao && descricao.querySelector(".field-addons")
                if (descricao) (addons || descricao).appendChild(link)
                link.classList.remove("cob-ref-link")
            })
        }
        document.documentElement.style.removeProperty("--cob-navbar-h")
    }


})
