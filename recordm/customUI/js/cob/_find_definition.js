cob.custom.customize.push(async function(core, utils, ui) {

    const definitionsRegex = /\$definitions/
    const definitionIdRegex = /\$definitionId/

    core.customizeAllInstances(async (instance, presenter) => {
        const definitions = await loadDefinitions()
        const options = definitions.map(def => `<option value="${def.name}" data-id="${def.id}">${def.name}</option>`).join("")
        
        presenter.findFieldPs(fp => definitionsRegex.test(fp.field.fieldDefinition.description))
            .forEach(fp => {
                const $fieldTable = fp.content().find("> table.instance\\.service\\.field")
                const $input = $fieldTable.find(".field-value")

                if ($fieldTable.find(".js-select-definition").length > 0) {
                    return
                }

                $input.css('display', 'none')
                $input.after(`<select class="js-select-definition"><option></option>${options}</select>`)

                const parentContent = fp.content()
                
                const allDefinitionIdFields = presenter.findFieldPs(childFp => 
                    definitionIdRegex.test(childFp.field.fieldDefinition.description)
                )

                const childFieldP = allDefinitionIdFields.find(childFp => {
                    const childContentId = childFp.content().attr('id')
                    return parentContent.find(`#${childContentId}`).length > 0
                })

                const $select = $fieldTable.find(".js-select-definition")
                
                $select.val(fp.getValue())

                $select.on('change', function() {
                    const selectedName = this.value
                    const selectedId = $(this).find(':selected').data('id')
                    
                    $input.val(selectedName).trigger('change')
                    
                    if (childFieldP) {
                        const $childFieldInput = childFieldP.content().find("> table.instance\\.service\\.field .field-value")
                        $childFieldInput.val(selectedId).trigger('change')
                    }
                })
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