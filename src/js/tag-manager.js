module.exports = (function () {

    var TagManager = function (settings) {
        this.container = settings.container;
        this.tags = [];
        this._init();
    };

    TagManager.prototype._init = function () {
        this.node = document.createElement("div");
        this.tagCloud = document.createElement("div");
        this.tagEditor = document.createElement("div");
        this.textarea = document.createElement("textarea");
        this.button = document.createElement("button");

        this.button.textContent = "save";

        this.node.className = "tag-manager";
        this.tagCloud.className = "tag-manager__tag-cloud";
        this.tagEditor.className = "tag-manager__tag-editor";
        this.textarea.className = "tag-manager__tag-editor__textarea";
        this.button.className = "tag-manager__tag-editor__button";

        this.tagEditor.appendChild(this.textarea);
        this.tagEditor.appendChild(this.button);
        this.node.appendChild(this.tagCloud);
        this.node.appendChild(this.tagEditor);
        this.container.appendChild(this.node);

        this.loadTags(this.drawTagCloud);
    };

    /*
    * load available tags and refresh tagcloud
    * @param {function} [callback]
    */
    TagManager.prototype.loadTags = function (callback) {
        //TODO get available tags from database
        callback.call(this, ["sleep", "sport", "work", "friends", "family", "hobby", "eating", "shoping", "tv"]);
    };

    /*
    * draw tag cloud
    * @param {string[]} tags - array of tags
    */
    TagManager.prototype.drawTagCloud = function (tags) {
        var tagCloudContent = document.createDocumentFragment(),
            tag, i;

        tags = tags || [];
        for (i = 0; i < tags.length; i++) {
            tag = document.createElement("span");
            tag.className = "tag-manager__tag-cloud__tag";
            tag.innerText = tags[i];
            tagCloudContent.appendChild(tag);
        }

        while (this.tagCloud.firstChild) {
            this.tagCloud.removeChild(this.tagCloud.firstChild);
        }
        this.tagCloud.appendChild(tagCloudContent);
    };

    return TagManager;

})();