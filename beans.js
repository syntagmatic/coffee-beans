var commands = new Commands();
commands.fetch();
var curr = commands.size();

var output_node = document.getElementById('output');

var editor = CodeMirror.fromTextArea(document.getElementById("input"), {
  mode: 'coffeescript',
  theme: 'monokai',
  extraKeys: {
    "Shift-Enter": CodeMirror.commands.newlineAndIndent,
    "Enter": go,
    "Up": up,
    "Down": down,
    "Ctrl-Space": function(cm) {
      var cursor = editor.cursorCoords();
      var coords = editor.coordsChar(cursor);
      console.log(editor.getTokenAt(coords));
      CodeMirror.simpleHint(cm, CodeMirror.coffeescriptHint);
    }
  }
});

editor.focus();

window.onresize = size_console;

function size_console(e) {
  // TODO
};

function up() {
  if (curr > 0) {
    curr -= 1;
    var command = commands.at(curr);
    editor.setValue(command.get('contents'));
  }
};

function down() {
  if (curr < commands.size()) {
    curr += 1;
    if (curr != commands.size()) {
      var command = commands.at(curr);
      editor.setValue(command.get('contents'));
    } else {
      editor.setValue("");
    }
  }
};

function go() {
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
    // with underscore
    jscode = "with (_) {\n" + jscode.result + "}";
    try {
      var result = eval.call(null, jscode);
      // print result
      output(JSON.stringify(result));
    } catch (error) {
      output_error("Javascript error: " + result);
    }
  } else if (jscode.type == "error") {
    output_error("CoffeeScript error: " + jscode.result.message);
  }

  curr = commands.size();
};

function output_print(txt, className) {
  var txt_node = document.createElement('div');
  txt_node.appendChild(document.createTextNode(txt));
  txt_node.className = className;
  output_node.appendChild(txt_node);
};

function output(result) {
  //var coffee_result = Js2coffee.build(result + "");
  output_print(result, "output");
};

function output_error(result) {
  output_print(result, "error");
};

var store = {
  code: 8
};

d3.select("#store-code").on("click", function() {
  var code = editor.getValue();
  output_print("Saving...", "notice");
  localStorage.setItem("store.code" + store.code.length, code);
  
  output_print("Done", "notice");
});


