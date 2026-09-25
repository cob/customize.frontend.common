//--------------- Desactivar "save button" da sidebar quando esta definição é aberta in-line ---------------------
// Um observer por contentor, com debounce de 100ms: durante o render de uma
// instância grande são milhares de lotes de mutações. Desliga-se quando o
// contentor sai do DOM.
cob.custom.customize.push(function(core, utils, ui) {
    core.customizeAllInstances(function(instance, presenter) {
        const container = document.querySelector('div.instance-container')
        if (!container || container.dataset.cobSaveObs) return
        container.dataset.cobSaveObs = "1"

        let timer = null
        const update = function() {
            timer = null
            if (!container.isConnected) { mo.disconnect(); return }

            //disables top sidebar save button if more than 1 is present
            let saveButtons = document.querySelectorAll(".js-save-instance")
            if (saveButtons.length > 0) {
                saveButtons[0].disabled = saveButtons.length > 1

                let saveEditButtons = document.querySelectorAll(".js-save-edit-instance")
                if (saveEditButtons.length > 0) {
                    let refsHasSaveEdit = (document.querySelectorAll("div.js-references-new-wrapper .js-save-edit-instance").length > 0)
                    saveEditButtons[0].disabled = (saveEditButtons.length > 1 || (saveButtons.length > 1 && !refsHasSaveEdit ))
                }
            }
        }

        const mo = new MutationObserver(function() {
            if (timer === null) timer = setTimeout(update, 100)
        })
        mo.observe(container, {childList: true, subtree: true})
        update()
    })
})
