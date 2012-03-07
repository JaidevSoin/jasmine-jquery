var readFixtures = function() {
  return jasmine.getFixtures().proxyCallTo_('read', arguments);
};

var preloadFixtures = function() {
  jasmine.getFixtures().proxyCallTo_('preload', arguments);
};

var loadFixtures = function() {
  jasmine.getFixtures().proxyCallTo_('load', arguments);
};

var setFixtures = function(html) {
  jasmine.getFixtures().set(html);
};

var sandbox = function(attributes) {
  return jasmine.getFixtures().sandbox(attributes);
};

var spyOnEvent = function(selector, eventName) {
  return jasmine.JQuery.events.spyOn(selector, eventName);
};

jasmine.getFixtures = function() {
  return jasmine.currentFixtures_ = jasmine.currentFixtures_ || new jasmine.Fixtures();
};

jasmine.Fixtures = function() {
  this.containerId = 'jasmine-fixtures';
  this.fixturesCache_ = {};
  this.fixturesPath = 'spec/javascripts/fixtures';
};

jasmine.Fixtures.prototype.set = function(html) {
  this.cleanUp();
  this.createContainer_(html);
};

jasmine.Fixtures.prototype.preload = function() {
  this.read.apply(this, arguments);
};

jasmine.Fixtures.prototype.load = function() {
  this.cleanUp();
  this.createContainer_(this.read.apply(this, arguments));
};

jasmine.Fixtures.prototype.read = function() {
  var htmlChunks = [];

  var fixtureUrls = arguments;
  for(var urlCount = fixtureUrls.length, urlIndex = 0; urlIndex < urlCount; urlIndex++) {
    htmlChunks.push(this.getFixtureHtml_(fixtureUrls[urlIndex]));
  }

  return htmlChunks.join('');
};

jasmine.Fixtures.prototype.clearCache = function() {
  this.fixturesCache_ = {};
};

jasmine.Fixtures.prototype.cleanUp = function() {
  jQuery('#' + this.containerId).remove();
};

jasmine.Fixtures.prototype.sandbox = function(attributes) {
  var attributesToSet = attributes || {};
  return jQuery('<div id="sandbox" />').attr(attributesToSet);
};

jasmine.Fixtures.prototype.createContainer_ = function(html) {
  var container;
  if(html instanceof jQuery) {
    container = jQuery('<div id="' + this.containerId + '" />');
    container.html(html);
  } else {
    container = '<div id="' + this.containerId + '">' + html + '</div>';
  }
  jQuery('body').append(container);
};

jasmine.Fixtures.prototype.getFixtureHtml_ = function(url) {  
  if (typeof this.fixturesCache_[url] == 'undefined') {
    this.loadFixtureIntoCache_(url);
  }
  return this.fixturesCache_[url];
};

jasmine.Fixtures.prototype.loadFixtureIntoCache_ = function(relativeUrl) {
  var self = this;
  var url = this.fixturesPath.match('/$') ? this.fixturesPath + relativeUrl : this.fixturesPath + '/' + relativeUrl;
  var error;
  
  jQuery.ajax({
    async: false, // must be synchronous to guarantee that no tests are run before fixture is loaded
    cache: false,
    dataType: 'html',
    url: url,
    success: function(data) {
      self.fixturesCache_[relativeUrl] = data;
      win = 'success';
    },
    error: function(jqXHR, status, errorThrown) {
      error = Error('Fixture could not be loaded: ' + url + ' (status: ' + status + ', message: ' + errorThrown.message + ')');
    }
  });
  
  if (error != undefined) {
    throw error;
  }
};

jasmine.Fixtures.prototype.proxyCallTo_ = function(methodName, passedArguments) {
  return this[methodName].apply(this, passedArguments);
};


jasmine.JQuery = function() {};

jasmine.JQuery.browserTagCaseIndependentHtml = function(html) {
  return jQuery('<div/>').append(html).html();
};

jasmine.JQuery.elementToString = function(element) {
  return jQuery('<div />').append(element.clone()).html();
};

jasmine.JQuery.matchersClass = {};

jasmine.JQuery.eventSpy = function(selector, eventName) {
  this.triggerCount = 0;
  this.argsForTrigger = [];
  this.mostRecentTrigger = {};
  this.eventName = eventName;
  this.selector = selector;
  this.eventForTrigger = [];
};


