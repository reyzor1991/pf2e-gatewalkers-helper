class Gate extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
) {
    constructor(options, callback) {
        super({});
        this.gwstate = options.state;
        this.actorUuid = options.actorUuid;
        this.callback = callback;
    }

    get title() {
        return `Gatewalker Stage Config`;
    }

    async _prepareContext(options) {
        return {
            state: this.gwstate
        };
    }

    static PARTS = {
        form: {
            template: `modules/${moduleName}/templates/form.hbs`,
        },
        footer: {
            template: `modules/${moduleName}/templates/save.hbs`,
            scrollable: [''],
        },
    };


    static DEFAULT_OPTIONS = {
        id: `${moduleName}-configure`,
        tag: "form",
        form: {
            handler: Gate.formHandler,
            closeOnSubmit: true
        },
        actions: {},
        position: {
            height: "auto",
            width: 500
        },
        window: {
            icon: 'fas fa-note-sticky',
            resizable: true
        },
        classes: [moduleName],
    };

    static async formHandler(event, form, formData) {
        let data = formData.object;

        const newState = {
            stage: data.stage <= 0 ? 1 : Math.min(4, data.stage),
            backlash: data.backlash <= 0 ? 1 : Math.min(4, data.backlash),
            canUse: data.canUse
        }
        this.callback.call(this, this.actorUuid, newState)
    }
};