(function() {
  // globalize underscore
  _.extend(window, _);
  _.extend(window, {
    Events: Backbone.Events,
    Model: Backbone.Model,
    Collection: Backbone.Collection,
    Router: Backbone.Router,
    View: Backbone.View
  });

  var commands = new Commands();
  commands.fetch();
  var curr = commands.size();  // current command
  var error_state = false;

  var output_node = document.getElementById('output');

  window.editor = CodeMirror.fromTextArea(document.getElementById("input"), {
    mode: 'coffeescript',
    theme: 'idle',
    onChange: test_compile,
    extraKeys: {
      "Shift-Enter": CodeMirror.commands.newlineAndIndent,
      "Enter": go,
      "Up": up,
      "Down": down,
      "Tab": autocomplete,
      "Shift-Right": CodeMirror.commands.indentMore,
      "Shift-Left": CodeMirror.commands.indentLess
    }
  });

  editor.focus();

  // highlight examples
  $('.highlight').each(function() {
    var code = $(this).text();
    highlight_coffee(this, code);
  });

  $('#output').css({'max-height': $(window).height() - 126});
  $(window).bind("resize", function() {
    $('#output').css({'max-height': $(window).height() - 126});
  });

  function autocomplete(cm) {
    CodeMirror.simpleHint(cm, CodeMirror.coffeescriptHint);
  }

  function test_compile(cm) {
    try {
      error_state = false;
      CoffeeScript.compile(editor.getValue());
      $('#coffee-error').hide();
    } catch (err) {
      error_state = true;
      $('#coffee-error').removeClass('tried');
      $('#coffee-error #compile-error').text(err.message);
      $('#coffee-error').show();
    }
  }

  function up(cm) {
    if (curr > 0 && topline()) {
      curr -= 1;
      var command = commands.at(curr);
      editor.setValue(command.get('contents'));
    } else {
      CodeMirror.commands.goLineUp(cm);
    }
  };

  function down(cm) {
    if (curr < commands.size() && botline()) {
      curr += 1;
      if (curr != commands.size()) {
        var command = commands.at(curr);
        editor.setValue(command.get('contents'));
      } else {
        editor.setValue("");
      }
    } else {
      CodeMirror.commands.goLineDown(cm);
    }
  };
  
  function topline() {
    return coords().line == 0;
  };

  function botline() {
    var lines = editor.lineCount();
    return coords().line == lines - 1;
  };

  function coords() {
    var cursor = editor.cursorCoords();
    return editor.coordsChar(cursor);
  };

  function go() {
    if (error_state) {
      $('#coffee-error').addClass('tried');
      return;
    }

    var code = editor.getValue();
    editor.setValue("");

    var command = commands.create({
      contents: code
    });
    (new CommandView({
      model: command
    })).render();

    jscode = command.compile();

    if (jscode.type == "success") {
      try {
        var result = eval.call(null, jscode.result);

      // print result
        output(result);
      } catch (error) {
        output_error("Javascript error: " + result);
      }
    } else if (jscode.type == "error") {
      output_error("CoffeeScript error: " + jscode.result.message);
    }

    curr = commands.size();
  };

  function output_print(txt, className) {
    var txt_node = document.createElement('pre');
    txt_node.className = className;
    output_node.appendChild(txt_node);

    if (className == 'input' || className == 'output') {
      highlight_js(txt_node, txt);
    } else {
      $(txt_node).text(txt);
    }

    toBottom();
  };

  function toBottom() {
    // scroll to bottom
    $('#output').animate({scrollTop: $('#output')[0].scrollHeight}, 0);
  };

  window.output = function(result) {

    switch (type(result)) {
      case "array":
        result = JSON.stringify(result);
        break;
      case "function":
        result = result.toString();
        break;
      case "object":
        try {
          result = JSON.stringify(result);
        } catch (err) {
          output_error("Print error: " + err.message);
          return;
        }
        break;
      case "number":
        result = result.toString();
        break;
      case "boolean":
        result = result.toString();
        break;
      case "string":
        result = '"' + result + '"';
        break;
      case "undefined":
        result = "undefined";
        break;
      case "element":
        $(output_node).append(result);
        setTimeout(function() { toBottom(); }, 40);
        return;
        break;
      default:
        result = result.toString();
    }

    //var coffee_result = Js2coffee.build(result + "");
    output_print(result, "output");
  };

  function output_error(result) {
    output_print(result, "error");
  };

  function highlight_coffee(node, code) {
    $(node).addClass('cm-s-idle');
    CodeMirror.runMode(code, "coffeescript", node);
  };

  function highlight_js(node, code) {
    $(node).addClass('cm-s-idle');
    CodeMirror.runMode(code, "javascript", node);
  };

})();

/* global functions */

function type(object) {
  if (_.isFunction(object)) return "function";
  if (_.isArray(object)) return "array";
  if (_.isElement(object)) return "element";
  if (_.isNull(object)) return "null";
  if (_.isNaN(object)) return "NaN";
  if (_.isDate(object)) return "date";
  if (_.isArguments(object)) return "arguments";
  if (_.isUndefined(object)) return "undefined";
  if (_.isRegExp(object)) {
    return "RegExp";
  } else {
    return typeof object;
  }
};

function html(str) {
  return $(str)[0];
};

function pretty(obj) {
  return JSON.stringify(obj, undefined, 2);
};

function repeat(func, interval) {
  func();
  setTimeout(function() {
    repeat(func, interval);
  }, interval);
};
