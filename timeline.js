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
        this.data = [];
        this.structure = {};
        this.events = {};
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
                rx: 10,
                ry: 10
            }
        }
    };
    
    Timeline.prototype.init = function (settings) {
        
        for (var prop in Timeline.defaults) {
            settings[prop] = Object.assign({}, settings[prop], Timeline.defaults[prop]);
            settings[prop].style = Object.assign({}, settings[prop].style, Timeline.defaults[prop].style);
        }
        settings.events = settings.events || {};
            
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

        this.events = {
            timeChanged: settings.events.timeChanged && [].concat(settings.events.timeChanged) || []
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
                tag: "left-arrow",
                fill: "transparent"
            }),
            this.eventDom.arrows.right.attr({
                tag: "right-arrow",
                fill: "transparent"
            }),
            this.eventDom.line.attr({
                tag: "line",
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
        
        if (settings.data) {
            for (var i = 0; i < settings.data.length; i++) {
                this.data.push(new TimeBlock(Object.assign({}, settings.data[i], {
                    parent: this.structure.blocks,
                    style: Timeline.defaults.blocks.style
                })));
            }
        }

        this._bindEvents();
        this.container.appendChild(this.paper.node);
        this.setSize(settings.width, settings.height);
    };
    
    Timeline.prototype.fireEvent = function (name, args) {
        if (this.events[name]) {
            for (var i = 0; i < this.events[name].length; i++)
                this.events[name][i](args);
        }
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

    Timeline.prototype._time2string = function (time) {

        return [
            ('0' + time.getHours()).slice(-2),
            ('0' + time.getMinutes()).slice(-2)
        ].join(':');
    };

    Timeline.prototype._node2block = function (node) {

        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].block.node === node) {
                return this.data[i];
            }
        }
        
        return null;
    };

    Timeline.prototype._bindEvents = function () {

        this.paper.mousemove(this._onMouseMove.bind(this));
        this.paper.mouseover(this._onMouseOver.bind(this));
        this.paper.mouseout(this._onMouseOut.bind(this));
        this.paper.mousedown(this._onMouseDown.bind(this));
        this.paper.mouseup(this._onMouseUp.bind(this));
        this.paper.click(this._onClick.bind(this));
    };
    
    Timeline.prototype._onMouseMove = function (evt) {

        switch (event.target.getAttribute("tag")) {
            case "line":
                var coord = evt.layerX - this.paper.node.getBoundingClientRect().left;
                if (this.activeBlock && this.activeBlock.getIsEditable()) {
                    this.activeBlock.changeEditableProperty(coord);
                } else {
                    this.tooltip.setPosition(coord, 15);
                    this.tooltip.setText(this._time2string(this._coord2time(coord)));
                }
                break;
            default:
                var coord = evt.layerX - this.paper.node.getBoundingClientRect().left;
                if (this.activeBlock && this.activeBlock.getIsEditable()) {
                    this.activeBlock.changeEditableProperty(coord);
                }
                break;
        }
    };
    
    Timeline.prototype._onMouseOver = function (evt) {

        switch (event.target.getAttribute("tag")) {
            case "line":
                this.tooltip.show();
                break;
            case "block":
                this.hoveredBlock = this._node2block(event.target);
                break;
        }
    };
    
    Timeline.prototype._onMouseOut = function (evt) {

        switch (event.target.getAttribute("tag")) {
            case "line":
                this.tooltip.hide();
                break;
            case "block":
                this.hoveredBlock = null;
                break;
        }
    };
    
    Timeline.prototype._onMouseDown = function (evt) {

        switch (event.target.getAttribute("tag")) {
            case "dragger-left":
                if (this.activeBlock) {
                    this.activeBlock.setPositionIsEditable(true);
                }
                break;
            case "dragger-right":
                if (this.activeBlock) {
                    this.activeBlock.setWidthIsEditable(true);
                }
                break;
        }
    };

    Timeline.prototype._onMouseUp = function (evt) {

        switch (event.target.getAttribute("tag")) {
            case "dragger-left":
            case "dragger-right":
                if (this.activeBlock) {
                    this.activeBlock.setIsEditable(false);
                }
                break;
            default:
                if (this.activeBlock) {
                    this.activeBlock.setIsEditable(false);
                }
                break;
        }
    };

    Timeline.prototype._onClick = function () {

        switch (event.target.getAttribute("tag")) {
            case "left-arrow":
                var nextHour = new Date(this.date.toISOString());
                nextHour.setHours(nextHour.getHours() - 3);
                this.setDate(nextHour);
                break;
            case "right-arrow":
                var prevHour = new Date(this.date.toISOString());
                prevHour.setHours(prevHour.getHours() + 3);
                this.setDate(prevHour);
                break;
            case "block":
                if (this.hoveredBlock) {
                    if (this.activeBlock) {
                        this.activeBlock.setIsActive(false);
                        this.activeBlock = null;
                    } else {
                        this.activeBlock = this.hoveredBlock;
                        this.activeBlock.setIsActive(true);
                    }
                }
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

        var eventArgs = {
            oldValue: this.date,
            newValue: date
        };
        this.date = date;
        this.units.shift += shift;

        this.fireEvent("timeChanged", eventArgs);
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
                x: this.units.shift,
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
            .attr({ x: this.units.shift });

        this.structure.ticks.attr({ fill: pattern });
        this.structure.ticks.data("pattern", pattern);
    };
    
    Timeline.prototype._buildBlocks = function () {

        var blocks = [];

        for (var i = 0; i < this.data.length; i++) {
            var item = this.data[i];
            blocks.push({
                x: this._time2coord(item.from),
                y: this.height / 2 - 30,
                height: 25,
                width: Math.round(this.units.minutes * (item.to.getTime() - item.from.getTime()) / 60000),
                fill: item.color
            });
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
            shift: viewPort.x + Math.round(viewPort.width / 720 * (startDate.getTime() - this.date.getTime()) / 60000)
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
            this.data[i].block.attr({
                width: this.model.blocks[i].width,
                height: this.model.blocks[i].height,
                fill: this.model.blocks[i].fill
            });
            this.data[i].setPosition({ x: this.model.blocks[i].x, y: this.model.blocks[i].y });
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
        this.color = settings.color;
        this.tag = settings.tag;
        this.text = settings.text;
        this.parent = settings.parent;
        this.style = settings.style;
        this.attr = settings.attr;
        this.block = null;
        this.isActive = false;
        this.isEditable = false;
        this._editableProperty = null;
        this.markers = null;
        this.position = null;
        this.init();
    };

    TimeBlock.prototype.init = function () {

        this.block = this.parent.rect()
            .attr(this.style)
            .attr({
                tag: "block",
                fill: this.color,
                instance: this
            });
        this.blockGroup = this.parent.g(this.block);
    };

    TimeBlock.prototype.setPosition = function (coord) {

        this.position = coord;
        this.blockGroup.attr({ transform: "translate(" + [coord.x, coord.y].join() + ")" });
    };

    TimeBlock.prototype.setWidth = function (value) {
        this.block.attr({ width: value });
        if (this.markers) {
            this.markers.end.attr({ cx: value });
        }
    };

    TimeBlock.prototype.setIsActive = function (value) {

        this.isActive = value;
        if (!this.markers) {
            this.markers = {
                start: this.blockGroup.circle()
                           .attr({
                               tag: "dragger-left",
                               cy: 0, r: 10,
                               fill: "orange"
                           }),
                end: this.blockGroup.circle()
                           .attr({
                               tag: "dragger-right",
                               cy: 0, r: 10,
                               fill: "orange"
                           })
            };
        }
        if (value) {
            this.markers.start.attr({ visibility: "visible" });
            this.markers.end.attr({
                visibility: "visible",
                cx: +this.block.attr("width"),
            });
        } else {
            this.markers.start.attr({ visibility: "hidden" });
            this.markers.end.attr({ visibility: "hidden" });
        }
    };

    TimeBlock.prototype.switchState = function () {
        this.setIsActive(!this.isActive);
    };

    TimeBlock.prototype.setIsEditable = function (value) {
        this.isEditable = value;
    };

    TimeBlock.prototype.setPositionIsEditable = function (value) {
        this.setIsEditable(value);
        this._editableProperty = value ? "x" : null;
    };

    TimeBlock.prototype.setWidthIsEditable = function (value) {
        this.setIsEditable(value);
        this._editableProperty = value ? "width" : null;
    };

    TimeBlock.prototype.getIsEditable = function () {
        return this.isEditable;
    };

    TimeBlock.prototype.changeEditableProperty = function (value) {
        if (this._editableProperty === "width") {
            this.setWidth(value);
        } else if (this._editableProperty === "x") {
            this.block.attr({ x: value });
        }
    };
    
    global.Timeline = Timeline;
})(window);