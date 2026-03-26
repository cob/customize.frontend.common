cob.custom.customize.push(async function(core, utils, ui) {

    const keywordDefinitionId = '$auto_definitionId'
    const keywordDefinitions = '$definitions'

    const getExtension = (fp, extension) => fp.field.fieldDefinition.configuration.extensions[extension]

    const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "";

    core.customizeAllInstances( function(instance, presenter) {

        const fieldsToInjectId = presenter.findFieldPs( fp => getExtension(fp, keywordDefinitionId))

        if(fieldsToInjectId.length > 0){

            //for each field with $auto_definitionId keyword
            fieldsToInjectId.forEach( async fieldToInject => {

                fieldToInject.disable() //prevent user from changing it manually

                //get the argument of the keyword - field with the name of the definition
                const extension = getExtension(fieldToInject, keywordDefinitionId)
                const fieldName = extension && extension.args ? extension.args[0] : ""

                if(fieldName){

                    //wait for the select to be in the DOM (it is created in the $definitions keyword)
                    waitForElement(`.js-select-definition[data-field-name="${fieldName}"]`, (select) => {

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

        const fieldsToInjectName = presenter.findFieldPs( fp => getExtension(fp, keywordDefinitions))

        if(fieldsToInjectName.length > 0){

            loadDefinitions().then(definitions => {
                let options = ""  //depends on the argument of the keyword

                //for each field with $definitions keyword
                fieldsToInjectName.forEach( async fieldToInjectName => {

                    //get the argument of the keyword - field with the name of the definition
                    const extension = getExtension(fieldToInjectName, keywordDefinitions)
                    const definitionSearchQuery = extension && extension.args ? extension.args[0] : ""

                    if (definitionSearchQuery) { // if given use argument to search definitions, if not get all
                        options = definitions.filter(def => 
                            normalize(def.name).includes(normalize(definitionSearchQuery)) || 
                            normalize(def.description).includes(normalize(definitionSearchQuery))
                        ).map(def => `<option value="${def.name}" data-id="${def.id}">${def.name}</option>`).join("");
                    } else {
                        options = definitions.map(def => `<option value="${def.name}" data-id="${def.id}">${def.name}</option>`).join("")
                    }

                    const $fieldTable = fieldToInjectName.content().find("> table.instance\\.service\\.field")
                    const $input = $fieldTable.find(".field-value")

                    //if select doesn't exist yet, create it
                    if ($fieldTable.find(`.js-select-definition[data-field-name="${fieldToInjectName.field.fieldDefinition.name}"]`).length == 0) {

                        $input.css('display', 'none')
                        $input.after(`<select class="js-select-definition" data-field-name="${fieldToInjectName.field.fieldDefinition.name}"><option></option>${options}</select>`)

                        const $select = $fieldTable.find(".js-select-definition")

                        $select.val(fieldToInjectName.getValue())

                        $select.on('change', function() {
                            const selectedName = this.value
                            
                            $input.val(selectedName).trigger('change')
                        })
                    }
                })
            })
        }
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