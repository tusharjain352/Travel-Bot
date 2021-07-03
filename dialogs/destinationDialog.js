// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { WaterfallDialog, ComponentDialog, ChoiceFactory } = require( 'botbuilder-dialogs' );
const { ActivityHandler, MessageFactory, CardFactory } = require( 'botbuilder' );
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require( 'botbuilder-dialogs' );

const { DateResolverDialog } = require( './dateDialog' );

const TEXT_PROMPT = 'TEXT_PROMPT';

const DATETIME_PROMPT = 'DATETIME_PROMPT';

const WATERFALL_DIALOG = 'waterfallDialog';
const DATE_DIALOG = 'dateResolverDialog';

class DestinationResolverDialog extends ComponentDialog
{
    constructor( id )
    {
        super( id || 'destinationResolverDialog' );

        this.addDialog( new TextPrompt( TEXT_PROMPT ) );
        this.addDialog( new DateTimePrompt( DATETIME_PROMPT ) );
        this.addDialog( new DateResolverDialog( DATE_DIALOG ) );

        this.addDialog( new WaterfallDialog( WATERFALL_DIALOG, [
            this.initialStep.bind( this ),
            this.handleDestination.bind( this )
        ] ) );

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initialStep( stepContext )
    {
        console.log( 'destresolver dialog', stepContext.options );

        if ( !global.bookingDetails.destination )
        {
            let promptData = {
                prompt: ChoiceFactory.forChannel( stepContext.context, ['Delhi', 'Mumbai', 'Meerut'], "What's the destination of flight?" ),
                retryPrompt: ChoiceFactory.forChannel( stepContext.context, ['Delhi', 'Mumbai', 'Meerut'], "What's the destination of flight?" )
            };
            return await stepContext.prompt( TEXT_PROMPT, promptData );
        }
        return stepContext.next();
    }

    async handleDestination( step )
    {
        if ( !global.bookingDetails.destination )
        {
            // step.values.destination = step.result;
            global.bookingDetails['destination'] = step.result;
        }
        return await step.beginDialog( DATE_DIALOG, { bookingDetails: global.bookingDetails } );
    }


}

module.exports.DestinationResolverDialog = DestinationResolverDialog;
