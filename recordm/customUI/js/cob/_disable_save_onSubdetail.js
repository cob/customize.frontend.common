//--------------- Desativar "save button" da sidebar quando esta definição é aberta in-line ---------------------
cob.custom.customize.push(function(core, utils, ui) {
    core.customizeAllInstances(function(instance, presenter) {
        var mo = new MutationObserver(function(e) {
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

        });
        if(document.querySelector('div.instance-container')) {
            mo.observe(document.querySelector('div.instance-container'), {childList: true, subtree: true});
        } 
    })
})