(function(namespace) {
  var data = {
    eventSpies: {}
  };

  namespace.events = {
    spyOn: function(selector, eventName) {
      var eventSpy = new jasmine.JQuery.eventSpy(selector, eventName);
      
      data.eventSpies[[selector, eventName]] = eventSpy;
      
      jQuery(selector).bind(eventName, function(e) {
        var args = jasmine.util.argsToArray(arguments).slice(1);
        eventSpy.triggerCount++;
        eventSpy.eventForTrigger.push(e);
        eventSpy.argsForTrigger.push(args);
        eventSpy.mostRecentTrigger.event = e;
        eventSpy.mostRecentTrigger.args = args;
      });
      
      return eventSpy;
    },

    wasTriggered: function(selector, eventName) {
      return data.eventSpies[[selector, eventName]].triggerCount > 0;
    },
    
    wasTriggeredWith: function(selector, eventName, argsArray) {
      var spy = data.eventSpies[[selector, eventName]];
      
      if (spy == undefined) {
        return false;
      }
      
      for (var i=0; i < spy.argsForTrigger.length; i++) {
        var argumentsMatch = true;        
        
        for (var j=0; j < argsArray.length; j++) {
          if (argsArray[j] != spy.argsForTrigger[i][j]) {
            argumentsMatch = false;
          }
        };
        
        if (argumentsMatch) {
          return true;
        }
      };

      return false;
    },

    cleanUp: function() {
      data.eventSpies = {};
    }
  };
})(jasmine.JQuery);

(function(){
  var jQueryMatchers = {
    toHaveClass: function(className) {
      return this.actual.hasClass(className);
    },

    toBeVisible: function() {
      return this.actual.is(':visible');
    },

    toBeHidden: function() {
      return this.actual.is(':hidden');
    },

    toBeSelected: function() {
      return this.actual.is(':selected');
    },

    toBeChecked: function() {
      return this.actual.is(':checked');
    },

    toBeEmpty: function() {
      return this.actual.is(':empty');
    },

    toExist: function() {
      return this.actual.size() > 0;
    },

    toHaveAttr: function(attributeName, expectedAttributeValue) {
      return hasProperty(this.actual.attr(attributeName), expectedAttributeValue);
    },

    toHaveId: function(id) {
      return this.actual.attr('id') == id;
    },

    toHaveHtml: function(html) {
      return this.actual.html() == jasmine.JQuery.browserTagCaseIndependentHtml(html);
    },

    toHaveText: function(text) {
      if (text && jQuery.isFunction(text.test)) {
        return text.test(this.actual.text());
      } else {
        return this.actual.text() == text;
      }
    },

    toHaveValue: function(value) {
      return this.actual.val() == value;
    },

    toHaveData: function(key, expectedValue) {
      return hasProperty(this.actual.data(key), expectedValue);
    },

    toBe: function(selector) {
      return this.actual.is(selector);
    },

    toContain: function(selector) {
      return this.actual.find(selector).size() > 0;
    },

    toBeDisabled: function(selector){
      return this.actual.is(':disabled');
    },

    // tests the existence of a specific event binding
    toHandle: function(eventName) {
      var events = this.actual.data("events");
      return events && events[eventName].length > 0;
    },
    
    // tests the existence of a specific event binding + handler
    toHandleWith: function(eventName, eventHandler) {
      var stack = this.actual.data("events")[eventName];
      var i;
      for (i = 0; i < stack.length; i++) {
        if (stack[i].handler == eventHandler) {
          return true;
        }
      }
      return false;
    }
  };

  var hasProperty = function(actualValue, expectedValue) {
    if (expectedValue === undefined) {
      return actualValue !== undefined;
    }
    return actualValue == expectedValue;
  };

  var bindMatcher = function(methodName) {
    var builtInMatcher = jasmine.Matchers.prototype[methodName];

    jasmine.JQuery.matchersClass[methodName] = function() {
      if (this.actual instanceof jQuery) {
        var result = jQueryMatchers[methodName].apply(this, arguments);
        this.actual = jasmine.JQuery.elementToString(this.actual);
        return result;
      }

      if (builtInMatcher) {
        return builtInMatcher.apply(this, arguments);
      }

      return false;
    };
  };

  for(var methodName in jQueryMatchers) {
    bindMatcher(methodName);
  }
})();

beforeEach(function() {
  this.addMatchers(jasmine.JQuery.matchersClass);
  this.addMatchers({
    toHaveBeenTriggeredOn: function(selector) {
      if (arguments.length > 1) {
        throw new Error('toHaveBeenTriggeredOn only takes a selector, not argument arguments, use toHaveBeenTriggeredOnAndWith');
      }
      
      this.message = function() {
        return [
          "Expected event " + this.actual + " to have been triggered on" + selector,
          "Expected event " + this.actual + " not to have been triggered on" + selector
        ];
      };
      return jasmine.JQuery.events.wasTriggered(selector, this.actual);
    },
    toHaveBeenTriggeredOnAndWith: function(selector, argsArray) {
    
      this.message = function() {
        return [
          "Expected event " + this.actual + " to have been triggered on" + selector + 'with args ' + argsArray.join(', ') + ' but it never was',
          "Expected event" + this.actual + " not have been triggered on" + selector + 'with args: ' + argsArray.join(', ') + ' but it was',
        ];
      };
      
      return jasmine.JQuery.events.wasTriggeredWith(selector, this.actual, argsArray);
    }
  });
});

afterEach(function() {
  jasmine.getFixtures().cleanUp();
  jasmine.JQuery.events.cleanUp();
});
