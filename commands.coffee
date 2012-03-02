do ->
  curr_command = -1

  window.Command = Backbone.Model.extend
    defaults:
      'index': 0
      'contents': ""
    compile: ->
      try
        jscode = CoffeeScript.compile(@get('contents'))

        # remove wrapping closure
        jscode = jscode.substring(16)
        jscode = jscode.substring(0,jscode.length-16)
        return {
          type: 'success'
          result: jscode
        }
      catch error
        return {
          type: 'error'
          result: error
        }

  window.Commands = Backbone.Collection.extend
    model: Command
    localStorage: new Store("command")

  window.CommandView = Backbone.View.extend
    tagName: "pre"
    className: "input"
    render: ->
      code = @model.get('contents')
      $(@el).addClass('cm-s-idle');
      CodeMirror.runMode(code, "coffeescript", @el)
      $('#puts').append(this.el)
