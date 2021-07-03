
const { MessageFactory } = require( 'botbuilder' );
const { ConfirmPrompt, TextPrompt, WaterfallDialog, ChoicePrompt, ChoiceFactory } = require( 'botbuilder-dialogs' );
const { CancelAndHelpDialog } = require( './cancelAndHelpDialog' );
const { DateResolverDialog } = require( './dateResolverDialog' );

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const HOTEL_LIST = ['Imperial Hotel', 'Ashok Hotel', 'Hyatt Regency', 'Ronil Royale', 'Rambagh Palace',
    'The Leela Palace', 'ITC Grand Bharat']


class HotelBookingDialog extends CancelAndHelpDialog
{
    constructor( id )
    {
        super( id || 'hotelBookingDialog' );

        this.addDialog( new TextPrompt( TEXT_PROMPT ) )
            .addDialog( new ConfirmPrompt( CONFIRM_PROMPT ) )
            .addDialog( new ChoicePrompt( CHOICE_PROMPT ) )
            .addDialog( new DateResolverDialog( DATE_RESOLVER_DIALOG ) )
            .addDialog( new WaterfallDialog( WATERFALL_DIALOG, [
                this.checkRequestTimeStep.bind( this ),
                this.destinationStep.bind( this ),
                this.travelDateStep.bind( this ),
                this.selectHotelStep.bind( this ),
                this.finalStep.bind( this )
            ] ) );

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
    * Confirm the information the user has provided.
    */
    async checkRequestTimeStep( stepContext )
    {
        if ( global.bookingDetails && global.bookingDetails.flightBookingTime )
        {
            const currentDateTime = new Date();
            const remainingTime = ( currentDateTime.getTime() - global.bookingDetails.flightBookingTime.getTime() ) / 1000;
            if ( remainingTime < 20 )
            {
                const messageText = `Do you want to book room for : ${ global.bookingDetails.destination } ?`;
                const msg = MessageFactory.text( messageText, messageText );

                // Offer a YES/NO prompt.
                return await stepContext.prompt( CONFIRM_PROMPT, { prompt: msg } );
            }
            else
            {
                global.bookingDetails['destination'] = null;
                global.bookingDetails['travelDate'] = null;
                return await stepContext.next( global.bookingDetails );
            }
        }
        else
        {
            return await stepContext.next( stepContext.options );
        }

    }

    /**
     * If a destination city has not been provided, prompt for one.
     */
    async destinationStep( stepContext )
    {

        if ( stepContext.result == false || !global.bookingDetails.destination )
        {
            let promptData = {
                prompt: ChoiceFactory.forChannel( stepContext.context, ['Delhi', 'Mumbai', 'Meerut'], "Please provide destination for Room booking" ),
                retryPrompt: ChoiceFactory.forChannel( stepContext.context, ['Delhi', 'Mumbai', 'Meerut'], "Please provide destination for Room booking" )
            };

            return await stepContext.prompt( TEXT_PROMPT, promptData );
        }

        return await stepContext.next( global.bookingDetails.destination );
    }

    /**
     * If a travel date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
    async travelDateStep( stepContext )
    {

        if ( !global.bookingDetails.destination )
        {
            global.bookingDetails.destination = stepContext.result;
        }

        if ( !global.bookingDetails.travelDate )
        {
            return await stepContext.beginDialog( DATE_RESOLVER_DIALOG, {} );
            // stepContext.next(bookingDetails.travelDate);
        }
        return await stepContext.next( global.bookingDetails.travelDate );
    }

    async selectHotelStep( stepContext )
    {

        // if (!global.bookingDetails.destination) {
        //     bookingDetails.destination = stepContext.result;
        // }
        if ( !global.bookingDetails.travelDate )
        {
            global.bookingDetails.travelDate = stepContext.result;
        }
        const messageText = 'Please select from below available hotels';
        return await stepContext.prompt( CHOICE_PROMPT, messageText, HOTEL_LIST );
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep( stepContext )
    {

        global.bookingDetails.selectedHotel = stepContext.result.value;
        var reply = MessageFactory.text( `${ global.bookingDetails.selectedHotel } room booked for ${ global.bookingDetails.destination } for ${ global.bookingDetails.travelDate[0].value }` );
        await stepContext.context.sendActivity( reply );
        return await stepContext.endDialog( bookingDetails );

    }
}

module.exports.HotelBookingDialog = HotelBookingDialog;
