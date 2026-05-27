export const router_tools = [
    {
        type: 'function',
        name: 'mediaAgent',
        description: 'Calls the MediaAgent to perform given tasks related to spotify',
        parameters: {
            type: 'object',
            properties:{
                message: 
                    {
                    type: 'string',
                    description: 'Here you write what tasks the MediaAgent should perform, be specific'
                    }
            }
        },
        additionalProperties: false,
        required: ["message"]
    },
    {
        type: 'function',
        name: 'googleAgent',
        description: 'Calls the GoogleAgent to perform given tasks related to google services (calendar and mail)',
        parameters: {
            type: 'object',
            properties:{
                message: 
                {
                    type: 'string',
                    description: 'Here you write what tasks the GoogleAgent should perform, be specific'
                }
            }
        },
        additionalProperties: false,
        required: ["message"]
    },
    {
        type: 'function',
        name: 'getDailyBriefPrompt',
        description: 'Return all of the data needed to create a daily brief, after receiving this data, create a concise and informative brief for the user. This tool should be used only upon request',
        parameters: {},
        additionalProperties: false,
        required: []
    },
    {
        type: 'function',
        name: 'clearSession',
        description: 'Only use this tool if the user asks you to do so or if there is a clear change of the topic of the conversation. It clears the current conversation so it should only be used when really necessary',
        parameters: {},
        additionalProperties: false,
        required: []
    },
    {
        type: 'function',
        name: 'getCurrentDateTime',
        description: 'Gets the current date and time in ISO format.',
        parameters: {},
        additionalProperties: false,
        required: []
    }
];

export const media_tools = [
    {
        type: 'function',
        name: 'play',
        description: 'Plays the given song on spotify, if no song is provided, it will resume the current playback.',
        parameters: {
            type: 'object',
            properties: {
                query: 
                    {
                    type: 'string',
                    description: 'The name of the song, album or artist to play. If not provided, it will resume the current playback.'
                    },
                type: 
                    {
                    type: 'string',
                    enum: ['track', 'album', 'artist'],
                    description: 'The type of the query parameter. Defaults to track if not provided.'
                    }
            }
        },
        additionalProperties: false,
        required: [
            "query"
        ]
    },
    {
        type: 'function',
        name: 'pause',
        description: 'Pauses the current playback.'
    },
    {
        type: 'function',
        name: 'skip',
        description: 'Skips to the next or previous song.',
        parameters: {
            type: 'object',
            properties:{
                type: 
                {
                    type: 'string',
                    enum: ['forward', 'back'],
                    description: 'The direction to skip. forward for next song, back for previous song. Default to forward if not provided.'
                }
            }
        },
        additionalProperties: false,
        required: []
    },
    {
        type: 'function',
        name: 'addtoQueue',
        description: 'Adds the given song to the queue.',
        parameters: {
            type: 'object',
            properties: {
                query: 
                {
                    type: 'string',
                    description: 'The name of the song to add to the queue.'
                }
            }
        },
        additionalProperties: false,
        required: ["query"]
    },
    {
        type: 'function',
        name: 'toggleShuffle',
        description: 'Toggles the shuffle mode.',
        parameters: {
            type: 'object',
            properties: {
                state: 
                {
                    type: 'boolean',
                    description: 'The state to set the shuffle mode to.'
                }
            }
        },
        additionalProperties: false,
        required: ["state"]
    },
    {
        type: 'function',
        name: 'search',
        description: 'Searches for the given query on spotify and returns the results.',
        parameters: {
            type: 'object',
            properties: {
                query: 
                {
                    type: 'string',
                    description: 'The search query.'
                },
                type: 
                {
                    type: 'string',
                    enum: ['track', 'album', 'artist'],
                    description: 'The type of the search results. Defaults to track if not provided.'
                },
                limit: 
                {
                    type: 'number',
                    description: 'The maximum number of results to return. Defaults to 5 if not provided. Maximum is 50.'
                }
            }
        },
        additionalProperties: false,
        required: ["query"]
    }
];

