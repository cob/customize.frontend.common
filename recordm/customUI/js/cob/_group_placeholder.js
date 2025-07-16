//Adicionar classe `group-placeholder-unset` a placeholders com campo indefinido
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances(function (instance, presenter) {
        document.querySelectorAll(".group-placeholder").forEach(function(el) {
            if (el.textContent.startsWith("__") && el.textContent.endsWith("__")) {
                el.classList.add("group-placeholder-unset");
            }
        });
    });
});