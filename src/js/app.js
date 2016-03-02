(function () {
    var timeline = require('./timeline-main.js'),
        tagManager = require('./tag-manager.js'),
        utils = require('./utils.js'),
        app = {
            timeline: new timeline({
                events: {
                    timeChanged: function (data) {
                        document.getElementById("date").textContent = data.newValue.toLocaleDateString();
                    }
                },
                container: document.querySelector("#container")
            }),
            tagManager: new tagManager({
                container: document.querySelector('.wrapper')
            })
        };

    document.getElementById("date").textContent = (new Date()).toLocaleDateString();
    window.addEventListener("resize", utils.debounce(function () {
        app.timeline.setSize();
        app.timeline.draw();
    }, 100));
})();