export const google_tools = [
    {
        type: 'function',
        name: 'getCalendarEvents',
        description: 'Gets events from specified calendar. If startDate is not provided, it will return events starting from current date. If dayAmount is not provided, it will default to 1 day.',
        parameters: {
            type: 'object',
            properties: {
                calendarType: 
                {
                    type: 'string',
                    enum: ['primary', 'shared', 'all'],
                    description: 'The calendar to get events from'
                },
                startDate: 
                {
                    type: 'string',
                    description: 'The date to start getting the events from in ISO format (YYYY-MM-DD). if asked for todays events, ignore.'
                },
                dayAmount: 
                {
                    type: 'number',
                    description: 'The number of days to get events for. If not provided, it will default to 1 day.'
                }
            }
        },
        additionalProperties: false,
        required: ["calendarType"]
    },
    {
        type: 'function',
        name: 'createCalendarEvent',
        description: 'Creates a calendar event in specified calendar.',
        parameters: {
            type: 'object',
            properties: {
                calendarType: 
                {
                    type: 'string',
                    enum: ['private', 'shared'],
                    description: 'The calendar to create event in'
                },
                title: 
                {
                    type: 'string',
                    description: 'The title of the event'
                },
                start: 
                {
                    type: 'string',
                    description: 'The start date and time of the event in ISO format (YYYY-MM-DDTHH:mm:ss).'
                },
                fullDay: 
                {
                    type: 'boolean',
                    description: 'Whether the event is a full day event. If true, the time part of start parameter will be ignored.'
                },
                duration: 
                {
                    type: 'number',
                    description: 'The duration of the event. If fullDay is true, the duration will be in days. If fullDay is false, the duration will be in minutes.'
                }
            }
        },
        additionalProperties: false,
        required: [
            "calendarType",
            "title",
            "start",
            "fullDay",
            "duration"
        ]
    },
    {
        type: 'function',
        name: 'deleteCalendarEvent',
        description: 'Deletes a calendar event with specified id.',
        parameters: {
            type: 'object',
            properties: {
                id: 
                {
                    type: 'string',
                    description: 'The id of the event to delete'
                }
            }
        },
        additionalProperties: false,
        required: ["id"]
    },
    {
        type: 'function',
        name: 'getMail',
        description: 'Gets specified amount of latest mails. It returns id, from and subject of each mail.',
        parameters: {
            type: 'object',
            properties: {
                quantity: 
                {
                    type: 'number',
                    description: 'The amount of latest mails to get. If not provided, it will default to 10.'
                }
            }
        },
        additionalProperties: false,
        required: []
    },
    {
        type: 'function',
        name: 'getFullMail',
        description: 'Gets full content of the mail with specified id.',
        parameters: {
            type: 'object',
            properties: {
                id: 
                {
                    type: 'string',
                    description: 'The id of the mail to get'
                }
            }
        },
        additionalProperties: false,
        required: ["id"]
    },
    {
        type: 'function',
        name: 'createMailDraft',
        description: 'Creates a mail draft with specified to, subject and message.',
        parameters: {
            type: 'object',
            properties: 
            {
                to: {
                    type: 'string',
                    description: 'The recipient of the mail'
                },
                subject: 
                {
                    type: 'string',
                    description: 'The subject of the mail'
                },
                message: 
                {
                    type: 'string',
                    description: 'The content of the mail'
                }
            }
        },
        additionalProperties: false,
        required: [
            "to",
            "subject",
            "message"
        ]
    },
    {
        type: 'function',
        name: 'sendMailDraft',
        description: 'Sends the mail draft with specified id.',
        parameters: {
            type: 'object',
            properties: {
                id: 
                {
                    type: 'string',
                    description: 'The id of the draft to send'
                }
            }
        },
        additionalProperties: false,
        required: ["id"]
    },
    {
        type: 'function',
        name: 'getCurrentDateTime',
        description: 'Gets the current date and time in ISO format.',
        parameters: {},
        additionalProperties: false,
        required: []
    }
];

export const room_tools= [];