class Gate extends FormApplication {

    constructor(options, callback) {
        super({});
        this.state = options.state;
        this.actorUuid = options.actorUuid;
        this.callback = callback;
    }

    getData() {
        return foundry.utils.mergeObject(super.getData(), {
            state: this.state
        });
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Gatewalker Stage Config",
            id: `${moduleName}-configure`,
            classes: [moduleName],
            template: "modules/pf2e-gatewalkers-helper/templates/form.hbs",
            width: 500,
            height: "auto",
            closeOnSubmit: true,
            resizable: true,
        });
    }

    async _updateObject(_event, data) {
        const newState = {
            stage: data.stage <= 0 ? 1 : Math.min(4, data.stage),
            backlash: data.backlash <= 0 ? 1 : Math.min(4, data.backlash),
            canUse: data.canUse
        }
        this.callback.call(this, this.actorUuid, newState)
    }
};