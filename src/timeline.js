//--- import
var TimeBlock = require('./timeline-block'),
    TimelineTooltip = require('./timeline-tooltip');
    

//--- body
var Timeline = function (settings) {
    
    if (!settings.container) {
        throw new Error("container is required");
    }
    
    this.container = settings.container;
    this.width = settings.width;
    this.height = settings.height;
    this.date = settings.date || new Date();
    this.data = [];
    this.structure = {};
    this.events = {};
    this._init(settings);
    this.draw();

    this.hoveredBlock = null;
    this.activeBlock = null;
    this.draggableBlock = null;
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
            fill: "#ccc",
            rx: 10,
            ry: 10
        }
    }
};

Timeline.prototype._init = function (settings) {
    
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

Timeline.prototype._fireEvent = function (name, args) {
    if (this.events[name]) {
        for (var i = 0; i < this.events[name].length; i++)
            this.events[name][i](args);
    }
};

Timeline.prototype._fixEvent = function (evt) {

    var bounding = this.paper.node.getBoundingClientRect();
    evt.paperX = evt.layerX - bounding.left - this.units.shift;
    evt.paperY = evt.layerY - bounding.top;
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
    this.paper.dblclick(this._onDblClick.bind(this));
};

Timeline.prototype._onMouseMove = function (evt) {

    this._fixEvent(evt);
    if (this.activeBlock && this.activeBlock.getIsEditable()) {
        if (this._editableStart) {
            this.activeBlock.setStartPosition(evt.paperX);
        } else if (this._editableEnd) {
            this.activeBlock.setEndPosition(evt.paperX);
        }
    } else if (this.draggableBlock) {
        this.draggableBlock.setPosition(this.draggableBlockStartPosition + evt.paperX - this.startDragPosition);
    } else {
        switch (event.target.getAttribute("tag")) {
            case "line":
                this.tooltip.setPosition(evt.paperX, 15);
                this.tooltip.setText(this._time2string(this._coord2time(evt.paperX)));
                break;
        }
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
                this.activeBlock.setIsEditable(true);
                this._editableEnd = false;
                this._editableStart = true;
            }
            break;
        case "dragger-right":
            if (this.activeBlock) {
                this.activeBlock.setIsEditable(true);
                this._editableEnd = true;
                this._editableStart = false;
            }
            break;
        case "block":
            if (this.hoveredBlock) {
                this.draggableBlock = this.hoveredBlock;
                this.startDragPosition = evt.layerX - this.paper.node.getBoundingClientRect().left - this.units.shift;
                this.draggableBlockStartPosition = this.draggableBlock.getPosition().x;
            }
    }
};

Timeline.prototype._onMouseUp = function (evt) {
    
    if (this.activeBlock) {
        this.activeBlock.setIsEditable(false);
        this._editableEnd = true;
        this._editableStart = false;
    }

    if (this.draggableBlock) {
        this.draggableBlock = null;
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

Timeline.prototype._onDblClick = function (evt) {

    switch (event.target.getAttribute("tag")) {
        case "line":
            var from = this._coord2time(evt.layerX - this.paper.node.getBoundingClientRect().left),
                to = this._coord2time(evt.layerX - this.paper.node.getBoundingClientRect().left + this.units.hour);
            this.addBlock(from, to, true);
            this._fireEvent("blockAdded", { 
                from: from,
                to: to
            });
            break;
    }
};

/*
* Set date in viewport
* @param {date} date
* @param {boolean} [animation=true] - using animation
*/
Timeline.prototype.setDate = function (date, animation) {

    var start = this.units.shift,
        shift = Math.round(this.units.minutes * (this.date.getTime() - date.getTime()) / 60000),
        end = start + shift,
        viewPort = this.structure.viewPort,
        blocks = this.structure.blocks,
        ticks = this.structure.ticks.data("pattern"),
        labels = this.structure.labels.data("pattern");
    
    if (animation !== false) {
        Snap.animate(
            start,
            end,
            function (value) {
                viewPort.parent().attr({ transform: "translate(" + -value + ")" });
                blocks.attr({ transform: "translate(" + value + ")" });
                ticks.attr({ x: value });
                labels.attr({ x: value });
            },
            300
        );
    } else {
        viewPort.parent().attr({ transform: "translate(" + -end + ")" });
        blocks.attr({ transform: "translate(" + end + ")" });
        ticks.attr({ x: end });
        labels.attr({ x: end });
    }

    var eventArgs = {
        oldValue: this.date,
        newValue: date
    };
    this.date = date;
    this.units.shift += shift;

    this._fireEvent("timeChanged", eventArgs);
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

Timeline.prototype._buildBlock = function (block) {

    block.setAttributes({
        x: this._time2coord(block.from),
        y: this.height / 2 - 30,
        height: 25,
        width: Math.round(this.units.minutes * (block.to.getTime() - block.from.getTime()) / 60000),
        fill: block.color
    });
};

/*
* Add block on timeline
* @param {date} from - start datetime range
* @param {date} to - end datetime range
*/
Timeline.prototype.addBlock = function (from, to) {

    var block = new TimeBlock({
        from: from,
        to: to,
        parent: this.structure.blocks,
        style: Timeline.defaults.blocks.style,
        color: Timeline.defaults.blocks.style.fill
    });

    this.data.push(block);
    this._buildBlock(block);
};

/*
* Set component size
* @param {number} [width]
* @param {number} [height]
*/
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

    for (var i = 0; i < this.data.length; i++) {
        this._buildBlock(this.data[i]);
    }

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

/*
* Apply attributes to timeline elements
*/
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

    this.eventDom.arrows.left.attr(this.eventModel.arrows.left);
    this.eventDom.arrows.right.attr(this.eventModel.arrows.right);
    this.eventDom.line.attr(this.eventModel.line);
};


//---export
module.exports = Timeline;