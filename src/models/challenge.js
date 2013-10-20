var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var helpers = require('habitrpg-shared/script/helpers');
var _ = require('lodash');

var ChallengeSchema = new Schema({
  _id: {type: String, 'default': helpers.uuid},
  name: String,
  description: String,
  habits: Array,
  dailys: Array,
  todos: Array,
  rewards: Array,
  leader: {type: String, ref: 'User'},
  group: {type: String, ref: 'Group'},
    //type: group.type, //type: {type: String,"enum": ['guild', 'party']},
    //id: group._id
  //},
  timestamp: {type: Date, 'default': Date.now},
  members: [{type: String, ref: 'User'}]
});


module.exports.schema = ChallengeSchema;
module.exports.model = mongoose.model("Challenge", ChallengeSchema);