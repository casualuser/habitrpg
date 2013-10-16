"use strict";

habitrpg.controller("ChallengesCtrl", ['$scope', '$rootScope', 'User',
  function($scope, $rootScope, User) {

    /*
      Sync any updates to challenges since last refresh. Do it after cron, so we don't punish them for new tasks
      This is challenge->user sync. user->challenge happens when user interacts with their tasks
    */

    app.on('ready', function(model) {
      return window.setTimeout(function() {
        return _.each(model.get('groups'), function(g) {
          var _ref;
          if ((_ref = this.uid, __indexOf.call(g.members, _ref) >= 0) && g.challenges) {
            _.each(g.challenges, function() {
              return app.challenges.syncChalToUser(g);
            });
          }
          return true;
        });
      }, 500);
    });
    /*
      Sync user to challenge (when they score, add to statistics)
    */

    app.model.on("change", "_page.user.priv.tasks.*.value", function(id, value, previous, passed) {
      /* Sync to challenge, but do it later*/

      var _this = this;
      return async.nextTick(function() {
        var chal, chalTask, chalUser, ctx, cu, model, pub, task, tobj;
        model = app.model;
        ctx = {
          model: model
        };
        task = model.at("_page.user.priv.tasks." + id);
        tobj = task.get();
        pub = model.get("_page.user.pub");
        if (((chalTask = helpers.taskInChallenge.call(ctx, tobj)) != null) && chalTask.get()) {
          chalTask.increment("value", value - previous);
          chal = model.at("groups." + tobj.group.id + ".challenges." + tobj.challenge);
          chalUser = function() {
            return helpers.indexedAt.call(ctx, chal.path(), 'members', {
              id: pub.id
            });
          };
          cu = chalUser();
          if (!(cu != null ? cu.get() : void 0)) {
            chal.push("members", {
              id: pub.id,
              name: model.get(pub.profile.name)
            });
            cu = model.at(chalUser());
          } else {
            cu.set('name', pub.profile.name);
          }
          return cu.set("" + tobj.type + "s." + tobj.id, {
            value: tobj.value,
            history: tobj.history
          });
        }
      });
    });
    /*
      Render graphs for user scores when the "Challenges" tab is clicked
    */

    /*
    TODO
    1) on main tab click or party
      * sort & render graphs for party
    2) guild -> all guilds
    3) public -> all public
    */

    /*
    $('#profile-challenges-tab-link').on 'shown', ->
      async.each _.toArray(model.get('groups')), (g) ->
        async.each _.toArray(g.challenges), (chal) ->
          async.each _.toArray(chal.tasks), (task) ->
            async.each _.toArray(chal.members), (member) ->
              if (history = member?["#{task.type}s"]?[task.id]?.history) and !!history
                data = google.visualization.arrayToDataTable _.map(history, (h)-> [h.date,h.value])
                options =
                  backgroundColor: { fill:'transparent' }
                  width: 150
                  height: 50
                  chartArea: width: '80%', height: '80%'
                  axisTitlePosition: 'none'
                  legend: position: 'bottom'
                  hAxis: gridlines: color: 'transparent' # since you can't seem to *remove* gridlines...
                  vAxis: gridlines: color: 'transparent'
                chart = new google.visualization.LineChart $(".challenge-#{chal.id}-member-#{member.id}-history-#{task.id}")[0]
                chart.draw(data, options)
    */

      /*
        Create
      */

      $scope.create = function(type, group) {
        //[type, gid] = [$(el).attr('data-type'), $(el).attr('data-gid')]
        var cid = window.habitrpgShared.helpers.uuid();
        this.model.set('_page.new.challenge', {
          id: cid,
          name: '',
          habits: [],
          dailys: [],
          todos: [],
          rewards: [],
          user: {
            uid: User.user._id
//            name: this.pub.get('profile.name') //TODO
          },
          group: {
            type: group.type,
            id: group._id
          },
          timestamp: +(new Date)
        });
      };
      /*
        Save
      */

      $scope.save = function() {
        var cid, gid, newChal, _ref;
        newChal = this.model.get('_page.new.challenge');
        _ref = [newChal.group.id, newChal.id], gid = _ref[0], cid = _ref[1];
        return this.model.push("_page.lists.challenges." + gid, newChal, function() {
          app.browser.growlNotification('Challenge Created', 'success');
          app.challenges.discard();
          return app.browser.resetDom();
        });
      };
      /*
        Toggle Edit
      */

      $scope.toggleEdit = function(e, el) {
        var path;
        path = "_page.editing.challenges." + ($(el).attr('data-id'));
        return this.model.set(path, !this.model.get(path));
      };
      /*
        Discard
      */

      $scope.discard = function() {
        return this.model.del('_page.new.challenge');
      };
      /*
        Delete
      */

      $scope["delete"] = function(e) {
        if (confirm("Delete challenge, are you sure?") !== true) {
          return;
        }
        return e.at().remove();
      };
      /*
        Add challenge name as a tag for user
      */

      $scope.syncChalToUser = function(chal) {
        var idx, tags,
          _this = this;
        if (!chal) {
          return;
        }
        /* Sync tags*/

        tags = this.priv.get('tags') || [];
        idx = _.findIndex(tags, {
          id: chal.id
        });
        if (~idx && (tags[idx].name !== chal.name)) {
          /* update the name - it's been changed since*/

          this.priv.set("tags." + idx + ".name", chal.name);
        } else {
          this.priv.push('tags', {
            id: chal.id,
            name: chal.name,
            challenge: true
          });
        }
        tags = {};
        tags[chal.id] = true;
        return _.each(chal.habits.concat(chal.dailys.concat(chal.todos.concat(chal.rewards))), function(task) {
          var path;
          _.defaults(task, {
            tags: tags,
            challenge: chal.id,
            group: {
              id: chal.group.id,
              type: chal.group.type
            }
          });
          path = "tasks." + task.id;
          if (_this.priv.get(path)) {
            _this.priv.set(path, _.defaults(_this.priv.get(path), task));
          } else {
            _this.model.push("_page.lists.tasks." + _this.uid + "." + task.type + "s", task);
          }
          return true;
        });
      };
      /*
        Subscribe
      */

      $scope.subscribe = function(e) {
        var chal, currChallenges;
        chal = e.get();
        /* Add all challenge's tasks to user's tasks*/

        currChallenges = this.pub.get('challenges');
        if (!(currChallenges && ~currChallenges.indexOf(chal.id))) {
          this.pub.unshift('challenges', chal.id);
        }
        e.at().push("members", {
          id: this.uid,
          name: this.pub.get('profile.name')
        });
        return app.challenges.syncChalToUser(chal);
      };
      /*
      --------------------------
       Unsubscribe functions
      --------------------------
      */

      $scope.unsubscribe = function(chal, keep) {
        var i, _ref,
          _this = this;
        if (keep == null) {
          keep = true;
        }
        /* Remove challenge from user*/

        i = (_ref = this.pub.get('challenges')) != null ? _ref.indexOf(chal.id) : void 0;
        if ((i != null) && ~i) {
          this.pub.remove("challenges", i, 1);
        }
        /* Remove user from challenge*/

        if (~(i = _.findIndex(chal.members, {
          id: this.uid
        }))) {
          this.model.remove("groups." + chal.group.id + ".challenges." + chal.id + ".members", i, 1);
        }
        /* Remove tasks from user*/

        return async.each(chal.habits.concat(chal.dailys.concat(chal.todos.concat(chal.rewards))), function(task) {
          var path;
          if (keep === true) {
            _this.priv.del("tasks." + task.id + ".challenge");
          } else {
            path = "_page.lists.tasks." + _this.uid + "." + task.type + "s";
            if (~(i = _.findIndex(_this.model.get(path), {
              id: task.id
            }))) {
              _this.model.remove(path, i, 1);
            }
          }
          return true;
        });
      };

      $scope.taskUnsubscribe = function(e, el) {
        /*
          since the challenge was deleted, we don't have its data to unsubscribe from - but we have the vestiges on the task
          FIXME this is a really dumb way of doing this
        */

        var deletedChal, i, path, tasks, tobj;
        tasks = this.priv.get('tasks');
        tobj = tasks[$(el).attr("data-tid")];
        deletedChal = {
          id: tobj.challenge,
          members: [this.uid],
          habits: _.where(tasks, {
            type: 'habit',
            challenge: tobj.challenge
          }),
          dailys: _.where(tasks, {
            type: 'daily',
            challenge: tobj.challenge
          }),
          todos: _.where(tasks, {
            type: 'todo',
            challenge: tobj.challenge
          }),
          rewards: _.where(tasks, {
            type: 'reward',
            challenge: tobj.challenge
          })
        };
        switch ($(el).attr('data-action')) {
          case 'keep':
            this.priv.del("tasks." + tobj.id + ".challenge");
            return this.priv.del("tasks." + tobj.id + ".group");
          case 'keep-all':
            return app.challenges.unsubscribe.call(this, deletedChal, true);
          case 'remove':
            path = "_page.lists.tasks." + this.uid + "." + tobj.type + "s";
            if (~(i = _.findIndex(this.model.get(path), {
              id: tobj.id
            }))) {
              return this.model.remove(path, i);
            }
            break;
          case 'remove-all':
            return app.challenges.unsubscribe.call(this, deletedChal, false);
        }
      };

      $scope.challengeUnsubscribe = function(e, el) {
        var _this = this;
        $(el).popover('destroy').popover({
          html: true,
          placement: 'top',
          trigger: 'manual',
          title: 'Unsubscribe From Challenge And:',
          content: "<a class=challenge-unsubscribe-and-remove>Remove Tasks</a><br/>\n<a class=challenge-unsubscribe-and-keep>Keep Tasks</a><br/>\n<a class=challenge-unsubscribe-cancel>Cancel</a><br/>"
        }).popover('show');
        $('.challenge-unsubscribe-and-remove').click(function() {
          return app.challenges.unsubscribe.call(_this, e.get(), false);
        });
        $('.challenge-unsubscribe-and-keep').click(function() {
          return app.challenges.unsubscribe.call(_this, e.get(), true);
        });
        return $('[class^=challenge-unsubscribe]').click(function() {
          return $(el).popover('destroy');
        });
      }

}]);
