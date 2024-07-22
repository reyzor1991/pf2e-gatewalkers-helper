const moduleName = "pf2e-gatewalkers-helper";

const strainedMetabolism = "Compendium.pf2e-gatewalkers-helper.effects.Item.tcgU03ee0rJbxBgS";
const energeticMeltdown = "Compendium.pf2e.feat-effects.Item.0AD7BiKjT8a6Uh92";
const encroachingPresence = "Compendium.pf2e.feat-effects.Item.cqgbTZCvqaSvtQdz";

const deviantState = {
    canUse: true,
    stage: 1,
    backlash: 1,
};

function increaseStage(obj) {
    if (obj.stage === 4) {return}
    obj.stage += 1;
};

function increaseBacklash(obj) {
    if (obj.backlash === 3) {
        obj.canUse = false;
    } else {
        obj.stage = 1;
        obj.backlash += 1;
    }
};

async function rollDeviationCheck(stage) {
    const checkRoll = await new Roll('1d20').roll();

    const dc = stage * 5;
    const isSuccess = checkRoll.result >= dc;
    const color = isSuccess ? 'blue' : 'red';
    const text = isSuccess ? 'Success' : 'Failure';
    const content = `<div>
        Deviation Check DC is <b>${dc}</b>.
    </div>
    <div class="dice-roll">
        <div class="dice-result" style="background: ${color};">
            <h4 class="dice-total flat-check">${checkRoll.result} - ${text}</h4>
        </div>
    </div>`

    await ChatMessage.create({
        content: content,
    });

    return isSuccess
};

function hasEffectBySourceId(actor, eff) {
    return actor?.itemTypes?.effect?.find((c => eff === c.sourceId))
}

async function handleState(actor, effect) {
    const curState = actor.getFlag(moduleName, "deviantState") ?? deviantState;
    if (!curState.canUse) {
        ui.notifications.info(`${actor.name} used up all the deviant attempts`);
        return;
    }

    const isSuccess = await rollDeviationCheck(curState.stage)
    if (isSuccess) {
        increaseStage(curState);
    } else {
        handleEffect(actor, effect, curState.backlash)
        increaseBacklash(curState);
        if (!curState.canUse) {
            ui.notifications.info(`${actor.name} can't use deviant feature today`);
        }
    }

    await actor.setFlag(moduleName, "deviantState", curState);
}

async function boneSpikes(actor) {
    handleState(actor, strainedMetabolism)
}

async function blastingBeams(actor) {
    handleState(actor, energeticMeltdown)
}

async function consumeEnergy(actor) {
    handleState(actor, energeticMeltdown)
}

async function ghostlyGrasp(actor) {
    handleState(actor, encroachingPresence)
}

async function eerieFlicker(actor) {
    handleState(actor, encroachingPresence)
}

async function handleEffect(actor, uuid, backlash) {
    if (!uuid) {return}
    const curEffect = hasEffectBySourceId(actor, uuid);
    if (curEffect) {
        await curEffect.delete()
    }
    const eff = (await fromUuid(uuid)).toObject()
    eff.system.badge.value = backlash;
    await actor.createEmbeddedDocuments("Item", [eff]);
}

Hooks.on('preCreateChatMessage', async (message, user, _options, userId)=>{
    const mType = message?.flags?.pf2e?.context?.type;
    if (message.isReroll) { return }

    if (mType === 'attack-roll' && message.actor?.flags?.pf2e?.rollOptions?.['damage']?.['titan-swing']) {
        handleState(message.actor, strainedMetabolism)
    } else if (Object.keys(message.flags.pf2e).length === 1 && message.content.includes('Awakening')) {
        if (message.item.slug === "ghostly-grasp-deviant") {
            ghostlyGrasp(message.actor)
        } else if (message.item.slug === "blasting-beams") {
            blastingBeams(message.actor)
        } else if (message.item.slug === "bone-spikes") {
            boneSpikes(message.actor)
        } else if (message.item.slug === "consume-energy") {
            consumeEnergy(message.actor)
        } else if (message.item.slug === "eerie-flicker") {
            eerieFlicker(message.actor)
        } else if (message.item?.traits?.has('deviant') && message.item.slug != "titan-swing") {
            handleState(message.actor, undefined)
        }
    }
});
Hooks.on('pf2e.restForTheNight', async (actor) => {
    await actor.setFlag(moduleName, "deviantState", deviantState);

    const energeticMeltdownEff = hasEffectBySourceId(actor, energeticMeltdown);
    const encroachingPresenceEff = hasEffectBySourceId(actor, encroachingPresence);
    const strainedMetabolismEff = hasEffectBySourceId(actor, strainedMetabolism);
    if (energeticMeltdownEff) {
        energeticMeltdownEff.delete()
    }
    if (encroachingPresenceEff) {
        encroachingPresenceEff.delete()
    }
    if (strainedMetabolismEff) {
        strainedMetabolismEff.delete()
    }

});

Hooks.on('getActorSheetHeaderButtons', getActorSheetHeaderButtons);

function getActorSheetHeaderButtons(app, buttons) {
    if (!game.user.isGM) {return;}
    if ("character" != app?.actor?.type) {return;}

    const state = app.actor.getFlag(moduleName, "deviantState") ?? deviantState;
    const actorUuid = app.actor.uuid;

    buttons.unshift({
        label: "Gatewalker Stages",
        icon: "fas fa-torii-gate",
        class: moduleName,
        onclick: () => {
            (new Gate({state, actorUuid}, async (actorUuid, state) => {
                await (await fromUuid(actorUuid)).setFlag(moduleName, "deviantState", state);
            })).render(true);
        }
    });
}


console.log("PF2e Gatewalkers Helper | Initialized");