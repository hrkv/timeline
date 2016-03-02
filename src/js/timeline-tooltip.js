
module.exports = (function () {

    var TimelineTooltip = function (settings) {

        this.paper = settings.paper;
        this.label = this.paper.text(0, 0, settings.text);
        this.label.attr(settings.textSyle);
        this.box = this.paper.rect();
        this.group = this.paper.g(this.label, this.box);
        this.group.attr({ visibility: "hidden" });
    };

    TimelineTooltip.prototype.hide = function () {

        this.group.attr({ visibility: "hidden" });
    };

    TimelineTooltip.prototype.show = function () {

        this.group.attr({ visibility: "visible" });
    };

    TimelineTooltip.prototype.setPosition = function (x, y) {

        this.group.attr({
            transform: "translate(" + x + ", " + y + ")"
        });
    };

    TimelineTooltip.prototype.setText = function (text) {

        this.label.attr({ text: text });
    };

    return TimelineTooltip;

})();