cob.custom.customize.push(function (core, utils, ui) {
    // Keywords to show or hide fields for mobile
    const KEYWORD_SHOW = "$ShowOnMobile"
    const KEYWORD_HIDE = "$HideOnMobile"

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

        if(isMobile()) { // || (isNaked() && isScreenMd()) -> add for destkop debug
            handleFieldVisibility(presenter,fields_show_mobile, fields_without_show_mobile, fields_hide_mobile )

            removeNavbar()

            hideSidenav();

            // Add navbar
            if($("#mobile-navbar").length <= 0) {
                buildNavbar(presenter, instance);
            }
        } else {
            showAllFields(presenter,fields_show_mobile, fields_without_show_mobile, fields_hide_mobile )
            removeNavbar()
            showSidenavChildren()
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
                if(isMobile()) { // || (isNaked() && isScreenMd()) -> add for destkop debug
                    removeNavbar()
                    hideSidenav();
                    // Add navbar
                    if($("#mobile-navbar").length <= 0) {
                        buildNavbar(presenter, instance);
                    }
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
        $sidenav.children().show();  
    }

    // Helpers to check if we're mobile or naked
    function isNaked() {
        return core.getSettings().mode() === "naked"
    }

    // We use user-agents to check if we're mobile
    function isMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        return isMobileUA
    }

    // Helper function to check current window size
    function isScreenMd() {
        return window.matchMedia("(max-width: 767px)").matches;
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
        <button class="pb-[3px] rounded-l-full w-4/12 content-center  !text-sm !text-white  
        pt-1 bg-slate-400 hover:bg-slate-300">
          <i class="fa-solid fa-chevron-left"></i> <div class="text-xs">${backText}</div>
        </button>`)

        let $saveBtn = $(`
        <button class="pb-[3px] content-center  !text-sm !text-white  
        pt-1 bg-green-400 hover:bg-green-300">
            <i class="fa-solid fa-floppy-disk"></i> <div class="text-xs">${saveText}</div>
        </button>
        `)

        let $saveEditBtn = $(`
        <button class="pb-[3px] content-center  !text-sm !text-white  
        pt-1 bg-green-500 hover:bg-green-400">
            <i class="fa-solid fa-floppy-disk"></i> <div class="text-xs">${saveEditText}</div>
        </button>
        `)

        let $saveNewBtn = $(`
        <button class="pb-[3px] content-center  !text-sm !text-white  
        pt-1 bg-green-600 hover:bg-green-500">
            <i class="fa-solid fa-floppy-disk"></i> 
            <div class="text-xs">${saveNewText}</div> 
        </button>
        `)


        // OTHER Buttons HTML
        let $ellipsisBtn = $(`
        <button id="ellipsis-navbar-btn" class="rounded-r-full pb-[3px] w-4/12 content-center 
        flex items-center justify-center  !text-base !text-white  
        pt-1 bg-slate-500">
          <i class="fa-solid fa-ellipsis"></i>
        </button>`)

        let $expandBtn = $(`
        <button id="ellipsis-expand" class="py-2 w-full px-2 rounded-t-xl bg-slate-700 flex-col items-center justify-center"> 
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


        $saveBtn.click(function (e) {
            e.preventDefault();
            presenter.saveInstance(() => {
                core.navigateBack();
            });
        });


        $saveEditBtn.click(function (e) {
            e.preventDefault();
            presenter.saveInstance(() => { });
        });


        $saveNewBtn.click(function (e) {
            e.preventDefault();
            presenter.saveInstance(() => {
                core.navigateTo(`/instance/create/${instance.data.jsonDefinition.id}`);
            });
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
        <div id="ellipsis-menu" class=" py-2 rounded-full fixed flex flex-col items-center bottom-20
        transition-all ease-in-out scale-y-0 opacity-0">
        </div>
        `

        /******** Insert main navbar holder ********/ 
        $sidenav.append(`
        <div id="mobile-navbar" class="w-full flex flex-col  justify-center items-center fixed bottom-6 z-50 pr-10" >
            <div id="inner-mobile-navbar" class="h-fit ${navbarWidth} rounded-full flex justify-evenly">
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
            $saveBtn.toggleClass("rounded-b-xl")
            $saveBtn.toggleClass("w-full")
        } else {
            // If save edit exists but save new does not exist
            if (saveEditExists) {
                $("#inner-mobile-navbar").append($saveEditBtn)
                $saveEditBtn.toggleClass("w-6/12")

                prepareEllipsisMenuBaseButtons()

                $("#ellipsis-menu").append($saveBtn)
                $saveBtn.toggleClass("rounded-b-xl")
                $saveBtn.toggleClass("w-full")
            } else {
                // only the default save is enabled
                $("#inner-mobile-navbar").append($saveBtn)
                $saveBtn.toggleClass("w-6/12")

                prepareEllipsisMenuBaseButtons()

                if (can_show_hidden) { $showHiddenBtn.toggleClass("rounded-b-xl") }
                // else bottommost button is collapseAll
                else {$collapseBtn.toggleClass("rounded-b-xl")}
                
            }
        }
    }

})
