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
        },
        labels: {
            enabled: true,
            style: {
                fill: "#777"
            }
        },
        blocks: {
            style: {
                stroke: "#777",
                "stroke-width": 2,
                rx: 1,
                ry: 1
            }
        }
    };
    
    Timeline.prototype.init = function (settings) {
        
        for (var prop in Timeline.defaults) {
            settings[prop] = Object.assign({}, settings[prop], Timeline.defaults[prop]);
            settings[prop].style = Object.assign({}, settings[prop].style, Timeline.defaults[prop].style);
        }
            
        this.paper = Snap();
        this.structure = {
            viewPort: this.paper.rect().attr({ fill: "#fff" }),
            blocks: this.paper.g(),
            line: this.paper.line().attr(settings.line.style),
            arrows: {
                left: this.paper.polyline().attr(settings.arrows.style),
                right: this.paper.polyline().attr(settings.arrows.style)
            },
            ticks: this.paper.rect(),
            labels: this.paper.rect()
        };

        this.structure.arrows.left.data("settings", settings.arrows);
        this.structure.arrows.right.data("settings", settings.arrows);
        this.structure.ticks.data("settings", settings.ticks);
        this.structure.labels.data("settings", settings.labels);
        this.structure.blocks.data("settings", settings.blocks);
        this.structure.blocks.attr({ mask: this.paper.g(this.structure.viewPort) });

        this.tooltip = new TimelineTooltip({
            paper: this.paper,
            text: "Test text"
        });
        
        //this._bindEvents();
        this.container.appendChild(this.paper.node);
        this.setSize(settings.width, settings.height);
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
                nextHour.setHours(nextHour.getHours() + 3);
                this.setDate(nextHour);
                break;
            case this.structure.arrows.right.node:
                var prevHour = new Date(this.date.toISOString());
                prevHour.setHours(prevHour.getHours() - 3);
                this.setDate(prevHour);
                break;
        }
    };
    
    Timeline.prototype.setDate = function (date) {

        var blocks = this.structure.blocks,
            ticks = this.structure.ticks.data("pattern"),
            labels = this.structure.labels.data("pattern");
            
        Snap.animate(
            this.model.viewPort.x,
            this.model.viewPort.x + Math.round(this.units.minutes * (date.getTime() - this.date.getTime()) / 60000),
            function (value) {
                pattern.attr({ x: value });
                ticks.attr({ x: value });
                labels.attr({ x: value });
            },
            300
        );
        this.date = date;
    };
    
    Timeline.prototype._buildLabelsPattern = function () {
        
        var labels = this.structure.labels,
            labelsSettings = labels.data("settings"),
            pattern = labels.data("pattern"),
            label, box;

        if (pattern) {
            pattern.remove();
            pattern = null;
        }

        if (labelsSettings.enabled) {

            pattern = this.paper.g();
            for (var i = 0; i < 24; i++) {
                label = pattern.text(0, 0, i.toString()).attr(labelsSettings.style);
                box = label.getBBox();
                label.attr({
                    x: i * this.units.hour - box.width / 2,
                    y: box.height
                });
            }

            pattern = pattern.toPattern(0, 0, 24 * this.units.hour, this.model.viewPort.height);
            pattern.attr({
                x: this.model.viewPort.x + this.units.shift,
                y: this.model.labels.y
            });
            labels.attr({ fill: pattern });
        }

        labels.data("pattern", pattern);
    };
    
    Timeline.prototype._buildTicksPattern = function () {

        var patternWidthStep = this.units.hour / 4,
            ticksStyle = this.structure.ticks.data("settings").style,
            tickWidth = ticksStyle["stroke-width"],
            shift = (tickWidth % 2) * 0.5,
            pattern = this.paper.g(
                this.paper.line({
                    x1: shift, y1: 0,
                    x2: shift, y2: 12,
                }).attr(ticksStyle),
                this.paper.line({
                    x1: patternWidthStep + shift, y1: 0,
                    x2: patternWidthStep + shift, y2: 4,
                }).attr(ticksStyle),
                this.paper.line({
                    x1: 2 * patternWidthStep + shift, y1: 0,
                    x2: 2 * patternWidthStep + shift, y2: 8,
                }).attr(ticksStyle),
                this.paper.line({
                    x1: 3 * patternWidthStep + shift, y1: 0,
                    x2: 3 * patternWidthStep + shift, y2: 4,
                }).attr(ticksStyle),
                this.paper.line({
                    x1: 4 * patternWidthStep + shift, y1: 0,
                    x2: 4 * patternWidthStep + shift, y2: 12,
                }).attr(ticksStyle)
            )
            .toPattern(0, 0, 4 * patternWidthStep, 15)
            .attr({ x: this.model.viewPort.x + this.units.shift });

        this.structure.ticks.attr({ fill: pattern });
        this.structure.ticks.data("pattern", pattern);
    };
    
    Timeline.prototype._buildBlocks = function () {

        var settings = this.structure.blocks.data("settings"),
            blocks = [];

        if (this.data) {
            for (var i = 0; i < this.data.length; i++) {
                var item = this.data[i];
                if (!item.block) {
                    item.block = this.structure.blocks.rect();
                    item.block.attr(settings.style);
                }
                blocks.push({
                    x: this.model.viewPort.x + Math.round(this.units.minutes * (item.to.getTime() - this.date.getTime()) / 60000),
                    y: this.height / 2 - 20,
                    height: 15,
                    width: Math.round(this.units.minutes * (item.to.getTime() - item.from.getTime()) / 60000),
                    fill: item.color
                });
            }
        }

        return blocks;
    };
    
    Timeline.prototype.setSize = function (width, height) {

        this.width = width || this.container.offsetWidth;
        this.height = height || this.container.offsetHeight;
        this._updateModel();
    };

    Timeline.prototype._updateModel = function () {

        var arrowsSettings = this.structure.arrows.left.data("settings"),
            arrowsWidth = arrowsSettings.enabled && arrowsSettings.style.width || 0,
            arrowsHeight = arrowsSettings.enabled && arrowsSettings.style.height || 0,
            width = this.width - 2 * arrowsWidth,
            roundedWidth = Math.floor(width / 48) * 48,
            hSpacing = width - roundedWidth;

        this.model = this.model || {};
        this.model.viewPort = {
            x: arrowsWidth + hSpacing / 2, y: 0,
            width: roundedWidth, height: this.height
        };

        var viewPort = this.model.viewPort;
        var startDate = new Date(this.date.toISOString());
        startDate.setHours(0, 0, 0, 0);

        this.units = {
            hour: viewPort.width / 12,
            minutes: viewPort.width / 720,
            shift: Math.round(viewPort.width / 720 * (startDate.getTime() - this.date.getTime()) / 60000)
        };

        this.model.line = {
            x1: viewPort.x, y1: viewPort.height / 2,
            x2: viewPort.x + viewPort.width, y2: viewPort.height / 2
        };
        this.model.ticks = {
            x: viewPort.x, y: viewPort.height / 2 + 10,
            width: viewPort.width, height: 15
        };
        this.model.labels = {
            x: viewPort.x, y: this.model.ticks.y + this.model.ticks.height + 5,
            width: viewPort.width, height: 20
        };
        this.model.arrows = {
            left: {
                points: [
                    [arrowsWidth * 0.75, this.height / 2 - arrowsHeight * 0.25].join(),
                    [arrowsWidth * 0.25, this.height / 2].join(),
                    [arrowsWidth * 0.75, this.height / 2 + arrowsHeight * 0.25].join()
                ].join(" ")
            },
            right: {
                points: [
                    [this.width - arrowsWidth * 0.75, this.height / 2 - arrowsHeight * 0.25].join(),
                    [this.width - arrowsWidth * 0.25, this.height / 2].join(),
                    [this.width - arrowsWidth * 0.75, this.height / 2 + arrowsHeight * 0.25].join()
                ].join(" ")
            }
        };
        this.model.blocks = this._buildBlocks();

        this._buildTicksPattern();
        this._buildLabelsPattern();
    };
    
    Timeline.prototype.draw = function () {

        this.structure.viewPort.attr(this.model.viewPort);
        this.structure.line.attr(this.model.line);
        this.structure.arrows.left.attr(this.model.arrows.left);
        this.structure.arrows.right.attr(this.model.arrows.right);
        this.structure.ticks.attr(this.model.ticks);
        this.structure.labels.attr(this.model.labels);

        this.structure.blocks.attr(this.model.viewPort);
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].block) {
                this.data[i].block.attr(this.model.blocks[i]);
            }
        }
    };
    

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