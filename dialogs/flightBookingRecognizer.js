const { LuisRecognizer } = require('botbuilder-ai');

class FlightBookingRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            const recognizerOptions = {
                apiVersion: 'v3'
            };

            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    getFromEntities(result) {
        let flightOrigin, flightDestination;
        if (result.entities.$instance.flightOrigin) {
            flightOrigin = result.entities.$instance.flightOrigin[0].text;
        }
        if (flightOrigin && result.entities.flightDestination[0]) {
            flightDestination = result.entities.flightDestination[0];
        }

        return { flightOrigin, flightDestination };
    }

    // getToEntities(result) {
    //     let flightDestination, flightOrigin;
    //     if (result.entities.$instance.flightDestination) {
    //         flightDestination = result.entities.$instance.flightDestination[0].text;
    //     }
    //     if (flightDestination && result.entities.flightOrigin[0]) {
    //         flightOrigin = result.entities.flightOrigin[0];
    //     }

    //     return { flightDestination, flightOrigin };
    // }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    getTravelDate(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.FlightBookingRecognizer = FlightBookingRecognizer;
