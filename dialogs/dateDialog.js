// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { WaterfallDialog, ComponentDialog, ChoiceFactory } = require('botbuilder-dialogs');
const { ActivityHandler, MessageFactory, CardFactory } = require('botbuilder');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';

const WATERFALL_DIALOG = 'waterfallDialog2';
const DEST_DIALOG = 'destinationResolverDialog';

class DateResolverDialog extends ComponentDialog {
    constructor(id) {
        super(id || 'dateResolverDialog');


        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));
       
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.getDate.bind(this),
            this.getClass.bind(this),
            this.handleUserChoice.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async getDate(step) {

        if (!global.bookingDetails.travelDate) {
            let promptData = {
                prompt: ChoiceFactory.forChannel(step.context, ['Today', 'Tomorrow'], "For when you want to book flight? Quick Suggestions:"),
                retryPrompt: ChoiceFactory.forChannel(step.context, ['Today', 'Tomorrow'], "For when you want to book flight? Quick Suggestions:")
            };

            return await step.prompt(DATETIME_PROMPT, promptData);
        }
        return step.next();
    }

    async getClass(step) {
        if (step.result.length > 0) {
            const dateStatus = await this.checkTodayDate(step.result[0].value);
            if (dateStatus) {
                const noSlotMessage = `No flights are available for today. Quick Suggestions`;
                return await step.prompt(CHOICE_PROMPT, noSlotMessage, ['Change Date', 'Change Destination', 'Start Over']);
            } else {
                // step.values.date = step.result
                global.bookingDetails['travelDate'] = step.result;
                return await step.prompt(CHOICE_PROMPT, 'Which class you want to travel?', ['Economy', 'Business', 'Change Destination', 'Start Over']);
            }
        }
    }

    async handleUserChoice(step) {
        if (step.result && step.result.value) {
            const stepVal = step.result.value;
            switch (stepVal) {
                case 'Change Date': {
                    return await step.replaceDialog(this.initialDialogId, { bookingDetails:global.bookingDetails });
                }
                case 'Change Destination': {
                    global.bookingDetails.destination = null;
                    global.bookingDetails.travelDate = null;
                    return await step.replaceDialog(DEST_DIALOG, { bookingDetails:global.bookingDetails });
                }
                case 'Start Over': {
                    // endDialog = true;
                    // await step.cancelAllDialogs();

                    return await step.replaceDialog(WELCOME_DIALOG, { bookingDetails });
                }
                case 'Economy':
                case 'Business': {
                    // step.values.flightClass = stepVal;
                    global.bookingDetails.flightClass = step.result;
                    
                    return await step.prompt(CONFIRM_PROMPT, 'Do you want to select seat?', ['yes', 'no'], { bookingDetails:global.bookingDetails });
                }

                default: {
                    return step.next();
                }

            }
        }

    }

    async checkTodayDate(val) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = yyyy + '-' + mm + '-' + dd;

        return val === today;
    }

}

module.exports.DateResolverDialog = DateResolverDialog;
