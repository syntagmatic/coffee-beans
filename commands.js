
(function() {
  var curr_command;
  curr_command = -1;
  window.Command = Backbone.Model.extend({
    defaults: {
      'index': 0,
      'contents': ""
    },
    compile: function() {
      var jscode;
      try {
        jscode = CoffeeScript.compile(this.get('contents'));
        jscode = jscode.substring(16);
        jscode = jscode.substring(0, jscode.length - 16);
        return {
          type: 'success',
          result: jscode
        };
      } catch (error) {
        return {
          type: 'error',
          result: error
        };
      }
    }
  });
  window.Commands = Backbone.Collection.extend({
    model: Command,
    localStorage: new Store("command")
  });
  return window.CommandView = Backbone.View.extend({
    tagName: "div",
    className: "input",
    render: function() {
      var code;
      code = this.model.get('contents');
      $(this.el).addClass('cm-s-idle');
      CodeMirror.runMode(code, "coffeescript", this.el);
      return $('#output').append(this.el);
    }
  });
})();
