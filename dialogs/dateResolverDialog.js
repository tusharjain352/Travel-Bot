// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


const { DateTimePrompt, WaterfallDialog, ChoiceFactory } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');


const DATETIME_PROMPT = 'datetimePrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class DateResolverDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'dateResolverDialog');
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getDate.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async getDate(stepContext) {
        if (global.bookingDetails == undefined || !global.bookingDetails.travelDate) {
            let promptData = {
                prompt: ChoiceFactory.forChannel(stepContext.context, ['Today', 'Tomorrow'], "For when you want to book Room? Quick Suggestions:"),
                retryPrompt: ChoiceFactory.forChannel(stepContext.context, ['Today', 'Tomorrow'], "For when you want to book Room? Quick Suggestions:")
            };

            return await stepContext.prompt(DATETIME_PROMPT, promptData);
        }
        return stepContext.next();
    }
}

module.exports.DateResolverDialog = DateResolverDialog;
