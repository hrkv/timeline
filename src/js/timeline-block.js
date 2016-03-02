module.exports = (function () {
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
        this._init();
    };

    TimeBlock.prototype._init = function () {

        this.block = this.parent.rect()
            .attr(this.style)
            .attr({
                tag: "block",
                fill: this.color,
                instance: this
            });
        this.blockGroup = this.parent.g(this.block);
    };

    /*
    * Set block attributes
    * @param {object} - svg properties
    */
    TimeBlock.prototype.setAttributes = function (attributes) {

        this.attr = attributes;
        this.block.attr({
            width: this.attr.width,
            height: this.attr.height,
            fill: this.attr.fill
        });
        this.setPosition({ x: this.attr.x, y: this.attr.y });
    };

    /*
    * Get block attributes
    * @return {object} - svg properties
    */
    TimeBlock.prototype.getAttributes = function () {
        return this.attr;
    };

    /* 
    * Set block position
    * @param {number|object} coord - number (as x coord) or object { x: number, y: number}
    */
    TimeBlock.prototype.setPosition = function (coord) {

        if (!isNaN(coord)) {
            coord = { x: coord, y: this.position.y };
        }

        this.position = coord;
        this.blockGroup.attr({
            transform: "translate(" + [coord.x, coord.y].join() + ")"
        });
    };

    /*
    * Get block position
    * @return {object} - block position in format { x: number, y: number}
    */
    TimeBlock.prototype.getPosition = function () {
        return this.position;
    };

    /*
    * Set width to block
    * @param {number} - value
    */
    TimeBlock.prototype.setWidth = function (value) {
        this.block.attr({ width: value });
        if (this.markers) {
            this.markers.end.attr({ cx: value });
        }
    };

    /*
    * Set block state
    * When the block state is true, it's available to interaction (changing start/end range point)
    * @param {boolean} value
    */
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

    /*
    * Switch active block state
    */
    TimeBlock.prototype.switchState = function () {
        this.setIsActive(!this.isActive);
    };

    /*
    * Set block is available for editing
    * @param {boolean} value
    */
    TimeBlock.prototype.setIsEditable = function (value) {
        this.isEditable = value;
    };

    /*
    * Get block is available for editing
    * @return {boolean}
    */
    TimeBlock.prototype.getIsEditable = function () {
        return this.isEditable;
    };

    /*
    * Apply new value to start position of block
    * @param {number} value
    */
    TimeBlock.prototype.setStartPosition = function (value) {
        this.setWidth(Math.max(0, +this.block.attr("width") + (this.position.x - value)));
        this.setPosition(value);
    };

    /*
    * Apply new value to end position of block
    * @param {number} value
    */
    TimeBlock.prototype.setEndPosition = function (value) {
        this.setWidth(Math.max(0, value - this.position.x));
    };

    return TimeBlock;

})();