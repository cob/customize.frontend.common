cob.custom.customize.push(async function(core, utils, ui) {

    const keyword_defId = '$auto_definitionId'
    const keyword_defName = '$definitions'

    const getExtension = (fp, extension) => fp.field.fieldDefinition.configuration.extensions[extension]

    core.customizeAllInstances( function(instance, presenter) {

        loadDefinitions().then(definitions => {

            const options = definitions.map(def => `<option value="${def.name}" data-id="${def.id}">${def.name}</option>`).join("")
            const fieldsToInject_id = presenter.findFieldPs( fp => getExtension(fp, keyword_defId))

            if(fieldsToInject_id.length > 0){

                //for each field with $auto_definitionId keyword
                fieldsToInject_id.forEach( async fieldToInject => {

                    fieldToInject.disable() //prevent user from changing it manually

                    //get the argument of the keyword - field with the name of the definition
                    const extension = getExtension(fieldToInject, keyword_defId)
                    const field_name = extension && extension.args ? extension.args[0] : ""

                    if(field_name){

                        //wait for the select to be in the DOM (it is created in the $definitions keyword)
                        waitForElement(`.js-select-definition[data-field-name="${field_name}"]`, (select) => {

                            const initialOption = select.selectedOptions[0]
                            const initialId = initialOption?.dataset.id
                            fieldToInject.setValue(initialId)
                            
                            select.addEventListener("change", (e) => {
                                const id = e.target.selectedOptions[0]?.dataset.id
                                fieldToInject.setValue(id)
                            })

                        })
                    }
                })
            }


            const fieldsToInject_name = presenter.findFieldPs( fp => getExtension(fp, keyword_defName))

            if(fieldsToInject_name.length > 0){

                //for each field with $definitions keyword
                fieldsToInject_name.forEach( async fieldToInject_name => {

                    const $fieldTable = fieldToInject_name.content().find("> table.instance\\.service\\.field")
                    const $input = $fieldTable.find(".field-value")

                    //if select doesn't exist yet, create it
                    if ($fieldTable.find(`.js-select-definition[data-field-name="${fieldToInject_name.field.fieldDefinition.name}"]`).length == 0) {

                        $input.css('display', 'none')
                        $input.after(`<select class="js-select-definition" data-field-name="${fieldToInject_name.field.fieldDefinition.name}"><option></option>${options}</select>`)

                        const $select = $fieldTable.find(".js-select-definition")

                        $select.val(fieldToInject_name.getValue())

                        $select.on('change', function() {
                            const selectedName = this.value
                            const selectedId = $(this).find(':selected').data('id')
                            
                            $input.val(selectedName).trigger('change')
                        })
                    }
                })
            }
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

    function waitForElement(selector, callback) {
        const el = document.querySelector(selector)
        if (el) return callback(el)

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector)
            if (el) {
                observer.disconnect()
                callback(el)
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    }
})