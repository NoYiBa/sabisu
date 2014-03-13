// Generated by CoffeeScript 1.7.1
(function() {
  var sabisu,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  sabisu = angular.module('sabisu', []);

  sabisu.config(function($locationProvider) {
    return $locationProvider.html5Mode(true);
  });

  sabisu.filter('slice', function() {
    return function(arr, start, end) {
      return arr.slice(start, end);
    };
  });

  sabisu.filter('joinBy', function() {
    return function(input, delimiter) {
      return (input || []).join(delimiter || ',');
    };
  });

  sabisu.directive('searchTypeahead', function() {
    return function(scope, element, attrs) {
      return angular.element(element).typeahead({
        minLength: 1,
        highlight: true
      }, {
        name: 'keys',
        displayKey: 'value',
        source: function(query, cb) {
          return cb([
            {
              'value': 'aaa'
            }, {
              'value': 'bbb'
            }, {
              'value': 'ccc'
            }
          ]);
        }
      });
    };
  });

  sabisu.factory('eventsFactory', function($log, $http) {
    var factory;
    factory = {};
    factory.searchEvents = function(search_query, sort, limit, ints) {
      if (sort === 'age') {
        sort = 'state_change';
      }
      if (sort === '-age') {
        sort = '-state_change';
      }
      if (__indexOf.call(ints, sort) < 0) {
        sort = sort + '<string>';
      }
      sort = "[\"" + sort + "\"]";
      if (search_query === '') {
        search_query = '*:*';
      }
      return $http({
        method: 'GET',
        url: '/api/events/search',
        params: {
          query: search_query,
          limit: limit,
          sort: sort
        }
      });
    };
    factory.resolveEvent = function(client, check) {
      return $http({
        method: 'POST',
        url: '/sensu/resolve',
        data: {
          client: client,
          check: check
        }
      });
    };
    factory.changes = function(params) {
      return $http({
        method: 'GET',
        url: '/api/changes',
        params: params
      });
    };
    factory.last_sequence = function() {
      return $http({
        method: 'GET',
        url: '/api/changes',
        params: {
          limit: 1,
          descending: true
        }
      });
    };
    factory.event_fields = function() {
      return $http({
        method: 'GET',
        url: '/api/configuration/fields'
      });
    };
    return factory;
  });

  sabisu.factory('stashesFactory', function($log, $http) {
    var factory;
    factory = {};
    factory.stashes = function() {
      return $http.get('/sensu/stashes');
    };
    factory.saveStash = function(stash) {
      return $http.post("/sensu/stashes", stash);
    };
    factory.deleteStash = function(path) {
      return $http["delete"]("/sensu/stashes/" + path);
    };
    return factory;
  });

  sabisu.controller('eventsController', function($scope, $log, $location, $filter, $sce, eventsFactory, stashesFactory) {
    $scope.first_search = true;
    $scope.alt_pressed = false;
    $scope.checks = [];
    $scope.clients = [];
    $scope.events = [];
    $scope.event_fields = [];
    $scope.event_fields_custom = [];
    $scope.event_fields_facet = [];
    $scope.event_fields_int = [];
    $scope.event_fields_name = [];
    $scope.events_spin = false;
    $scope.showAll = false;
    $scope.bulk = 'show';
    $scope.isActive = true;
    $scope.showDetails = [];
    $scope.previous_events_ranges = {};
    $scope.previous_events_counts = {};
    $scope.previous_events_events = {};
    $(window).on('focus', function() {
      $scope.isActive = true;
      $scope.updateEvents();
      return $scope.changes();
    });
    $(window).on('blur', function() {
      return $scope.isActive = false;
    });
    $(window).keydown(function(evt) {
      if (evt.which === 18) {
        return $scope.alt_pressed = true;
      }
    });
    $(window).keyup(function(evt) {
      if (evt.which === 18) {
        return $scope.alt_pressed = false;
      }
    });
    if ($location.search().query != null) {
      $scope.search_field = $location.search().query;
      $scope.search = $location.search().query;
    } else {
      $scope.search_field = '';
      $scope.search = '';
    }
    if ($location.search().sort != null) {
      $scope.sort_field = $location.search().sort;
      $scope.sort = $location.search().sort;
    } else {
      $scope.sort = '-age';
      $scope.sort_field = '-age';
    }
    if ($location.search().limit != null) {
      $scope.limit = $location.search().limit;
      $scope.limit_field = $location.search().limit;
    } else {
      $scope.limit = '50';
      $scope.limit_field = '50';
    }
    if ($location.search().showAll != null) {
      $scope.showAll = $location.search().showAll;
      $log.info($scope.showAll);
    }
    $scope.buildSilencePopover = function(stash) {
      var html, rel_time;
      html = '<div class="silence_window">';
      if (stash['content']['timestamp'] != null) {
        html = "<dl class=\"dl-horizontal\">\n<dt>Created</dt>\n<dd>" + ($filter('date')(stash['content']['timestamp'] * 1000, "short")) + "</dd>";
      }
      if (stash['content']['author'] != null) {
        html += "<dt>Author</dt>\n<dd>" + stash['content']['author'] + "</dd>";
      }
      if ((stash['expire'] != null) && stash['expire'] !== -1) {
        rel_time = moment.unix(parseInt(stash['content']['timestamp']) + parseInt(stash['expire'])).fromNow();
        html += "<dt class=\"text-warning\">Expires</dt>\n<dd class=\"text-warning\">" + rel_time + "</dd>";
      }
      if (stash['content']['expiration'] === 'resolve') {
        html += "<dt class=\"text-success\">Expires</dt>\n<dd class=\"text-success\">On resolve</dt>";
      }
      if (stash['content']['expiration'] === 'never') {
        html += "<dt class=\"text-danger\">Expires</dt>\n<dd class=\"text-danger\">Never</dt>";
      }
      html += "</dl>";
      if (stash['content']['comment'] != null) {
        html += "<dl>\n<dt>Comment</dt>\n<dd>" + stash['content']['comment'] + "</dd>\n</dl>";
      }
      html += "<button type=\"button\" class=\"deleteSilenceBtn btn btn-danger btn-sm pull-right\" onclick=\"angular.element($('#eventsController')).scope().deleteSilence('" + stash['path'] + "')\">\n<span class=\"glyphicon glyphicon-remove\"></span> Delete\n</button>";
      return html += "</div>";
    };
    $scope.updateEventFields = function() {
      return eventsFactory.event_fields().success(function(data, status, headers, config) {
        var defaults, field, _i, _len, _ref, _ref1, _results;
        defaults = ['client', 'check', 'status', 'state_change', 'occurrence', 'issued', 'output'];
        $scope.event_fields = data;
        _ref = $scope.event_fields;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          $scope.event_fields_name.push(field.name);
          if (field.type === 'int') {
            $scope.event_fields_int.push(field.name);
            $scope.event_fields_int.push('-' + field.name);
          }
          if (field.facet === true) {
            $scope.event_fields_facet.push(field.name);
          }
          if (_ref1 = field.name, __indexOf.call(defaults, _ref1) < 0) {
            _results.push($scope.event_fields_custom.push(field));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }).error(function(data, status, headers, config) {
        return alert("Failed to get fields");
      });
    };
    $scope.add_event_attr_html = function(key, value) {
      var field, html, _i, _len, _ref;
      if (("" + value).match('^[0-9]{13}$')) {
        value = $filter('date')(value, 'short');
      } else if ($scope.typeIsArray(value)) {
        value = $filter('joinBy')(value, ', ');
      } else if (value === void 0 || value === null) {
        value = 'n/a';
      } else {
        _ref = $scope.event_fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          if (key === field.name) {
            if (field.type === 'url' && (value != null)) {
              value = "<a href=\"" + value + "\">goto</a>";
            }
            break;
          }
        }
      }
      html = "<dt class='attr_title'>" + key + "</dt>";
      html += "<dd class='attr_value'>" + value + "</dd>";
      return html;
    };
    $scope.build_event_attr_html = function(event) {
      var i, item, left_custom, left_div, right_custom, right_div, _i, _j, _len, _len1;
      left_custom = (function() {
        var _i, _len, _ref, _results;
        _ref = $scope.event_fields_custom;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i += 2) {
          i = _ref[_i];
          _results.push(i);
        }
        return _results;
      })();
      right_custom = (function() {
        var _i, _len, _ref, _results;
        _ref = $scope.event_fields_custom.slice(1);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i += 2) {
          i = _ref[_i];
          _results.push(i);
        }
        return _results;
      })();
      left_div = "<dl class='dl-horizontal col-md-5 pull-left'>";
      left_div += $scope.add_event_attr_html('issued', event.check.issued);
      left_div += $scope.add_event_attr_html('interval', event.check.interval);
      left_div += $scope.add_event_attr_html('occurrences', event.occurrences);
      for (_i = 0, _len = left_custom.length; _i < _len; _i++) {
        item = left_custom[_i];
        left_div += $scope.add_event_attr_html(item.name, $scope.get_obj_attr(event, item.path));
      }
      left_div += "</dl>";
      right_div = "<dl class='dl-horizontal col-md-5 pull-left'>";
      right_div += $scope.add_event_attr_html('state change', event.rel_time);
      right_div += $scope.add_event_attr_html('subscribers', event.check.subscribers);
      right_div += $scope.add_event_attr_html('handlers', event.check.handlers);
      for (_j = 0, _len1 = right_custom.length; _j < _len1; _j++) {
        item = right_custom[_j];
        right_div += $scope.add_event_attr_html(item.name, $scope.get_obj_attr(event, item.path));
      }
      right_div += "</dl>";
      return left_div + right_div;
    };
    $scope.updateStashes = function() {
      return stashesFactory.stashes().success(function(data, status, headers, config) {
        var check, client, event, parts, stash, stashes, _base, _base1, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
        stashes = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          stash = data[_i];
          if (stash['path'].match(/^silence\//)) {
            stashes.push(stash);
          }
        }
        $scope.stashes = stashes;
        _ref = $scope.stashes;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          stash = _ref[_j];
          parts = stash['path'].split('/', 3);
          client = parts[1];
          if (parts.length > 2) {
            check = parts[2];
          } else {
            check = null;
          }
          _ref1 = $scope.events;
          for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
            event = _ref1[_k];
            if ((_base = event.client).silenced == null) {
              _base.silenced = false;
            }
            if ((_base1 = event.check).silenced == null) {
              _base1.silenced = false;
            }
            if (client === event.client.name) {
              if (check === null) {
                event.client.silenced = true;
                event.client.silence_html = $scope.buildSilencePopover(stash);
                break;
              } else {
                if (check === event.check.name) {
                  event.check.silenced = true;
                  event.check.silence_html = $scope.buildSilencePopover(stash);
                  break;
                }
              }
            }
          }
        }
        $('.silenceBtn').popover({
          trigger: 'click',
          html: true,
          placement: 'top',
          container: 'body',
          title: "Silence Details <button type=\"button\" class=\"btn btn-link btn-xs pull-right close_popover\" onclick=\"$('.silenceBtn').popover('hide')\"><span class=\"glyphicon glyphicon-remove\"></span>close</button>"
        });
        $('.close_popover').click(function() {
          return $('.silenceBtn').popover('hide');
        });
        $('body').on('click', function(e) {
          return $('[data-toggle="popover"]').each(function() {
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
              return $(this).popover('hide');
            }
          });
        });
        return $('.glyphicon-question-sign').tooltip();
      });
    };
    $scope.closePopovers = function() {
      return $('.silenceBtn').popover('hide');
    };
    $scope.updateSilencePath = function(path) {
      return $scope.silencePath = path;
    };
    $scope.saveSilence = function() {
      var author, comment, expiration, re, stash, timerToSec, timer_val, valid;
      valid = true;
      author = $('#author').val();
      if (author === '') {
        $('.silence_author').removeClass('has-success');
        $('.silence_author').addClass('has-error');
        valid = false;
      } else {
        $('.silence_author').removeClass('has-error');
        $('.silence_author').addClass('has-success');
      }
      comment = $('#comment').val();
      if (comment === '') {
        $('.silence_comment').removeClass('has-success');
        $('.silence_comment').addClass('has-error');
        valid = false;
      } else {
        $('.silence_comment').removeClass('has-error');
        $('.silence_comment').addClass('has-success');
      }
      timer_val = $('#timer_val').val();
      expiration = $('input[name=expiration]:checked', '#silence_form').val();
      if (expiration === 'timer') {
        re = new RegExp('^\\d*(m|h|d|w)$');
        if (re.test(timer_val)) {
          $('.silence_timer_val').removeClass('has-error');
          $('.silence_timer_val').addClass('has-success');
        } else {
          $('.silence_timer_val').removeClass('has-success');
          $('.silence_timer_val').addClass('has-error');
          valid = false;
        }
      } else {
        $('.silence_timer_val').removeClass('has-error');
        $('.silence_timer_val').removeClass('has-success');
      }
      timerToSec = function(val) {
        var conversion, q, quantity, u, unit;
        q = new RegExp('^\\d*');
        u = new RegExp('[a-z]$');
        conversion = {
          m: 60,
          h: 60 * 60,
          d: 60 * 60 * 24,
          w: 60 * 60 * 24 * 7
        };
        quantity = val.match(q)[0];
        unit = val.match(u)[0];
        return quantity * conversion[unit];
      };
      if (valid) {
        stash = {};
        stash['path'] = "silence/" + $scope.silencePath;
        stash['content'] = {};
        stash['content']['timestamp'] = Math.round((new Date().getTime()) / 1000);
        stash['content']['author'] = author;
        stash['content']['comment'] = comment;
        stash['content']['expiration'] = expiration;
        if (expiration === 'timer') {
          stash['expire'] = timerToSec(timer_val);
        }
        return stashesFactory.saveStash(stash).success(function(data, status, headers, config) {
          $scope.updateStashes();
          author = $('#author').val();
          $('.silence_author').removeClass('has-success');
          $('.silence_author').removeClass('has-error');
          comment = $('#comment').val();
          $('.silence_comment').removeClass('has-success');
          $('.silence_comment').removeClass('has-error');
          timer_val = $('#timer_val').val();
          expiration = $('input[name=expiration]:checked', '#silence_form').val();
          $('.silence_timer_val').removeClass('has-error');
          $('.silence_timer_val').removeClass('has-success');
          return $('#silence_window').modal('hide');
        }).error(function(data, status, headers, config) {
          return alert("Failed to silence: (" + status + ") " + data);
        });
      }
    };
    $scope.deleteSilence = function(path) {
      return stashesFactory.deleteStash(path).success(function(data, status, headers, config) {
        $scope.updateStashes();
        return $scope.closePopovers();
      }).error(function(data, status, headers, config) {
        return alert("Failed to delete silence");
      });
    };
    $scope.resolveEvent = function(client, check) {
      return eventsFactory.resolveEvent(client, check).success(function(data, status, headers, config) {
        return $scope.updateEvents();
      }).error(function(data, status, headers, config) {
        return alert("Faild to resolve event: " + client + "/" + check);
      });
    };
    $scope.updateParams = function() {
      $scope.search = $scope.search_field;
      $scope.sort = $scope.sort_field;
      $scope.limit = $scope.limit_field;
      $location.search('query', $scope.search);
      $location.search('sort', $scope.sort);
      $location.search('limit', $scope.limit);
      return $scope.updateEvents();
    };
    $scope.appendQuery = function(val, type, quote) {
      var q;
      if (type == null) {
        type = null;
      }
      if (quote == null) {
        quote = true;
      }
      q = '';
      if ($scope.search.length > 0) {
        if ($scope.alt_pressed) {
          q += ' AND NOT ';
        } else {
          q += ' AND ';
        }
      } else {
        if ($scope.alt_pressed) {
          q += '*:* AND NOT ';
        }
      }
      if (type != null) {
        q += type + ':';
      }
      if (quote) {
        q += "\"" + val + "\"";
      } else {
        q += "" + val;
      }
      $scope.search += q;
      $scope.search_field = $scope.search;
      $location.search('query', $scope.search);
      return $scope.updateEvents();
    };
    $scope.updateEvents = function() {
      if ($scope.first_search) {
        $scope.events_spin = true;
      }
      $scope.first_search = false;
      return eventsFactory.searchEvents($scope.search, $scope.sort, $scope.limit, $scope.event_fields_int).success(function(data, status, headers, config) {
        var check, client, color, event, events, field, id, k, parts, stash, stats, statuses, v, _base, _base1, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
        color = ['success', 'warning', 'danger', 'info'];
        status = ['OK', 'Warning', 'Critical', 'Unknown'];
        events = [];
        if ('bookmark' in data) {
          $scope.bookmark = data['bookmark'];
        }
        if ('count' in data) {
          $scope.count = data['count'];
        }
        if ('ranges' in data && !angular.equals($scope.previous_events_ranges, data['ranges']['status'])) {
          statuses = data['ranges']['status'];
          $scope.previous_events_ranges = statuses;
          $('#stats_status').find('#totals').find('.label-warning').text("Warning: " + statuses['Warning']);
          $('#stats_status').find('#totals').find('.label-danger').text("Critical: " + statuses['Critical']);
          $('#stats_status').find('#totals').find('.label-info').text("Unknown: " + statuses['Unknown']);
        }
        if ('counts' in data && !angular.equals($scope.previous_events_counts, data['counts'])) {
          $scope.previous_events_counts = data['counts'];
          stats = {};
          for (field in data['counts']) {
            stats[field] = [];
            _ref = data['counts'][field];
            for (k in _ref) {
              v = _ref[k];
              stats[field].push([k, v]);
            }
            stats[field].sort(function(a, b) {
              return a[1] - b[1];
            }).reverse();
          }
          $scope.stats = stats;
        }
        if ('rows' in data && !angular.equals($scope.previous_events_events, data['rows'])) {
          $scope.previous_events_events = angular.copy(data['rows']);
          _ref1 = data['rows'];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            event = _ref1[_i];
            event = event['doc']['event'];
            id = "" + event['client']['name'] + "/" + event['check']['name'];
            event['id'] = CryptoJS.MD5(id).toString(CryptoJS.enc.Base64);
            if ((_ref2 = event.id, __indexOf.call($scope.showDetails, _ref2) >= 0) || $scope.showAll === 'true') {
              event.showdetails = 'in';
            } else {
              event.showdetails = '';
            }
            event['color'] = color[event['check']['status']];
            event['wstatus'] = status[event['check']['status']];
            event['rel_time'] = moment.unix(event['check']['state_change']).fromNow();
            event['check']['issued'] = event['check']['issued'] * 1000;
            if (event['check']['state_change'] != null) {
              event['check']['state_change'] = event['check']['state_change'] * 1000;
            }
            if ((_base = event.client).silenced == null) {
              _base.silenced = false;
            }
            if ((_base1 = event.check).silenced == null) {
              _base1.silenced = false;
            }
            if ($scope.stashes != null) {
              _ref3 = $scope.stashes;
              for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
                stash = _ref3[_j];
                parts = stash['path'].split('/', 3);
                client = parts[1];
                if (parts.length > 2) {
                  check = parts[2];
                } else {
                  check = null;
                }
                if (client === event.client.name) {
                  if (check === null) {
                    event.client.silenced = true;
                    event.client.silence_html = $scope.buildSilencePopover(stash);
                  } else if (check === event.check.name) {
                    event.check.silenced = true;
                    event.check.silence_html = $scope.buildSilencePopover(stash);
                  }
                }
              }
            }
            events.push(event);
          }
          $scope.events_spin = false;
          if (!angular.equals($scope.events, events)) {
            $scope.events = events;
            $scope.updateStashes();
          }
        }
        $scope.events_spin = false;
        return $('#corner_status').text("Last Update: " + $filter('date')(Date.now(), 'mediumTime'));
      });
    };
    $scope.updateEventFields();
    $scope.updateEvents();
    $scope.changes = function() {
      var params;
      $log.info("STARTING _CHANGES FEED");
      params = {
        feed: 'longpoll',
        heartbeat: 10000
      };
      if ($scope.last_seq != null) {
        params['since'] = $scope.last_seq;
        return eventsFactory.changes(params).success(function(data, status, headers, config) {
          $scope.last_seq = data['last_seq'];
          $scope.updateEvents();
          if ($scope.isActive === true) {
            return $scope.changes();
          }
        }).error(function(data, status, headers, config) {
          $log.error("failed changes request (" + status + ") - " + data);
          if ($scope.isActive === true) {
            return $scope.changes();
          }
        });
      }
    };
    $scope.get_sequence = function() {
      return eventsFactory.last_sequence().success(function(data, status, headers, config) {
        $scope.last_seq = data['last_seq'];
        $log.info($scope.last_seq);
        return $scope.changes();
      });
    };
    $scope.get_sequence();
    $scope.bulkToggleDetails = function() {
      var action, event, _i, _j, _len, _len1, _ref, _ref1, _results;
      if ($scope.bulk === 'show') {
        action = 'show';
        $scope.showDetails = [];
        _ref = $scope.events;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          $scope.showDetails.push(event.id);
        }
      } else {
        action = 'hide';
        $scope.showDetails = [];
      }
      _ref1 = $scope.events;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        event = _ref1[_j];
        _results.push($("#" + event.id).collapse(action));
      }
      return _results;
    };
    $('.collapse').on('hide.bs.collapse', function() {
      if ($scope.showDetails.length === 0) {
        return $scope.bulk = 'show';
      }
    });
    $('.collapse').on('show.bs.collapse', function() {
      if ($scope.showDetails.length > 0) {
        return $scope.bulk = 'hide';
      }
    });
    $scope.toggleDetails = function(id) {
      var i;
      if (!$("#" + id).hasClass('in')) {
        $("#" + id).collapse('show');
        if ($scope.showDetails.indexOf(id) === -1) {
          $scope.showDetails.push(id);
        }
        $("#" + id).parent().find('.toggleBtnIcon').removeClass('glyphicon-collapse-down');
        return $("#" + id).parent().find('.toggleBtnIcon').addClass('glyphicon-collapse-up');
      } else {
        $("#" + id).collapse('hide');
        i = $scope.showDetails.indexOf(id);
        if (i !== -1) {
          $scope.showDetails.splice(i, 1);
        }
        $("#" + id).parent().find('.toggleBtnIcon').removeClass('glyphicon-collapse-up');
        return $("#" + id).parent().find('.toggleBtnIcon').addClass('glyphicon-collapse-down');
      }
    };
    $scope.togglePopover = function() {
      $(this).popover();
      return $(this).popover('toggle');
    };
    $scope.typeIsArray = function(value) {
      return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number' && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
    };
    $scope.to_trusted = function(html_code) {
      return $sce.trustAsHtml(html_code);
    };
    $scope.get_obj_attr = function(obj, path) {
      var p, val, _i, _len;
      path = path.split('.');
      val = obj;
      for (_i = 0, _len = path.length; _i < _len; _i++) {
        p = path[_i];
        if (p in val) {
          val = val[p];
        } else {
          val = null;
          break;
        }
      }
      return val;
    };
    /* Keyboard Shortcuts*/

    Mousetrap.bind('?', function() {
      $log.info('showing shortcuts');
      return $("#keyboard_shortcuts").modal('show');
    }, 'keyup');
    Mousetrap.bind('.', function() {
      return $('#search_input').focus();
    }, 'keyup');
    Mousetrap.bind('s', function() {
      $('#sort').focus();
      return $('#sort').click();
    }, 'keyup');
    return Mousetrap.bind('enter', function() {
      return $scope.updateParams();
    }, 'keyup');
  });

}).call(this);
