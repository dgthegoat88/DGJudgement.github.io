const ipCache = new Map();

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Failed to get IP:', error);
        throw new Error('Could not verify voter identity');
    }
}

function canVoteAgain(ip) {
    if (!ipCache.has(ip)) return true;

    const lastVoteTime = ipCache.get(ip);
    const hoursSinceLastVote = (Date.now() - lastVoteTime) / (1000 * 60 * 60);

    return hoursSinceLastVote >= 24;
}

function getColorByRating(rating) {

    if (rating <= 5) {
        return parseInt(`FF${Math.floor((rating/5)*255).toString(16).padStart(2, '0')}00`, 16);
    } else {
        return parseInt(`${Math.floor(((10-rating)/5)*255).toString(16).padStart(2, '0')}FF00`, 16);
    }
}

function getCurrentTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'full',
        timeStyle: 'long'
    });
}

async function sendWebhookMessage(name, rating) {
    const webhookUrl = "https://dcwh.my/post?uniqueid=abaf75f1";

    try {

        const userIP = await getClientIP();

        if (!canVoteAgain(userIP)) {
            throw new Error('You can only vote once every 24 hours!');
        }

        const embed = {
            title: "New Judgement Rating:",
            color: getColorByRating(parseInt(rating)),
            fields: [
                {
                    name: "⭐ Rating",
                    value: `${rating}/10`,
                    inline: true
                },
                {
                    name: "👤 Voter",
                    value: name,
                    inline: true
                },
                {
                    name: "🕒 Time",
                    value: getCurrentTime(),
                    inline: false
                }
            ],
            footer: {
                text: ""
            },
            timestamp: new Date().toISOString()
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: ``,
                embeds: [embed]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        ipCache.set(userIP, Date.now());

        return response;
    } catch (error) {
        console.error('Webhook error:', error);
        throw error;
    }
}
