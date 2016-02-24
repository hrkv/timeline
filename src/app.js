var Timeline = require('./timeline.js');

document.getElementById("date").textContent = (new Date()).toLocaleDateString();

var from = new Date();
var to = new Date();
from.setHours(9);
to.setHours(12);

new Timeline({
    events: {
        timeChanged: function (data) {
            document.getElementById("date").textContent = data.newValue.toLocaleDateString();
        }
    },
    container: document.querySelector("#container"),
    data: [{
        from: from,
        to: to,
        color: "#F00"
    }]
});