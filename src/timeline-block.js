
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
        this.setWidth(Math.max(0, value - this.position.x));
    } else if (this._editableProperty === "x") {
        this.setWidth(Math.max(0, +this.block.attr("width") + (this.position.x - value)));
        this.setPosition({ x: value, y: this.position.y });
    }
};

module.exports = TimeBlock;