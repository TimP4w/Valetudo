const {EventEmitter} = require("events");

class ValetudoEventStore {
    /**
     *
     * @param {object} options
     */
    constructor(options) {
        /** @private */
        this.eventEmitter = new EventEmitter();

        this.events = new Map();
    }

    /**
     *
     * @param {import("./valetudo_events/ValetudoEventHandlerFactory")} factory
     */
    setEventHandlerFactory(factory) {
        this.eventHandlerFactory = factory;
    }

    /**
     * @public
     *
     * @param {string} id
     * @returns {import("./valetudo_events/events/ValetudoEvent")}
     */
    getById(id) {
        // noinspection JSValidateTypes
        return this.events.get(id);
    }

    /**
     * @public
     * @returns {Array<import("./valetudo_events/events/ValetudoEvent")>}
     */
    getAll() {
        // noinspection JSValidateTypes
        return Array.from(this.events.values());
    }

    /**
     * @public
     * @param {import("./valetudo_events/events/ValetudoEvent")} event
     */
    raise(event) {
        if (!this.events.has(event.id)) {
            if (this.events.size >= LIMIT) {
                this.events.delete(this.events.keys().next()?.value);
            }
        }

        this.events.set(event.id, event);
        this.eventEmitter.emit(EVENT_RAISED, event);
    }

    /**
     * @param {*} listener
     * @public
     */
    onEventRaised(listener) {
        this.eventEmitter.on(EVENT_RAISED, listener);
    }

    /**
     * @param {import("./valetudo_events/events/ValetudoEvent")} event
     * @param {import("./valetudo_events/handlers/ValetudoEventHandler").INTERACTIONS} interaction
     */
    async interact(event, interaction) {
        if (!this.eventHandlerFactory) {
            throw new Error("Missing Event handler Factory");
        }

        if (event.processed === true) {
            throw new Error("Event is already processed");
        }

        const handler = this.eventHandlerFactory.getHandlerForEvent(event);

        if (handler) {
            const result = await handler.interact(interaction);

            if (result === true) {
                event.processed = true;
            }

            //Even though this isn't required as we're interfacing with it by reference. Just for good measure
            this.events.set(event.id, event);
        } else {
            throw new Error("Missing Handler for Event: " + event.__class);
        }
    }

}

const LIMIT = 50;
const EVENT_RAISED = "event_raised";

module.exports = ValetudoEventStore;