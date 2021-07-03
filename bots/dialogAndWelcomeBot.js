// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { DialogBot } = require( './dialogBot' );
const { MessageFactory } = require( 'botbuilder' );

class DialogAndWelcomeBot extends DialogBot
{
    constructor( conversationState, userState, dialog )
    {
        super( conversationState, userState, dialog );

        this.onMembersAdded( async ( context, next ) =>
        {
            await this.sendWelcomeMessage( context )
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        } );

        this.onMessage( async ( context, next ) =>
        {
            //console.log('on messaged called', context.activity);
            if ( context.activity && context.activity.text === 'Start_Over' )
            {
                await this.sendSuggestedActions( context )

            } else
            {
                // Run the Dialog with the new message Activity.
                await this.dialog.run( context, this.dialogState );
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();

        } );
    }
    async sendWelcomeMessage( turnContext )
    {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for ( const idx in activity.membersAdded )
        {
            if ( activity.membersAdded[idx].id !== activity.recipient.id )
            {
                await this.sendSuggestedActions( turnContext );
            }
        }
    }

    async sendSuggestedActions( turnContext )
    {
        //console.log('sugegsted called>>>>>>>>>>>>>>>>>-----------------');
        var reply = MessageFactory.suggestedActions( ['Book a flight', 'Book a room'], `Hi,I am your travel planner, you can ask me to book your flight and hotel rooms ${ String.fromCodePoint( 0x1F642 ) }` );
        await turnContext.sendActivity( reply );
    }

}

module.exports.DialogAndWelcomeBot = DialogAndWelcomeBot;
