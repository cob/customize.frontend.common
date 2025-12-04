cob.custom.customize.push(async function(core, utils, ui) {

    const regex = /\$definitions/

    core.customizeAllInstances(async (instance, presenter) => {
        const definitionsSelectContainer = await loadDefinitions()
            .then(definitions => definitions.map(def => `<option value="${def.name}">${def.name}</option>`).join(""))
            .then(options => $(`<div><select class="js-select-definition"><option></option>${options}</select></div>`))

        presenter.findFieldPs(fp => regex.test(fp.field.fieldDefinition.description))
            .forEach(fp => {
                const $fieldTable = fp.content().find("> table.instance\\.service\\.field");
                const $input = $fieldTable.find(".field-value");

                if ($fieldTable.find(".js-select-definition").length > 0) {
                    return;
                }

                $input.css('display', 'none');
                $input.after(definitionsSelectContainer.html());

                $fieldTable.find(".js-select-definition")
                    .val(fp.getValue())
                    .on('change', function() {
                        $input.val(this.value).trigger('change');
                    });
            })
    })

    async function loadDefinitions() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `/recordm/recordm/definitions?included=disabled`,
                method: "GET",
                dataType: "json",
                xhrFields: {withCredentials: true},
                cache: false,
                ignoreErrors: true,
                complete: (jqXHR, textStatus) => resolve(jqXHR.responseJSON)
            })
        })
    }
})