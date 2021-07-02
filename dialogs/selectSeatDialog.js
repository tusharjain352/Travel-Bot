// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder');
const { WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const FlightSeatCard = require('../bots/resources/FlightSeatCard.json')
const DATETIME_PROMPT = 'datetimePrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const TEXT_PROMPT = 'textPrompt';


class SelectSeatDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'selectSeatDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initialStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initialStep(stepContext) {
       console.log('global objject', global.bookingDetails);

        const bookingObject = global.bookingDetails;
        await stepContext.context.sendActivity({
            text: `Awesome, Please select your seat for flight from ${bookingObject.origin} to ${bookingObject.destination} for ${bookingObject.flightClass.value}`,
            attachments: [CardFactory.adaptiveCard(FlightSeatCard)]

        });
        // This is essentially a "re prompt" of the data we were given up front.
        return await stepContext.prompt(TEXT_PROMPT, { prompt: '' });

    }

    async finalStep(stepContext) {
        const seatNumber = stepContext.result.toUpperCase();
        const isValidSeatNumber = seatNumber.match(/\b(A|B|C|)[0-6]{1}\b/);
        if (!isValidSeatNumber && seatNumber.length !== 2) {
            console.log('isvalid seat', isValidSeatNumber);
            return await stepContext.replaceDialog(this.initialDialogId, { bookingDetails:global.bookingDetails });
        }
        global.bookingDetails.seatNumber = seatNumber
        return await stepContext.next(stepContext.options);
    }

}

module.exports.SelectSeatDialog = SelectSeatDialog;
