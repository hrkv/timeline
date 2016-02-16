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
        this.date = settings.date || new Date();
        this.data = settings.data || [];
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
        this.tooltip = new TimelineTooltip({
            paper: this.paper,
            text: "Test text"
        });
        
        this.timelineGroup = this.paper.g(this.structure.line, this.structure.ticks.ticksGroup);
        
        this._bindEvents();
        this.container.appendChild(this.paper.node);
    };
    
    Timeline.prototype._bindEvents = function () {
        this.paper.mousemove(this._onMouseMove.bind(this));
        this.paper.mouseover(this._onMouseOver.bind(this));
        this.paper.mouseout(this._onMouseOut.bind(this));
        this.paper.click(this._onClick.bind(this));
    };
    
    Timeline.prototype._onMouseMove = function (evt) {
        switch (event.target) {
            case this.timelineGroup.node:
                this.tooltip.setPosition(evt.layerX, this.height / 2 + 50);
                break;
        }
    };
    
    Timeline.prototype._onMouseOver = function (evt) {
        switch (event.target) {
            case this.timelineGroup.node:
                this.tooltip.show();
                break;
        }
    };
    
    Timeline.prototype._onMouseOut = function (evt) {
        switch (event.target) {
            case this.timelineGroup.node:
                this.tooltip.hide();
                break;
        }
    };
    
    Timeline.prototype._onClick = function () {
        switch (event.target) {
            case this.structure.arrows.left.node:
                var nextHour = new Date(this.date.toISOString());
                nextHour.setHours(nextHour.getHours() + 1);
                this.setDate(nextHour);
                break;
            case this.structure.arrows.right.node:
                var prevHour = new Date(this.date.toISOString());
                prevHour.setHours(prevHour.getHours() - 1);
                this.setDate(prevHour);
                break;
        }
    };
    
    Timeline.prototype.setDate = function (date) {
        var blocks = this.data,
            pattern = this.structure.ticks.pattern,
            patternWidth = +pattern.attr("width"),
            currentShift = +pattern.attr("x");
            
        Snap.animate(
            currentShift,
            currentShift + Math.round((patternWidth / 60) * (date.getTime() - this.date.getTime()) / 60000),
            function (value) {
                pattern.attr({ x: value });
                for (var i = 0; i < blocks.length; i++) {
                    blocks[i].block.attr({ x: value });
                }
            },
            300
        );
        this.date = date;
    };
    
    Timeline.prototype._setTickPattern = function () {
        var patternWidthStep = Math.round(this._model.line.measures.width / 48);
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
        this.structure.ticks.pattern = tickGroup.toPattern(0, 0, 4 * patternWidthStep, 15);
        this.structure.ticks.pattern.attr({ x: this._model.ticks.attr.x });
        this.structure.ticks.ticksGroup.attr({ fill: this.structure.ticks.pattern });
    };
    
    Timeline.prototype._calcBlocks = function () {
        if (this.data) {
            var pattern = this.structure.ticks.pattern,
                patternWidth = +pattern.attr("width");
                
            for (var i = 0; i < this.data.length; i++) {
                if (!this.data[i].block) {
                    this.data[i].block = this.paper.rect();
                    this.data[i].dirty = true;
                }
                if (this.data[i].dirty) {
                    var timeLength = Math.round((this.data[i].to.getTime() - this.data[i].from.getTime()) / 60000);
                    this.data[i].block.attr({
                        x: this._model.ticks.attr.x + Math.round((patternWidth / 60) * (this.data[i].to.getTime() - this.date.getTime()) / 60000),
                        y: 0,
                        height: 15,
                        width: timeLength * this._model.line.measures.units,
                        fill: this.data[i].color
                    });
                }
            }
        }
    };
    
    Timeline.prototype.setSize = function (width, height) {
        if (width) {
            this.width = width;
        } else if (!this.width) {
            this.width = this.container.offsetWidth;
        }
        
        if (height) {
            this.height = height;
        } else if (!this.height) {
            this.height = this.container.offsetHeight;
        }
    };
    
    Timeline.prototype._calcLine = function () {
        var arrowsStyle = this.structure.arrows.data.style,
            arrowsWidth = arrowsStyle.width || 0;
            
        this._model = this._model || {};
        this._model.line = {
            measures: {
                width: this.width - 2 * arrowsWidth,
                units: (this.width - 2 * arrowsWidth) / 720          // 12 * 60 minutes
            },
            attr: {
                x1: arrowsWidth,       x2: this.width - arrowsWidth,
                y1: this.height / 2,         y2: this.height / 2
            }
        };
        this._model.ticks = {
            attr: {
                x: arrowsWidth,       width: this._model.line.measures.width,
                y: this.height / 2 + 10,    height: 15
            }
        };
        this._setTickPattern();
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
        this._calcLine();
        this._calcBlocks();
        this.structure.line.attr(this._model.line.attr);
        this.structure.ticks.ticksGroup.attr(this._model.ticks.attr);
        this.drawArrows();
    }
    
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
        
    };
    
    global.Timeline = Timeline;
})(window);