
const { CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog, ChoicePrompt, ChoiceFactory } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const { HotelBookingDialog } = require('./hotelBookingDialog');
const { SelectSeatDialog } = require('./selectSeatDialog');
const { DestinationResolverDialog } = require('./destinationDialog');
const PaymentInfoCard = require('../bots/resources/PaymentInfoCard.json');
const sleep = require("util").promisify(setTimeout);

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const HOTEL_BOOKING_DIALOG = 'hotelBookingDialog';
const DESTINATION_RESOLVER_DIALOG = 'destinationResolverDialog';
const SELECT_SEAT_DIALOG = 'selectSeatDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';


class FlightBookingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'flightBookingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new HotelBookingDialog(HOTEL_BOOKING_DIALOG))
            .addDialog(new SelectSeatDialog(SELECT_SEAT_DIALOG))
            .addDialog(new DestinationResolverDialog(DESTINATION_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.originStep.bind(this),
                this.handleDestination.bind(this),
                this.confirmUserSeat.bind(this),
                this.doPaymentStep.bind(this),
                this.paymentConfirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
    * If an origin city has not been provided, prompt for one.
    */
    async originStep(stepContext) {
        global.bookingDetails = stepContext.options;
        if (!global.bookingDetails.origin) {
            let promptData = {
                prompt: ChoiceFactory.forChannel(stepContext.context, ['Delhi', 'Mumbai', 'Meerut'], "What is the origin of flight?"),
                retryPrompt: ChoiceFactory.forChannel(stepContext.context, ['Delhi', 'Mumbai', 'Meerut'], "What is the origin of flight?")
            };

            return await stepContext.prompt(TEXT_PROMPT, promptData);
        }
        return await stepContext.next(global.bookingDetails.origin);
    }



    /**
     * If an origin city has not been provided, prompt for one.
     */
    async handleDestination(stepContext) {
        global.bookingDetails.origin = stepContext.result;
        return await stepContext.beginDialog(DESTINATION_RESOLVER_DIALOG, { bookingDetails:global.bookingDetails });
    }


    /**
     * Confirm the information the user has provided.
     */
    async confirmUserSeat(stepContext) {
       
        if (stepContext.result == true) {
            return await stepContext.beginDialog(SELECT_SEAT_DIALOG, { bookingDetails:global.bookingDetails });
        }
        return await stepContext.next(global.bookingDetails);
    }

    async doPaymentStep(stepContext) {
    
        await stepContext.context.sendActivity({
            attachments: [CardFactory.adaptiveCard(PaymentInfoCard)]
        });
        await sleep(1000);
        return stepContext.next();
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async paymentConfirmStep(stepContext) { 
        await sleep(10000);
       
        const msg = `Thank you for your payment,your ticket is booked and your booking id is: ${Math.floor(Math.random() * 10000) + 1} \n Do you want to book hotel room also`
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
        
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        
        global.bookingDetails.flightBookingTime = new Date();
        
        if (stepContext.result === true) {
            return await stepContext.beginDialog(HOTEL_BOOKING_DIALOG, { bookingDetails:global.bookingDetails });
        }
        return await stepContext.endDialog();
    }

}

module.exports.FlightBookingDialog = FlightBookingDialog;
