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

        this.eventDom = {
            arrows: {
                left: this.paper.rect(),
                right: this.paper.rect()
            },
            line: this.paper.rect()
        };
        this.eventDom.body = this.paper.g(
            this.eventDom.arrows.left.attr({
                id: "left-arrow",
                fill: "transparent"
            }),
            this.eventDom.arrows.right.attr({
                id: "right-arrow",
                fill: "transparent"
            }),
            this.eventDom.line.attr({
                id: "line",
                fill: "transparent"
            })
        );

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
        
        this._bindEvents();
        this.container.appendChild(this.paper.node);
        this.setSize(settings.width, settings.height);
    };
    
    Timeline.prototype._time2coord = function (time) {

        var startCoordTime = new Date(this.date.toISOString());
        startCoordTime.setHours(0, 0, 0, 0);
        return Math.round(this.units.minutes * (time.getTime() - startCoordTime.getTime()) / 60000);
    };

    Timeline.prototype._coord2time = function (coord) {

        var minutes = Math.round((coord - this.model.viewPort.x) / this.units.minutes),
            time = new Date(this.date.toISOString());
        time.setMinutes(time.getMinutes() + minutes);
        return time;
    };

    Timeline.prototype._bindEvents = function () {

        this.paper.mousemove(this._onMouseMove.bind(this));
        this.paper.mouseover(this._onMouseOver.bind(this));
        this.paper.mouseout(this._onMouseOut.bind(this));
        this.paper.click(this._onClick.bind(this));
    };
    
    Timeline.prototype._onMouseMove = function (evt) {

        switch (event.target) {
            case this.eventDom.line.node:
                var coord = evt.layerX - this.paper.node.getBoundingClientRect().left;
                this.tooltip.setPosition(coord, 15);
                this.tooltip.setText(this._coord2time(coord).toLocaleTimeString());
                break;
        }
    };
    
    Timeline.prototype._onMouseOver = function (evt) {

        switch (event.target) {
            case this.eventDom.line.node:
                this.tooltip.show();
                break;
        }
    };
    
    Timeline.prototype._onMouseOut = function (evt) {

        switch (event.target) {
            case this.eventDom.line.node:
                this.tooltip.hide();
                break;
        }
    };
    
    Timeline.prototype._onClick = function () {

        switch (event.target) {
            case this.eventDom.arrows.left.node:
                var nextHour = new Date(this.date.toISOString());
                nextHour.setHours(nextHour.getHours() - 3);
                this.setDate(nextHour);
                break;
            case this.eventDom.arrows.right.node:
                var prevHour = new Date(this.date.toISOString());
                prevHour.setHours(prevHour.getHours() + 3);
                this.setDate(prevHour);
                break;
        }
    };
    
    Timeline.prototype.setDate = function (date) {

        var start = this.units.shift,
            shift = Math.round(this.units.minutes * (this.date.getTime() - date.getTime()) / 60000),
            viewPort = this.structure.viewPort,
            blocks = this.structure.blocks,
            ticks = this.structure.ticks.data("pattern"),
            labels = this.structure.labels.data("pattern");
            
        Snap.animate(
            start,
            start + shift,
            function (value) {
                viewPort.parent().attr({ transform: "translate(" + -value + ")" });
                blocks.attr({ transform: "translate(" + value + ")" });
                ticks.attr({ x: value });
                labels.attr({ x: value });
            },
            300
        );

        this.date = date;
        this.units.shift += shift;
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
                    var block = item.block = this.structure.blocks.rect();
                    item.blockContainer = this.structure.blocks.g(block);
                    item.block.attr(settings.style);
                }
                blocks.push({
                    x: this._time2coord(item.from),
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
        this.units = {
            hour: viewPort.width / 12,
            minutes: viewPort.width / 720,
        };
        this.units.shift = this._time2coord(this.date);

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

        this.eventModel = {
            arrows: {
                left: {
                    x: 0, y: 0,
                    width: viewPort.x, height: viewPort.height
                },
                right: {
                    x: viewPort.x + viewPort.width, y: 0,
                    width: viewPort.x, height: viewPort.height
                }
            },
            line: {
                x: viewPort.x, y: viewPort.height / 2 - 5,
                width: viewPort.width, height: this.model.ticks.height + 20
            }
        };

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
        this.structure.viewPort.parent().attr({ transform: "translate(" + -this.units.shift + ")" });
        this.structure.blocks.attr({ transform: "translate(" + this.units.shift + ")" });
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].block) {
                this.data[i].block.attr({
                    width: this.model.blocks[i].width,
                    height: this.model.blocks[i].height,
                    fill: this.model.blocks[i].fill
                });
                this.data[i].blockContainer.attr({
                    transform: "translate(" + [this.model.blocks[i].x, this.model.blocks[i].y].join() + ")"
                });
            }
        }

        this.eventDom.arrows.left.attr(this.eventModel.arrows.left);
        this.eventDom.arrows.right.attr(this.eventModel.arrows.right);
        this.eventDom.line.attr(this.eventModel.line);
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
        
        this.label.attr({ text: text });
    };

    var TimeBlock = function (settings) {
        this.from = settings.from;
        this.to = settings.to;
        this.tag = settings.tag;
        this.text = settings.text;
        this.parent = settings.parent;
        this.style = settings.style;
        this.attr = settings.attr;
        this.block = null;
    };

    TimeBlock.prototype.init = function () {
        this.block = this.parent.rect()
            .attr(this.style)
            .attr(this.attr);
    };
    
    global.Timeline = Timeline;
})(window);