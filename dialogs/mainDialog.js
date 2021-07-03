// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { HotelBookingDialog } = require('./hotelBookingDialog');
const { FlightBookingDialog } = require('./flightBookingDialog');


const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const HOTEL_BOOKING_DIALOG = 'hotelBookingDialog';
const FLIGHT_BOOKING_DIALOG = 'bookingDialog';


class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, bookingDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!bookingDialog) throw new Error('[MainDialog]: Missing parameter \'bookingDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new HotelBookingDialog(HOTEL_BOOKING_DIALOG))
            .addDialog(new FlightBookingDialog(FLIGHT_BOOKING_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.initialStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }


    /**
     * First step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async initialStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }
        const bookingDetails = {};

        // if (!this.luisRecognizer.isConfigured) {
        //     // LUIS is not configured, we just run the BookingDialog path.
        //     return await stepContext.beginDialog('bookingDialog', bookingDetails);
        // }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        console.log('luisResult',LuisRecognizer.topIntent(luisResult))
        switch (LuisRecognizer.topIntent(luisResult)) {
            case 'book_flight': {
                const entities = this.luisRecognizer.getFromEntities(luisResult);

                // Initialize BookingDetails with any entities we may have found in the response.
                bookingDetails.destination = entities.flightDestination;
                bookingDetails.origin = entities.flightOrigin;
                bookingDetails.travelDate = this.luisRecognizer.getTravelDate(luisResult);
                global.bookingDetails = bookingDetails;
                // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
                return await stepContext.beginDialog('bookingDialog', bookingDetails);
            }

            case 'book_hotel': {
                bookingDetails.destination = null;
                bookingDetails.origin = null;
                bookingDetails.travelDate = null;
                global.bookingDetails = bookingDetails;
                return await stepContext.beginDialog(HOTEL_BOOKING_DIALOG, { bookingDetails });
            }

            case 'cancel': {
                const cancelMessageText = 'Booking canceled';
                await stepContext.context.sendActivity(cancelMessageText, cancelMessageText, InputHints.IgnoringInput);
                return await stepContext.cancelAllDialogs();
            }

            default: {
                // Catch all for unhandled intents
                const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way- Book a flight/room`;
                return await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
            }
        }
    }

}

module.exports.MainDialog = MainDialog;
