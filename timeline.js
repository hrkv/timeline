(function(global) {
    
    var Snap = global.Snap;
    
    var Timeline = function (settings) {
        
        if (!settings.container) {
            throw new Error("container is required");
            return null;
        }
        
        this.container = settings.container;
        this.width = settings.width;
        this.height = settings.height;
        this.svg = null;
        this.structure = {};
        this.init(settings);
        this.draw();
    };
    
    Timeline.defaults = {
        line: {
            enabled: true,
            style: {
                stroke: "#777",
                "stroke-width": 5
            }
        },
        arrows: {
            enabled: true,
            style: {
                width: 40,
                height: 40,
                stroke: "#777",
                fill: "none",
                "stroke-width": 5,
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
            }
        },
        ticks: {
            enabled: true,
            style: {
                stroke: "#777",
                "stroke-width": 5,
                "stroke-linecap": "round",
            }
        }
    };
    
    Timeline.prototype.init = function (settings) {
        
        for (var prop in Timeline.defaults) {
            settings[prop] = Object.assign({}, settings[prop], Timeline.defaults[prop]);
            settings[prop].style = Object.assign({}, settings[prop].style, Timeline.defaults[prop].style);
        }
            
        this.setSize();
        this.paper = Snap(this.width, this.height);
        this.structure.line = this.paper.line().attr(settings.line.style);
        this.structure.arrows = {
            data: settings.arrows,
            left: this.paper.polyline().attr(settings.arrows.style),
            right: this.paper.polyline().attr(settings.arrows.style)
        };
        this.structure.ticks = {
            data: settings.ticks,
            ticksGroup: this.paper.rect()
        };
        this._setTickPattern();
        
        this.container.appendChild(this.paper.node);
    };
    
    Timeline.prototype._setTickPattern = function () {
        var patternWidthStep = Math.round(this.width / 48);
        var tickWidth = this.structure.ticks.data.style["stroke-width"];
        var shift = (tickWidth % 2) * 0.5;
        var tickGroup = this.paper.g(
            this.paper.line({
                x1: shift,     y1: 0,
                x2: shift,     y2: 12,
            }).attr(this.structure.ticks.data.style),
            this.paper.line({
                x1: patternWidthStep + shift,     y1: 0,
                x2: patternWidthStep + shift,     y2: 4,
            }).attr(this.structure.ticks.data.style),
            this.paper.line({
                x1: 2 * patternWidthStep + shift,     y1: 0,
                x2: 2 * patternWidthStep + shift,     y2: 8,
            }).attr(this.structure.ticks.data.style),
            this.paper.line({
                x1: 3 * patternWidthStep + shift,     y1: 0,
                x2: 3 * patternWidthStep + shift,     y2: 4,
            }).attr(this.structure.ticks.data.style),
            this.paper.line({
                x1: 4 * patternWidthStep + shift,     y1: 0,
                x2: 4 * patternWidthStep + shift,     y2: 12,
            }).attr(this.structure.ticks.data.style)
        );
        this.structure.ticks.ticksGroup.attr({ fill: tickGroup.toPattern(40, 0, 4 * patternWidthStep, 15) });
    };
    
    Timeline.prototype.setSize = function (width, height) {
        if (width) {
            if (isNaN(width)) {
                throw new TypeError("width is not a number");
                return;
            } else {
                this.width = width;
            }
        } else if (!this.width) {
            this.width = this.container.offsetWidth;
        }
        
        if (height) {
            if (isNaN(height)) {
                throw new TypeError("height is not a number");
                return;
            } else {
                this.height = height;
            }
        } else if (!this.height) {
            this.height = this.container.offsetHeight;
        }
    };
    
    Timeline.prototype.drawLine = function () {
        var arrowsStyle = this.structure.arrows.data.style;
        this.structure.line.attr({
            x1: arrowsStyle.width,       x2: this.width - arrowsStyle.width,
            y1: this.height / 2,    y2: this.height / 2
        });
        this.structure.ticks.ticksGroup.attr({
            x: arrowsStyle.width,       width: this.width - 2 * arrowsStyle.width,
            y: this.height / 2 + 10,    height: 15
        });
    };
    
    Timeline.prototype.drawArrows = function () {
        var arrowsStyle = this.structure.arrows.data.style,
            arrowWidth = arrowsStyle.width,
            arrowHeight = arrowsStyle.height;
        
        this.structure.arrows.left.attr({
            points: [
                [arrowWidth * 0.75, this.height / 2 - arrowHeight * 0.25].join(),
                [arrowWidth * 0.25, this.height / 2].join(),
                [arrowWidth * 0.75, this.height / 2 + arrowHeight * 0.25].join()
            ].join(" ")    
        });
        this.structure.arrows.right.attr({
            points: [
                [this.width - arrowWidth * 0.75, this.height / 2 - arrowHeight * 0.25].join(),
                [this.width - arrowWidth * 0.25, this.height / 2].join(),
                [this.width - arrowWidth * 0.75, this.height / 2 + arrowHeight * 0.25].join()
            ].join(" ")    
        });
    };
    
    Timeline.prototype.draw = function () {
        this.drawLine();
        this.drawArrows();
    }
    
    global.Timeline = Timeline;
})(window);