import { logError } from "../utilities.js";
export class DailyBriefService {
    constructor(googleService) {
        this.googleService = googleService;
        this.lastBriefDate = null;
    }
    ;
    async generateDailyBriefPrompt() {
        try {
            const [date, time] = new Date().toLocaleString().split(', ');
            const unparsedPrivateEvents = await this.googleService.getCalendarEvents("private", undefined, 1);
            const parsedPrivateEvents = this.parseEvents(JSON.parse(unparsedPrivateEvents));
            const unparsedSharedEvents = await this.googleService.getCalendarEvents("shared", undefined, 1);
            const parsedSharedEvents = this.parseEvents(JSON.parse(unparsedSharedEvents));
            const mails = await this.getMailSinceLastBrief();
            this.lastBriefDate = new Date();
            return `
            The current date is ${date} and the time is ${time}.

            private calendar events: ${JSON.stringify(parsedPrivateEvents) ?? 'no events'}.

            shared calendar events: ${JSON.stringify(parsedSharedEvents) ?? 'no events'}.

            Emails received : ${JSON.stringify(mails) ?? 'no emails'}.
            `;
        }
        catch (error) {
            logError(error, "Error in DailyBriefService generateDailyBriefPrompt method, check error_log.txt for details");
            return `there's been an error generating the daily brief prompt, inform the user`;
        }
        ;
    }
    ;
    parseEvents(events) {
        return events.map(event => {
            return {
                title: event.title,
                start: event.start,
                end: event.end,
            };
        });
    }
    ;
    async getMailSinceLastBrief() {
        const mails = [];
        let lastBriefReached = false;
        let appendAll = false;
        const two_days_ms = 2 * 24 * 60 * 60 * 1000;
        while (!lastBriefReached) {
            const mailBatch = await this.googleService.getMail(10);
            if (!mailBatch) {
                return [];
            }
            ;
            //if last brief was more than 2 days ago, return only 10 latest mails
            if (this.lastBriefDate == null || Date.now() - this.lastBriefDate.getTime() > two_days_ms) {
                lastBriefReached = true;
                appendAll = true; // we want to append only 10, so for this loop, we want to append all of the mails
            }
            ;
            for (const mail of mailBatch) {
                if (!mail || !mail.date) {
                    continue;
                }
                ;
                const [date, time] = mail.date.split(', ');
                const [day, month, year] = date.split('/');
                const formattedDate = `${year}-${month}-${day}T${time}`;
                const mailDate = new Date(formattedDate);
                if (appendAll || mailDate >= this.lastBriefDate) { // if the loop reaches this point, lastBriefDate must not be null
                    mails.push(mail);
                }
                else {
                    lastBriefReached = true;
                    break;
                }
                ;
            }
            ;
        }
        ;
        return mails;
    }
    ;
}
;
