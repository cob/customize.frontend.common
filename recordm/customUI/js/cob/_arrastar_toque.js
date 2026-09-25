//--------------- Arrastar campos duplicados com o dedo ---------------
// O jQuery UI faz toda a interacção de arrasto no widget ui.mouse, que ouve
// mousedown/mousemove/mouseup. Um ecrã táctil nunca produz essa sequência, por
// isso o draggable dos campos duplicáveis (recordm.view.instance.field.js,
// handle: '.drag-handle') não reage ao dedo.
//
// A ponte é feita no próprio widget: o toque é traduzido no evento de rato
// equivalente e entregue ao mesmo alvo, o que evita duplicar a lógica de
// arrasto do produto. É a técnica do jQuery UI Touch Punch, aqui em vez da
// dependência.

(function ligarToqueAoArrastar($) {
    if (!$ || !$.ui || !$.ui.mouse) return
    const prototipo = $.ui.mouse.prototype
    if (prototipo.cobToqueLigado) return            // o módulo pode ser carregado duas vezes
    prototipo.cobToqueLigado = true

    const iniciarOriginal = prototipo._mouseInit
    const destruirOriginal = prototipo._mouseDestroy

    // um arrasto de cada vez: dois dedos em duas pegas entrelaçariam as
    // sequências que o jQuery UI recebe
    let aArrastar = false

    function traduzir(evento, tipo) {
        // multi-toque é gesto do browser (zoom, scroll), não arrasto
        if (evento.originalEvent.touches.length > 1) return

        // impede o ecrã de rolar por baixo do dedo; só acontece na pega, porque
        // só aqui se chega com o _mouseCapture satisfeito
        evento.preventDefault()

        const toque = evento.originalEvent.changedTouches[0]
        evento.target.dispatchEvent(new MouseEvent(tipo, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            screenX: toque.screenX,
            screenY: toque.screenY,
            clientX: toque.clientX,
            clientY: toque.clientY,
            button: 0,
        }))
    }

    prototipo._cobToqueInicio = function (evento) {
        // o _mouseCapture do widget é quem faz valer o handle: '.drag-handle'
        if (aArrastar || !this._mouseCapture(evento.originalEvent.changedTouches[0])) return
        aArrastar = true
        this.cobToqueMoveu = false
        traduzir(evento, "mouseover")
        traduzir(evento, "mousemove")
        traduzir(evento, "mousedown")
    }

    prototipo._cobToqueMovimento = function (evento) {
        if (!aArrastar) return
        this.cobToqueMoveu = true
        traduzir(evento, "mousemove")
    }

    prototipo._cobToqueFim = function (evento) {
        if (!aArrastar) return
        traduzir(evento, "mouseup")
        traduzir(evento, "mouseout")
        // um toque que não moveu é um clique, e o widget espera vê-lo
        if (!this.cobToqueMoveu) traduzir(evento, "click")
        aArrastar = false
    }

    prototipo._mouseInit = function () {
        this.element.bind({
            touchstart: $.proxy(this, "_cobToqueInicio"),
            touchmove: $.proxy(this, "_cobToqueMovimento"),
            touchend: $.proxy(this, "_cobToqueFim"),
            touchcancel: $.proxy(this, "_cobToqueFim"),
        })
        iniciarOriginal.call(this)
    }

    prototipo._mouseDestroy = function () {
        this.element.unbind({
            touchstart: $.proxy(this, "_cobToqueInicio"),
            touchmove: $.proxy(this, "_cobToqueMovimento"),
            touchend: $.proxy(this, "_cobToqueFim"),
            touchcancel: $.proxy(this, "_cobToqueFim"),
        })
        destruirOriginal.call(this)
    }
})(window.jQuery)
