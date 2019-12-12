var devGlobals = {
    stripe: {
        secretKey: '',
        publishableKey: '',
        clientId: '',
        siteUrl: '', 
        authorizeUrl: '', 
        tokenUrl: '' 
    },
    smtpTransport: {
        service: 'SendGrid',
        auth: {
            user: '',
            pass: ''
        }
    },
    bugsnag: {
        apiKey: ''
    },
    analytics: {
        apiKey: ''
    }
};

var productionGlobals = {
    stripe: {
        secretKey: '',
        publishableKey: '',
        clientId: '',
        siteUrl: '',
        authorizeUrl: '',
        tokenUrl: ''
    },
    smtpTransport: {
        service: 'SendGrid',
        auth: {
            user: '',
            pass: ''
        }
    },
    bugsnag: {
        apiKey: ''
    },
    analytics: {
        apiKey: ''
    }
};

if (process.env.NODE_ENV === 'production') {
    module.exports = productionGlobals;
} else {
    module.exports = devGlobals;
}