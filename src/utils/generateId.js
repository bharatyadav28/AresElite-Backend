exports.generateClientId = () => {
    let clientId = "";
    const possible = "0123456789";

    for (let i = 0; i < 6; i++) {
        clientId += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return clientId;
};

exports.generateAppointmentId = () => {
    let id = "";
    const possible = "0123456789";

    for (let i = 0; i < 8; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return id;
};

exports.generateEvalId = () => {
    let id = "";
    const possible = "01234A5B6C7D8E9F";

    for (let i = 0; i < 8; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return id;
};