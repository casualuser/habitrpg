// Generated by CoffeeScript 1.6.3
(function() {
  var helpers, _,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('lodash');

  helpers = require('habitrpg-shared/script/helpers');

  module.exports.app = function(appExports, model, app) {
    var browser, joinGroup, user, _currentTime;
    browser = require('./browser');
    _currentTime = model.at('_currentTime');
    _currentTime.setNull(+(new Date));
    setInterval((function() {
      return _currentTime.set(+(new Date));
    }), 60000);
    user = model.at('_user');
    appExports.groupCreate = function(e, el) {
      var newGroup, type;
      type = $(el).attr('data-type');
      newGroup = {
        name: model.get("_new.group.name"),
        description: model.get("_new.group.description"),
        leader: user.get('id'),
        members: [user.get('id')],
        type: type
      };
      if (type === 'party') {
        return model.add('groups', newGroup, function() {
          return location.reload();
        });
      }
      if (!(user.get('balance') >= 1)) {
        return $('#more-gems-modal').modal('show');
      }
      if (confirm("Create Guild for 4 Gems?")) {
        if (type === 'guild') {
          newGroup.privacy = model.get("_new.group.privacy") || 'public';
        }
        newGroup.balance = 1;
        return model.add('groups', newGroup, function() {
          return user.incr('balance', -1, function() {
            return location.reload();
          });
        });
      }
    };
    appExports.toggleGroupEdit = function(e, el) {
      var path;
      path = "_editing.groups." + ($(el).attr('data-gid'));
      return model.set(path, !model.get(path));
    };
    appExports.toggleLeaderMessageEdit = function(e, el) {
      var path;
      path = "_editing.leaderMessage." + ($(el).attr('data-gid'));
      return model.set(path, !model.get(path));
    };
    appExports.groupAddWebsite = function(e, el) {
      var test;
      test = e.get();
      e.at().unshift('websites', model.get('_newGroupWebsite'));
      return model.del('_newGroupWebsite');
    };
    appExports.groupInvite = function(e, el) {
      var uid;
      uid = model.get('_groupInvitee').replace(/[\s"]/g, '');
      model.set('_groupInvitee', '');
      if (_.isEmpty(uid)) {
        return;
      }
      return model.query('users').publicInfo([uid]).fetch(function(err, profiles) {
        var profile;
        if (err) {
          throw err;
        }
        profile = profiles.at(0).get();
        if (!profile) {
          return model.set("_groupError", "User with id " + uid + " not found.");
        }
        return model.query('groups').withMember(uid).fetch(function(err, g) {
          var gid, group, groupError, groups, invite, name, type, _ref, _ref1;
          if (err) {
            throw err;
          }
          group = e.get();
          groups = g.get();
          type = group.type, name = group.name;
          gid = group.id;
          groupError = function(msg) {
            return model.set("_groupError", msg);
          };
          invite = function() {
            $.bootstrapGrowl("Invitation Sent.");
            switch (type) {
              case 'guild':
                return model.push("users." + uid + ".invitations.guilds", {
                  id: gid,
                  name: name
                }, function() {
                  return location.reload();
                });
              case 'party':
                return model.set("users." + uid + ".invitations.party", {
                  id: gid,
                  name: name
                }, function() {
                  return location.reload();
                });
            }
          };
          switch (type) {
            case 'guild':
              if (((_ref = profile.invitations) != null ? _ref.guilds : void 0) && _.find(profile.invitations.guilds, {
                id: gid
              })) {
                return groupError("User already invited to that group");
              } else if (__indexOf.call(group.members, uid) >= 0) {
                return groupError("User already in that group");
              } else {
                return invite();
              }
              break;
            case 'party':
              if ((_ref1 = profile.invitations) != null ? _ref1.party : void 0) {
                return groupError("User already pending invitation.");
              } else if (_.find(groups, {
                type: 'party'
              })) {
                return groupError("User already in a party.");
              } else {
                return invite();
              }
          }
        });
      });
    };
    joinGroup = function(gid) {
      return model.push("groups." + gid + ".members", user.get('id'), function() {
        return location.reload();
      });
    };
    appExports.joinGroup = function(e, el) {
      return joinGroup(e.get('id'));
    };
    appExports.acceptInvitation = function(e, el) {
      var gid;
      gid = e.get('id');
      if ($(el).attr('data-type') === 'party') {
        return user.set('invitations.party', null, function() {
          return joinGroup(gid);
        });
      } else {
        return e.at().remove(function() {
          return joinGroup(gid);
        });
      }
    };
    appExports.rejectInvitation = function(e, el) {
      var clear;
      clear = function() {
        return browser.resetDom(model);
      };
      if (e.at().path().indexOf('party') !== -1) {
        return model.del(e.at().path(), clear);
      } else {
        return e.at().remove(clear);
      }
    };
    appExports.groupLeave = function(e, el) {
      var group, index, uid;
      if (confirm("Leave this group, are you sure?") === true) {
        uid = user.get('id');
        group = model.at("groups." + ($(el).attr('data-id')));
        index = group.get('members').indexOf(uid);
        if (index !== -1) {
          return group.remove('members', index, 1, function() {
            var updated;
            updated = group.get();
            if (_.isEmpty(updated.members) && (updated.type === 'party')) {
              return group.del(function() {
                return location.reload();
              });
            } else if (updated.leader === uid) {
              return group.set("leader", updated.members[0], function() {
                return location.reload();
              });
            } else {
              return location.reload();
            }
          });
        }
      }
    };
    /*
      Chat Functionality
    */

    model.on('unshift', '_party.chat', function() {
      return $('.chat-message').tooltip();
    });
    model.on('unshift', '_habitrpg.chat', function() {
      return $('.chat-message').tooltip();
    });
    appExports.sendChat = function(e, el) {
      var chat, group, members, message, messages, text, type, uniqMembers;
      text = model.get('_chatMessage');
      if (!/\S/.test(text)) {
        return;
      }
      group = e.at();
      members = group.get('members');
      uniqMembers = _.uniq(members);
      if (!_.isEqual(uniqMembers, members)) {
        group.set('members', uniqMembers);
      }
      chat = group.at('chat');
      model.set('_chatMessage', '');
      message = {
        id: model.id(),
        uuid: user.get('id'),
        contributor: user.get('backer.contributor'),
        npc: user.get('backer.npc'),
        text: text,
        user: helpers.username(model.get('_user.auth'), model.get('_user.profile.name')),
        timestamp: +(new Date)
      };
      messages = chat.get() || [];
      messages.unshift(message);
      messages.splice(200);
      chat.set(messages);
      type = $(el).attr('data-type');
      if (group.get('type') === 'party') {
        return model.set('_user.party.lastMessageSeen', chat.get()[0].id);
      }
    };
    appExports.chatKeyup = function(e, el, next) {
      if (e.keyCode !== 13) {
        return next();
      }
      return appExports.sendChat(e, el);
    };
    appExports.deleteChatMessage = function(e) {
      if (confirm("Delete chat message?") === true) {
        return e.at().remove();
      }
    };
    app.on('render', function(ctx) {
      return $('#party-tab-link').on('shown', function(e) {
        var messages;
        messages = model.get('_party.chat');
        if (!((messages != null ? messages.length : void 0) > 0)) {
          return false;
        }
        return model.set('_user.party.lastMessageSeen', messages[0].id);
      });
    });
    appExports.gotoPartyChat = function() {
      return model.set('_gamePane', true, function() {
        return $('#party-tab-link').tab('show');
      });
    };
    return appExports.assignGroupLeader = function(e, el) {
      var newLeader;
      newLeader = model.get('_new.groupLeader');
      if (newLeader && (confirm("Assign new leader, you sure?") === true)) {
        if (newLeader) {
          return e.at().set('leader', newLeader, function() {
            return browser.resetDom(model);
          });
        }
      }
    };
  };

}).call(this);

/*
//@ sourceMappingURL=groups.map
*/